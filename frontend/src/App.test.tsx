import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";

import App from "./App";

describe("App", () => {
  beforeEach(() => {
    const requirements = [
      {
        id: 1,
        title: "登录需求",
        raw_input: null,
        summary: "登录需求摘要",
        business_value: null,
        acceptance_criteria: null,
        design_links_json: null,
        status: "draft",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
      {
        id: 2,
        title: "计费需求",
        raw_input: null,
        summary: "计费需求摘要",
        business_value: null,
        acceptance_criteria: null,
        design_links_json: null,
        status: "ready",
        created_at: "2026-01-02T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      },
    ];

    const scenario = {
      id: 11,
      requirement_id: 1,
      feature_name: "身份认证",
      scenario_title: "用户使用短信验证码登录",
      given_text: "用户已进入登录页面",
      when_text: "用户提交有效验证码",
      then_text: "系统完成登录",
      coverage_frontend: true,
      coverage_backend: true,
      coverage_app: false,
      status: "draft",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const task = {
      id: 21,
      requirement_id: 1,
      scenario_id: 11,
      title: "实现验证码校验",
      description: "新增验证码校验接口",
      task_type: "backend",
      owner_name: "backend-dev",
      status: "todo",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const acceptanceRun = {
      id: 31,
      requirement_id: 1,
      status: "passed",
      notes: "冒烟验证通过",
      recorded_by: "测试-冒烟",
      created_at: "2026-01-01T00:00:00Z",
    };

    let detailStates = {
      1: {
        requirement: requirements[0],
        scenarios: [] as typeof scenario[],
        tasks: [] as typeof task[],
        acceptance_runs: [] as typeof acceptanceRun[],
        github_links: [],
        test_summaries: [],
      },
      2: {
        requirement: requirements[1],
        scenarios: [scenario] as typeof scenario[],
        tasks: [task] as typeof task[],
        acceptance_runs: [{ ...acceptanceRun, id: 32, requirement_id: 2, status: "blocked", recorded_by: "测试-阻塞", notes: "受上游阻塞" }] as typeof acceptanceRun[],
        github_links: [],
        test_summaries: [],
      },
    };

    let dashboardMode: "success" | "empty" | "error" = "success";

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.endsWith("/api/requirements") && method === "GET") {
        return Promise.resolve(
          new Response(
            JSON.stringify(requirements),
            { status: 200 },
          ),
        );
      }

      if (url.endsWith("/api/requirements/1/detail") && method === "GET") {
        return Promise.resolve(
          new Response(
            JSON.stringify(detailStates[1]),
            { status: 200 },
          ),
        );
      }

      if (url.endsWith("/api/requirements/2/detail") && method === "GET") {
        return Promise.resolve(
          new Response(
            JSON.stringify(detailStates[2]),
            { status: 200 },
          ),
        );
      }

      if (url.endsWith("/api/dashboard/summary") && method === "GET") {
        if (dashboardMode === "error") {
          return Promise.resolve(new Response(JSON.stringify({ detail: "dashboard failed" }), { status: 500 }));
        }

        const rows = Object.values(detailStates).map((detailState) => ({
          id: detailState.requirement.id,
          title: detailState.requirement.title,
          status: detailState.requirement.status,
          scenario_count: detailState.scenarios.length,
          task_count: detailState.tasks.length,
          latest_acceptance_status: detailState.acceptance_runs[0]?.status ?? "none",
          latest_test_summary_result: detailState.test_summaries[0]?.result ?? "none",
          health:
            detailState.acceptance_runs[0]?.status === "passed"
              ? "Accepted"
              : detailState.scenarios.length === 0
                ? "Needs Definition"
                : ["failed", "blocked"].includes(detailState.acceptance_runs[0]?.status ?? "none") || detailState.tasks.length === 0
                  ? "At Risk"
                  : "In Progress",
          needs_attention:
            detailState.scenarios.length === 0
            || detailState.tasks.length === 0
            || ["failed", "blocked"].includes(detailState.acceptance_runs[0]?.status ?? "none"),
          updated_at: detailState.requirement.updated_at,
        }));

        const effectiveRows = dashboardMode === "empty" ? [] : rows;
        const attentionNeeded = effectiveRows
          .filter((row) => row.needs_attention)
          .map((row) => ({
            id: row.id,
            title: row.title,
            health: row.health,
            summary: `${row.scenario_count === 0 ? "Missing scenarios. " : ""}${row.task_count === 0 ? "Missing tasks. " : ""}${["failed", "blocked"].includes(row.latest_acceptance_status) ? `Acceptance is ${row.latest_acceptance_status}.` : ""}`.trim(),
          }));

        return Promise.resolve(
          new Response(
            JSON.stringify({
              counts: {
                total_requirements: effectiveRows.length,
                draft_requirements: effectiveRows.filter((row) => row.status === "draft").length,
                ready_requirements: effectiveRows.filter((row) => row.status === "ready").length,
                accepted_requirements: effectiveRows.filter((row) => row.latest_acceptance_status === "passed").length,
                at_risk_requirements: effectiveRows.filter((row) => row.health === "At Risk").length,
                missing_scenarios_requirements: effectiveRows.filter((row) => row.scenario_count === 0).length,
                missing_tasks_requirements: effectiveRows.filter((row) => row.task_count === 0).length,
                in_progress_requirements: effectiveRows.filter((row) => row.health === "In Progress").length,
                ready_for_review_requirements: effectiveRows.filter((row) => row.health === "Ready for Review").length,
              },
              rows: effectiveRows,
              attention_needed: attentionNeeded,
              recommended_actions: [
                { owner: "Business Owner", summary: "Review requirements with missing scenarios to tighten user flows and acceptance intent." },
                { owner: "Delivery Lead", summary: "Prioritize requirements with blocked or failed acceptance before pulling more scope into delivery." },
                { owner: "QA / Release", summary: "Use accepted requirements as the shortlist for demo readiness, rollout planning, and stakeholder updates." },
              ],
            }),
            { status: 200 },
          ),
        );
      }

      if (url.endsWith("/api/requirements/1/scenarios") && method === "POST") {
        detailStates = {
          ...detailStates,
          1: {
            ...detailStates[1],
          scenarios: [scenario],
          },
        };

        return Promise.resolve(new Response(JSON.stringify(scenario), { status: 201 }));
      }

      if (url.endsWith("/api/requirements/1/tasks") && method === "POST") {
        detailStates = {
          ...detailStates,
          1: {
            ...detailStates[1],
          tasks: [task],
          },
        };

        return Promise.resolve(new Response(JSON.stringify(task), { status: 201 }));
      }

      if (url.endsWith("/api/requirements/1/acceptance-runs") && method === "POST") {
        detailStates = {
          ...detailStates,
          1: {
            ...detailStates[1],
          acceptance_runs: [acceptanceRun],
          },
        };

        return Promise.resolve(new Response(JSON.stringify(acceptanceRun), { status: 201 }));
      }

      if (url.endsWith("/api/ai/requirement-draft")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              title: "生成的需求",
              summary: "生成的摘要",
              business_value: "生成的业务价值",
              acceptance_criteria: "生成的验收标准",
              status: "draft",
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("__dashboardTestControls", {
      setMode: (mode: "success" | "empty" | "error") => {
        dashboardMode = mode;
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setDashboardMode(mode: "success" | "empty" | "error") {
    const controls = globalThis.__dashboardTestControls as {
      setMode: (nextMode: "success" | "empty" | "error") => void;
    };
    controls.setMode(mode);
  }

  it("renders requirements and selected detail", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "添加场景" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加任务" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "记录验收" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加 GitHub 链接" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "添加测试摘要" })).toBeInTheDocument();
  });

  it("shows editable requirement 草稿 preview", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("原始业务输入"), {
      target: { value: "需要支持登录" },
    });
    fireEvent.click(screen.getByRole("button", { name: "生成需求草稿" }));

    await waitFor(() => {
      expect(screen.getByLabelText("草稿需求标题")).toHaveValue(
        "生成的需求",
      );
    });

    expect(screen.getByLabelText("需求标题")).toHaveValue("生成的需求");
    expect(screen.getByLabelText("草稿需求摘要")).toHaveValue("生成的摘要");
    expect(screen.getByRole("button", { name: "将草稿填入表单" })).toBeInTheDocument();
  });

  it("opens requirement edit form from detail card", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "编辑" }));

    expect(screen.getByLabelText("编辑需求标题")).toHaveValue("登录需求");
    expect(screen.getByRole("button", { name: "保存需求" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "取消" })).toBeInTheDocument();
  });

  it("renders the dashboard summary view", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "交付总览" })).toBeInTheDocument();
    });

    expect(screen.getByText("需求总数")).toBeInTheDocument();
    expect(screen.getByText("需求汇总")).toBeInTheDocument();
    expect(screen.getByText("管理摘要")).toBeInTheDocument();
    expect(screen.getByText("指标说明")).toBeInTheDocument();
    expect(screen.getByText("待关注事项")).toBeInTheDocument();
    expect(screen.getByText("建议动作")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
  });

  it("renders executive, attention, and accepted scope content for dashboard", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByText("管理摘要")).toBeInTheDocument();
    });

    expect(screen.getByText(/发布准备度/)).toBeInTheDocument();
    expect(screen.getByText(/执行风险/)).toBeInTheDocument();
    expect(screen.getByText(/定义缺口/)).toBeInTheDocument();

    expect(screen.getByText(/Acceptance is blocked\./)).toBeInTheDocument();
    expect(screen.getAllByText(/计费需求/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/受上游阻塞/)).not.toBeInTheDocument();
    expect(screen.getAllByText("阻塞").length).toBeGreaterThan(0);

    expect(screen.getByText("已验收范围快照")).toBeInTheDocument();
    expect(screen.getByText("当前还没有需求通过验收。")).toBeInTheDocument();
  });

  it("filters dashboard rows and clears filters", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "交付总览" })).toBeInTheDocument();
    });

    expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("总览状态筛选"), {
      target: { value: "ready" },
    });

    expect(screen.queryByRole("cell", { name: "登录需求" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("总览验收筛选"), {
      target: { value: "passed" },
    });

    expect(screen.getByText("没有需求符合当前筛选条件。请清空筛选以恢复完整列表。")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));

    expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
  });

  it("applies dashboard card filters and opens workspace from a row", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "交付总览" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText("缺少场景")[0]);

    expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "计费需求" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("需求总数"));
    fireEvent.click(screen.getByRole("cell", { name: "计费需求" }));

    await waitFor(() => {
      expect(screen.getByText("计费需求摘要")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "总览" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "计费需求" })).toBeInTheDocument();
  });

  it("shows dashboard empty state when no summary data exists", async () => {
    setDashboardMode("empty");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByText("暂无需求")).toBeInTheDocument();
    });

    expect(screen.getByText("请先在工作台中创建第一个需求，以生成交付总览。")).toBeInTheDocument();
  });

  it("shows dashboard error state and retries successfully", async () => {
    setDashboardMode("error");
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByText("总览暂时不可用")).toBeInTheDocument();
    });

    setDashboardMode("success");
    fireEvent.click(screen.getByRole("button", { name: "重新加载总览" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
  });

  it("shows dashboard loading state before summary resolves", async () => {
    let releaseDashboard: (() => void) | null = null;

    const originalFetch = globalThis.fetch;
    const delayedFetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/dashboard/summary")) {
        return new Promise<Response>((resolve) => {
          releaseDashboard = () => {
            void originalFetch(input, init).then(resolve);
          };
        });
      }

      return originalFetch(input, init);
    });

    vi.stubGlobal("fetch", delayedFetch);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    expect(screen.getByText("正在加载总览")).toBeInTheDocument();
    expect(screen.getByText("正在刷新汇总卡片和需求汇总数据。")).toBeInTheDocument();

    releaseDashboard?.();

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });
  });

  it("filters dashboard rows by health and clears filters", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("总览健康度筛选"), {
      target: { value: "needs-definition" },
    });

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("cell", { name: "计费需求" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
  });

  it("supports dashboard quick-filter cards and insight drill-down", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("总览健康度筛选"), {
      target: { value: "at-risk" },
    });

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("cell", { name: "登录需求" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /登录需求/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "总览" })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: "登录需求" })).toBeInTheDocument();
  });

  it("lets executive summary signals focus the dashboard", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /执行风险/ }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("cell", { name: "登录需求" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /定义缺口/ }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("cell", { name: "计费需求" })).not.toBeInTheDocument();
  });

  it("shows active dashboard filters and clears them individually", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "登录需求" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("总览健康度筛选"), {
      target: { value: "needs-definition" },
    });
    fireEvent.change(screen.getByLabelText("总览可追踪性筛选"), {
      target: { value: "missing-scenarios" },
    });

    expect(screen.getByRole("button", { name: "健康度: 待澄清 ×" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "可追踪性: 缺少场景 ×" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "健康度: 待澄清 ×" }));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "健康度: 待澄清 ×" })).not.toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "可追踪性: 缺少场景 ×" })).toBeInTheDocument();
  });

  it("renders dashboard table state fields as badges", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "总览" }));

    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "计费需求" })).toBeInTheDocument();
    });

    expect(screen.getAllByText("草稿").some((element) => element.classList.contains("dashboard-badge-status"))).toBe(true);
    expect(screen.getAllByText("阻塞").some((element) => element.classList.contains("dashboard-badge-acceptance"))).toBe(true);
    expect(screen.getAllByText("待澄清").some((element) => element.classList.contains("dashboard-badge-health"))).toBe(true);
  });

  it("completes the core smoke interaction flow", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("登录需求摘要")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("功能名称"), {
      target: { value: "身份认证" },
    });
    fireEvent.change(screen.getByLabelText("场景标题"), {
      target: { value: "用户使用短信验证码登录" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加场景" }));

    await waitFor(() => {
      expect(screen.getByText("用户使用短信验证码登录")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("任务标题"), {
      target: { value: "实现验证码校验" },
    });
    fireEvent.change(screen.getByLabelText("任务描述"), {
      target: { value: "新增验证码校验接口" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加任务" }));

    await waitFor(() => {
      expect(screen.getByText("实现验证码校验")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("记录人"), {
      target: { value: "测试-冒烟" },
    });
    fireEvent.change(screen.getByLabelText("验收备注"), {
      target: { value: "冒烟验证通过" },
    });
    fireEvent.change(screen.getByLabelText("验收状态"), {
      target: { value: "passed" },
    });
    fireEvent.click(screen.getByRole("button", { name: "记录验收" }));

    await waitFor(() => {
      expect(screen.getByText("测试-冒烟")).toBeInTheDocument();
    });

    const acceptanceSection = screen.getByRole("heading", { name: "验收记录" }).closest("article");

    expect(acceptanceSection).not.toBeNull();
    expect(within(acceptanceSection as HTMLElement).getByText("冒烟验证通过")).toBeInTheDocument();
    expect(within(acceptanceSection as HTMLElement).getByText("测试-冒烟")).toBeInTheDocument();
  });
});



