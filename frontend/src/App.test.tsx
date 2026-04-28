import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "./App";

describe("App", () => {
  beforeEach(() => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.endsWith("/api/requirements") && (!init || init.method === undefined)) {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: 1,
                title: "Login requirement",
                raw_input: null,
                summary: "Login summary",
                business_value: null,
                acceptance_criteria: null,
                design_links_json: null,
                status: "draft",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
            ]),
            { status: 200 },
          ),
        );
      }

      if (url.endsWith("/api/requirements/1/detail")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              requirement: {
                id: 1,
                title: "Login requirement",
                raw_input: null,
                summary: "Login summary",
                business_value: null,
                acceptance_criteria: null,
                design_links_json: null,
                status: "draft",
                created_at: "2026-01-01T00:00:00Z",
                updated_at: "2026-01-01T00:00:00Z",
              },
              scenarios: [],
              tasks: [],
              acceptance_runs: [],
              github_links: [],
              test_summaries: [],
            }),
            { status: 200 },
          ),
        );
      }

      if (url.endsWith("/api/ai/requirement-draft")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              title: "Generated requirement",
              summary: "Generated summary",
              business_value: "Generated value",
              acceptance_criteria: "Generated criteria",
              status: "draft",
            }),
            { status: 200 },
          ),
        );
      }

      return Promise.reject(new Error(`Unhandled request: ${url}`));
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders requirements and selected detail", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Login requirement")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Login summary")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: "Add Scenario" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Task" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record Acceptance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add GitHub Link" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Test Summary" })).toBeInTheDocument();
  });

  it("shows editable requirement draft preview", async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText("Raw business input"), {
      target: { value: "Need login" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Generate Requirement Draft" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Draft requirement title")).toHaveValue(
        "Generated requirement",
      );
    });

    expect(screen.getByLabelText("Requirement title")).toHaveValue("Generated requirement");
    expect(screen.getByLabelText("Draft requirement summary")).toHaveValue("Generated summary");
    expect(screen.getByRole("button", { name: "Use Draft in Form" })).toBeInTheDocument();
  });

  it("opens requirement edit form from detail card", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Login summary")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByLabelText("Edit requirement title")).toHaveValue("Login requirement");
    expect(screen.getByRole("button", { name: "Save Requirement" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });
});
