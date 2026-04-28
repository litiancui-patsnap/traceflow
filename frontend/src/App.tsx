import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { copy } from "./copy";
import { displayAcceptanceStatus, displayDashboardHealth, displayRequirementStatus, displayScenarioStatus, displayTaskStatus, displayTaskType, displayTestSummaryResult } from "./display";
import { RequirementDraftPanel } from "./components/RequirementDraftPanel";
import { ScenarioDraftEditor } from "./components/ScenarioDraftEditor";
import { TaskDraftEditor } from "./components/TaskDraftEditor";
import type {
  AcceptanceRun,
  DashboardAttentionItem,
  DashboardSummaryCounts,
  DashboardRecommendedAction,
  DashboardRequirementSummary,
  GitHubLink,
  Requirement,
  RequirementDraftResponse,
  Scenario,
  ScenarioDraftResponse,
  Task,
  TaskBreakdownDraftResponse,
  TestSummary,
} from "./types";

type LoadState = "idle" | "loading" | "ready" | "error";
type AIKind = "requirement" | "scenario" | "task";
type ViewMode = "workspace" | "dashboard";
type DashboardStatusFilter = "all" | "draft" | "ready" | "in_progress" | "blocked" | "done";
type DashboardAcceptanceFilter = "all" | "passed" | "failed" | "blocked" | "none";
type DashboardHealthFilter = "all" | "accepted" | "at-risk" | "needs-definition" | "in-progress" | "ready-for-review";
type DashboardTraceabilityFilter = "all" | "missing-scenarios" | "missing-tasks";

const emptyRequirementForm = { title: "", summary: "", business_value: "", acceptance_criteria: "", status: "draft" };
const emptyScenarioForm = { feature_name: "", scenario_title: "", given_text: "", when_text: "", then_text: "", coverage_frontend: false, coverage_backend: false, coverage_app: false, status: "draft" };
const emptyTaskForm = { title: "", description: "", task_type: "backend", owner_name: "", status: "todo" };
const emptyAcceptanceForm = { status: "pending", notes: "", recorded_by: "" };
const emptyGitHubLinkForm = { link_type: "issue", url: "", label: "" };
const emptyTestSummaryForm = { source: "playwright", result: "passed", summary: "", report_url: "" };
const emptyDraftForm = { raw_input: "", business_context: "", design_hints: "" };
const emptyRequirementEditForm = {
  title: "",
  summary: "",
  business_value: "",
  acceptance_criteria: "",
  status: "draft",
};

function badgeClassName(kind: "status" | "acceptance" | "health", value: string) {
  const normalized = value.toLowerCase().replace(/\s+/g, "-");
  return `dashboard-badge dashboard-badge-${kind} dashboard-badge-${normalized}`;
}

export default function App() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("workspace");
  const [selectedRequirementId, setSelectedRequirementId] = useState<number | null>(null);
  const [selectedRequirement, setSelectedRequirement] = useState<Requirement | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [acceptanceRuns, setAcceptanceRuns] = useState<AcceptanceRun[]>([]);
  const [githubLinks, setGitHubLinks] = useState<GitHubLink[]>([]);
  const [testSummaries, setTestSummaries] = useState<TestSummary[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [detailState, setDetailState] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState<Record<AIKind, boolean>>({ requirement: false, scenario: false, task: false });
  const [requirementForm, setRequirementForm] = useState(emptyRequirementForm);
  const [scenarioForm, setScenarioForm] = useState(emptyScenarioForm);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [acceptanceForm, setAcceptanceForm] = useState(emptyAcceptanceForm);
  const [githubLinkForm, setGitHubLinkForm] = useState(emptyGitHubLinkForm);
  const [testSummaryForm, setTestSummaryForm] = useState(emptyTestSummaryForm);
  const [draftForm, setDraftForm] = useState(emptyDraftForm);
  const [isEditingRequirement, setIsEditingRequirement] = useState(false);
  const [requirementEditForm, setRequirementEditForm] = useState(emptyRequirementEditForm);
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [editingScenarioForm, setEditingScenarioForm] = useState(emptyScenarioForm);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskForm, setEditingTaskForm] = useState(emptyTaskForm);
  const [requirementDraft, setRequirementDraft] = useState<RequirementDraftResponse | null>(null);
  const [scenarioDraft, setScenarioDraft] = useState<ScenarioDraftResponse | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskBreakdownDraftResponse | null>(null);
  const [dashboardRows, setDashboardRows] = useState<DashboardRequirementSummary[]>([]);
  const [dashboardAttentionItems, setDashboardAttentionItems] = useState<DashboardAttentionItem[]>([]);
  const [dashboardRecommendedActions, setDashboardRecommendedActions] = useState<DashboardRecommendedAction[]>([]);
  const [dashboardCounts, setDashboardCounts] = useState<DashboardSummaryCounts>({
    total_requirements: 0,
    draft_requirements: 0,
    ready_requirements: 0,
    accepted_requirements: 0,
    at_risk_requirements: 0,
    missing_scenarios_requirements: 0,
    missing_tasks_requirements: 0,
    in_progress_requirements: 0,
    ready_for_review_requirements: 0,
  });
  const [dashboardState, setDashboardState] = useState<LoadState>("idle");
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<DashboardStatusFilter>("all");
  const [dashboardAcceptanceFilter, setDashboardAcceptanceFilter] = useState<DashboardAcceptanceFilter>("all");
  const [dashboardHealthFilter, setDashboardHealthFilter] = useState<DashboardHealthFilter>("all");
  const [dashboardTraceabilityFilter, setDashboardTraceabilityFilter] = useState<DashboardTraceabilityFilter>("all");

  useEffect(() => {
    void loadRequirements();
  }, []);

  useEffect(() => {
    if (viewMode === "dashboard") void loadDashboard();
  }, [viewMode, requirements]);

  useEffect(() => {
    if (selectedRequirementId !== null) void loadRequirementDetails(selectedRequirementId);
  }, [selectedRequirementId]);

  async function safeRun(fn: () => Promise<void>) {
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  }

  async function loadRequirements() {
    setLoadState("loading");
    try {
      const data = await api.listRequirements();
      setRequirements(data);
      setLoadState("ready");
      if (data.length > 0 && selectedRequirementId === null) setSelectedRequirementId(data[0].id);
    } catch (err) {
      setLoadState("error");
      setError(err instanceof Error ? err.message : "Failed to load requirements");
    }
  }

  async function loadRequirementDetails(requirementId: number) {
    setDetailState("loading");
    try {
      const detail = await api.getRequirementDetail(requirementId);
      setSelectedRequirement(detail.requirement);
      setScenarios(detail.scenarios);
      setTasks(detail.tasks);
      setAcceptanceRuns(detail.acceptance_runs);
      setGitHubLinks(detail.github_links);
      setTestSummaries(detail.test_summaries);
      setDetailState("ready");
    } catch (err) {
      setDetailState("error");
      setError(err instanceof Error ? err.message : "Failed to load requirement details");
    }
  }

  async function loadDashboard() {
    setDashboardState("loading");
    try {
      const summary = await api.getDashboardSummary();
      setDashboardCounts(summary.counts);
      setDashboardRows(summary.rows);
      setDashboardAttentionItems(summary.attention_needed);
      setDashboardRecommendedActions(summary.recommended_actions);
      setDashboardState("ready");
    } catch (err) {
      setDashboardCounts({
        total_requirements: 0,
        draft_requirements: 0,
        ready_requirements: 0,
        accepted_requirements: 0,
        at_risk_requirements: 0,
        missing_scenarios_requirements: 0,
        missing_tasks_requirements: 0,
        in_progress_requirements: 0,
        ready_for_review_requirements: 0,
      });
      setDashboardRows([]);
      setDashboardAttentionItems([]);
      setDashboardRecommendedActions([]);
      setDashboardState("error");
      setError(err instanceof Error ? err.message : "Failed to load dashboard summary");
    }
  }

  function openRequirementFromDashboard(requirementId: number) {
    setViewMode("workspace");
    setSelectedRequirementId(requirementId);
  }

  function clearDashboardFilters() {
    setDashboardStatusFilter("all");
    setDashboardAcceptanceFilter("all");
    setDashboardHealthFilter("all");
    setDashboardTraceabilityFilter("all");
  }

  function applyExecutiveSignalFilter(signalTitle: string) {
    clearDashboardFilters();
    if (signalTitle === copy.dashboard.executiveSignals.releaseReadinessTitle) {
      setDashboardHealthFilter("accepted");
      return;
    }
    if (signalTitle === copy.dashboard.executiveSignals.executionRiskTitle) {
      setDashboardHealthFilter("at-risk");
      return;
    }
    if (signalTitle === copy.dashboard.executiveSignals.definitionGapsTitle) {
      setDashboardHealthFilter("needs-definition");
    }
  }

  function clearDashboardFilter(kind: "status" | "acceptance" | "health" | "traceability") {
    if (kind === "status") setDashboardStatusFilter("all");
    if (kind === "acceptance") setDashboardAcceptanceFilter("all");
    if (kind === "health") setDashboardHealthFilter("all");
    if (kind === "traceability") setDashboardTraceabilityFilter("all");
  }

  function setDraftLoading(kind: AIKind, value: boolean) {
    setAiLoading((current) => ({ ...current, [kind]: value }));
  }

  function applyRequirementDraft(draft: RequirementDraftResponse) {
    setRequirementForm({
      title: draft.title,
      summary: draft.summary,
      business_value: draft.business_value,
      acceptance_criteria: draft.acceptance_criteria,
      status: draft.status,
    });
  }

  function beginRequirementEdit() {
    if (!selectedRequirement) return;
    setRequirementEditForm({
      title: selectedRequirement.title,
      summary: selectedRequirement.summary || "",
      business_value: selectedRequirement.business_value || "",
      acceptance_criteria: selectedRequirement.acceptance_criteria || "",
      status: selectedRequirement.status,
    });
    setIsEditingRequirement(true);
  }

  function cancelRequirementEdit() {
    setIsEditingRequirement(false);
    setRequirementEditForm(emptyRequirementEditForm);
  }

  function beginScenarioEdit(scenario: Scenario) {
    setEditingScenarioId(scenario.id);
    setEditingScenarioForm({
      feature_name: scenario.feature_name,
      scenario_title: scenario.scenario_title,
      given_text: scenario.given_text || "",
      when_text: scenario.when_text || "",
      then_text: scenario.then_text || "",
      coverage_frontend: scenario.coverage_frontend,
      coverage_backend: scenario.coverage_backend,
      coverage_app: scenario.coverage_app,
      status: scenario.status,
    });
  }

  function cancelScenarioEdit() {
    setEditingScenarioId(null);
    setEditingScenarioForm(emptyScenarioForm);
  }

  function beginTaskEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditingTaskForm({
      title: task.title,
      description: task.description || "",
      task_type: task.task_type,
      owner_name: task.owner_name || "",
      status: task.status,
    });
  }

  function cancelTaskEdit() {
    setEditingTaskId(null);
    setEditingTaskForm(emptyTaskForm);
  }

  function scenarioText() {
    return scenarios.length
      ? scenarios
          .map((scenario) => `功能：${scenario.feature_name}\n场景：${scenario.scenario_title}\n前提：${scenario.given_text || ""}\n当：${scenario.when_text || ""}\n则：${scenario.then_text || ""}`)
          .join("\n\n")
      : undefined;
  }

  async function handleRequirementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await safeRun(async () => {
      const created = await api.createRequirement(requirementForm);
      setRequirementForm(emptyRequirementForm);
      setRequirementDraft(null);
      await loadRequirements();
      setSelectedRequirementId(created.id);
    });
  }

  async function handleRequirementDraft() {
    if (!draftForm.raw_input.trim()) return;
    setDraftLoading("requirement", true);
    await safeRun(async () => {
      const draft = await api.generateRequirementDraft({
        raw_input: draftForm.raw_input,
        business_context: draftForm.business_context || undefined,
        design_hints: draftForm.design_hints || undefined,
      });
      setRequirementDraft(draft);
      applyRequirementDraft(draft);
    });
    setDraftLoading("requirement", false);
  }

  async function handleScenarioSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.createScenario(selectedRequirementId, {
        ...scenarioForm,
        given_text: scenarioForm.given_text || null,
        when_text: scenarioForm.when_text || null,
        then_text: scenarioForm.then_text || null,
      });
      setScenarioForm(emptyScenarioForm);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleRequirementEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedRequirementId) return;
    await safeRun(async () => {
      await api.updateRequirement(selectedRequirementId, {
        ...requirementEditForm,
        summary: requirementEditForm.summary || null,
        business_value: requirementEditForm.business_value || null,
        acceptance_criteria: requirementEditForm.acceptance_criteria || null,
      });
      cancelRequirementEdit();
      await loadRequirements();
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleScenarioDraft() {
    if (!selectedRequirement) return;
    setDraftLoading("scenario", true);
    await safeRun(async () => {
      const draft = await api.generateScenarioDraft({
        title: selectedRequirement.title,
        summary: selectedRequirement.summary || undefined,
        acceptance_criteria: selectedRequirement.acceptance_criteria || undefined,
      });
      setScenarioDraft(draft);
      if (draft.scenarios[0]) {
        const first = draft.scenarios[0];
        setScenarioForm({
          feature_name: draft.feature_name,
          scenario_title: first.scenario_title,
          given_text: first.given_text || "",
          when_text: first.when_text || "",
          then_text: first.then_text || "",
          coverage_frontend: first.coverage_frontend,
          coverage_backend: first.coverage_backend,
          coverage_app: first.coverage_app,
          status: first.status,
        });
      }
    });
    setDraftLoading("scenario", false);
  }

  async function saveScenarioDrafts() {
    if (selectedRequirementId === null || !scenarioDraft) return;
    await safeRun(async () => {
      await Promise.all(
        scenarioDraft.scenarios.map((item) =>
          api.createScenario(selectedRequirementId, {
            feature_name: scenarioDraft.feature_name,
            scenario_title: item.scenario_title,
            given_text: item.given_text || null,
            when_text: item.when_text || null,
            then_text: item.then_text || null,
            coverage_frontend: item.coverage_frontend,
            coverage_backend: item.coverage_backend,
            coverage_app: item.coverage_app,
            status: item.status,
          }),
        ),
      );
      setScenarioDraft(null);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleScenarioEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingScenarioId || selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.updateScenario(editingScenarioId, {
        ...editingScenarioForm,
        given_text: editingScenarioForm.given_text || null,
        when_text: editingScenarioForm.when_text || null,
        then_text: editingScenarioForm.then_text || null,
      });
      cancelScenarioEdit();
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleTaskSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.createTask(selectedRequirementId, {
        ...taskForm,
        description: taskForm.description || null,
        owner_name: taskForm.owner_name || null,
      });
      setTaskForm(emptyTaskForm);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleTaskDraft() {
    if (!selectedRequirement) return;
    setDraftLoading("task", true);
    await safeRun(async () => {
      const draft = await api.generateTaskBreakdownDraft({
        title: selectedRequirement.title,
        summary: selectedRequirement.summary || undefined,
        acceptance_criteria: selectedRequirement.acceptance_criteria || undefined,
        scenarios_text: scenarioText(),
      });
      setTaskDraft(draft);
      if (draft.tasks[0]) {
        const first = draft.tasks[0];
        setTaskForm({
          title: first.title,
          description: first.description || "",
          task_type: first.task_type,
          owner_name: first.owner_name || "",
          status: first.status,
        });
      }
    });
    setDraftLoading("task", false);
  }

  async function saveTaskDrafts() {
    if (selectedRequirementId === null || !taskDraft) return;
    await safeRun(async () => {
      await Promise.all(
        taskDraft.tasks.map((item) =>
          api.createTask(selectedRequirementId, {
            title: item.title,
            description: item.description || null,
            task_type: item.task_type,
            owner_name: item.owner_name || null,
            status: item.status,
          }),
        ),
      );
      setTaskDraft(null);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleTaskEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTaskId || selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.updateTask(editingTaskId, {
        ...editingTaskForm,
        description: editingTaskForm.description || null,
        owner_name: editingTaskForm.owner_name || null,
      });
      cancelTaskEdit();
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleAcceptanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.createAcceptanceRun(selectedRequirementId, { ...acceptanceForm, notes: acceptanceForm.notes || null, recorded_by: acceptanceForm.recorded_by || null });
      setAcceptanceForm(emptyAcceptanceForm);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleGitHubLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.createRequirementGitHubLink(selectedRequirementId, { ...githubLinkForm, label: githubLinkForm.label || null });
      setGitHubLinkForm(emptyGitHubLinkForm);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  async function handleTestSummarySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRequirementId === null) return;
    await safeRun(async () => {
      await api.createTestSummary(selectedRequirementId, { ...testSummaryForm, summary: testSummaryForm.summary || null, report_url: testSummaryForm.report_url || null });
      setTestSummaryForm(emptyTestSummaryForm);
      await loadRequirementDetails(selectedRequirementId);
    });
  }

  const selectedRequirementTitle = useMemo(() => selectedRequirement?.title ?? "No requirement selected", [selectedRequirement]);

  const filteredDashboardRows = useMemo(() => {
    return dashboardRows.filter((row) => {
      const matchesStatus = dashboardStatusFilter === "all" || row.status === dashboardStatusFilter;
      const matchesAcceptance =
        dashboardAcceptanceFilter === "all"
        || row.latest_acceptance_status === dashboardAcceptanceFilter;
      const matchesHealth =
        dashboardHealthFilter === "all"
        || (dashboardHealthFilter === "accepted" && row.health === "Accepted")
        || (dashboardHealthFilter === "at-risk" && row.health === "At Risk")
        || (dashboardHealthFilter === "needs-definition" && row.health === "Needs Definition")
        || (dashboardHealthFilter === "in-progress" && row.health === "In Progress")
        || (dashboardHealthFilter === "ready-for-review" && row.health === "Ready for Review");
      const matchesTraceability =
        dashboardTraceabilityFilter === "all"
        || (dashboardTraceabilityFilter === "missing-scenarios" && row.scenario_count === 0)
        || (dashboardTraceabilityFilter === "missing-tasks" && row.task_count === 0);

      return matchesStatus && matchesAcceptance && matchesHealth && matchesTraceability;
    });
  }, [dashboardAcceptanceFilter, dashboardHealthFilter, dashboardRows, dashboardStatusFilter, dashboardTraceabilityFilter]);

  const hasDashboardData = dashboardRows.length > 0;
  const isDashboardFilterEmpty = dashboardState === "ready" && hasDashboardData && filteredDashboardRows.length === 0;
  const isDashboardDatasetEmpty = dashboardState === "ready" && !hasDashboardData;
  const acceptedRows = useMemo(
    () => dashboardRows.filter((row) => row.latest_acceptance_status === "passed"),
    [dashboardRows],
  );
  const activeDashboardFilters = useMemo(() => {
    const filters: Array<{ key: "status" | "acceptance" | "health" | "traceability"; label: string }> = [];
    if (dashboardStatusFilter !== "all") filters.push({ key: "status", label: `${copy.dashboard.activeFilterLabels.status}: ${copy.dashboard.activeFilterValues[dashboardStatusFilter] ?? dashboardStatusFilter}` });
    if (dashboardAcceptanceFilter !== "all") filters.push({ key: "acceptance", label: `${copy.dashboard.activeFilterLabels.acceptance}: ${copy.dashboard.activeFilterValues[dashboardAcceptanceFilter] ?? dashboardAcceptanceFilter}` });
    if (dashboardHealthFilter !== "all") filters.push({ key: "health", label: `${copy.dashboard.activeFilterLabels.health}: ${copy.dashboard.activeFilterValues[dashboardHealthFilter] ?? dashboardHealthFilter}` });
    if (dashboardTraceabilityFilter !== "all") filters.push({ key: "traceability", label: `${copy.dashboard.activeFilterLabels.traceability}: ${copy.dashboard.activeFilterValues[dashboardTraceabilityFilter] ?? dashboardTraceabilityFilter}` });
    return filters;
  }, [dashboardAcceptanceFilter, dashboardHealthFilter, dashboardStatusFilter, dashboardTraceabilityFilter]);
  const executiveSignals = useMemo(
    () => [
      {
        title: copy.dashboard.executiveSignals.releaseReadinessTitle,
        summary: dashboardCounts.accepted_requirements > 0
          ? copy.dashboard.executiveSignals.releaseReadinessSummaryWithCount(dashboardCounts.accepted_requirements)
          : copy.dashboard.executiveSignals.releaseReadinessSummary,
      },
      {
        title: copy.dashboard.executiveSignals.executionRiskTitle,
        summary: dashboardCounts.at_risk_requirements > 0
          ? copy.dashboard.executiveSignals.executionRiskSummaryWithCount(dashboardCounts.at_risk_requirements)
          : copy.dashboard.executiveSignals.executionRiskSummary,
      },
      {
        title: copy.dashboard.executiveSignals.definitionGapsTitle,
        summary: dashboardCounts.missing_scenarios_requirements + dashboardCounts.missing_tasks_requirements > 0
          ? copy.dashboard.executiveSignals.definitionGapsSummaryWithCount(dashboardCounts.missing_scenarios_requirements, dashboardCounts.missing_tasks_requirements)
          : copy.dashboard.executiveSignals.definitionGapsSummary,
      },
    ],
    [dashboardCounts],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>{copy.app.title}</h1>
          <p>{copy.app.subtitle}</p>
        </div>
        <div className="view-switch" role="tablist" aria-label={copy.app.primaryViewSwitchAriaLabel}>
          <button
            type="button"
            className={viewMode === "dashboard" ? "ghost-button active-tab" : "ghost-button"}
            onClick={() => setViewMode("dashboard")}
          >
            {copy.views.dashboard}
          </button>
          <button
            type="button"
            className={viewMode === "workspace" ? "ghost-button active-tab" : "ghost-button"}
            onClick={() => setViewMode("workspace")}
          >
            {copy.views.workspace}
          </button>
        </div>
      </header>
      {error ? <div className="error-banner">{error}</div> : null}
      <main className="layout">
        {viewMode === "dashboard" ? (
          <section className="panel panel-dashboard">
            <div className="dashboard-header">
              <div>
                <h2>{copy.dashboard.title}</h2>
                <p>{copy.dashboard.subtitle}</p>
              </div>
            </div>

            {dashboardState === "loading" ? (
              <article className="detail-card dashboard-state-card" aria-live="polite">
                <h3>{copy.dashboard.loadingTitle}</h3>
                <p>{copy.dashboard.loadingBody}</p>
              </article>
            ) : null}

            {dashboardState === "error" ? (
              <article className="detail-card dashboard-state-card dashboard-state-error" role="alert">
                <h3>{copy.dashboard.errorTitle}</h3>
                <p>{copy.dashboard.errorBody}</p>
                <button type="button" className="ghost-button" onClick={() => void loadDashboard()}>
                  {copy.dashboard.retryLoad}
                </button>
              </article>
            ) : null}

            <div className={dashboardState === "loading" ? "summary-card-grid summary-card-grid-skeleton" : "summary-card-grid"}>
              <article className="summary-card clickable-card" onClick={clearDashboardFilters}><span>{copy.dashboard.cards.totalRequirements}</span><strong>{dashboardCounts.total_requirements}</strong></article>
              <article className="summary-card clickable-card" onClick={() => setDashboardStatusFilter("draft")}><span>{copy.dashboard.cards.draft}</span><strong>{dashboardCounts.draft_requirements}</strong></article>
              <article className="summary-card clickable-card" onClick={() => setDashboardStatusFilter("ready")}><span>{copy.dashboard.cards.ready}</span><strong>{dashboardCounts.ready_requirements}</strong></article>
              <article className="summary-card clickable-card" onClick={() => setDashboardHealthFilter("accepted")}><span>{copy.dashboard.cards.accepted}</span><strong>{dashboardCounts.accepted_requirements}</strong></article>
              <article className="summary-card warning clickable-card" onClick={() => setDashboardHealthFilter("at-risk")}><span>{copy.dashboard.cards.atRisk}</span><strong>{dashboardCounts.at_risk_requirements}</strong></article>
              <article className="summary-card muted clickable-card" onClick={() => setDashboardHealthFilter("needs-definition")}><span>{copy.dashboard.cards.needsDefinition}</span><strong>{dashboardCounts.missing_scenarios_requirements}</strong></article>
              <article className="summary-card clickable-card" onClick={() => setDashboardHealthFilter("ready-for-review")}><span>{copy.dashboard.cards.readyForReview}</span><strong>{dashboardCounts.ready_for_review_requirements}</strong></article>
              <article className="summary-card muted clickable-card" onClick={() => setDashboardTraceabilityFilter("missing-scenarios")}><span>{copy.dashboard.cards.missingScenarios}</span><strong>{dashboardCounts.missing_scenarios_requirements}</strong></article>
              <article className="summary-card muted clickable-card" onClick={() => setDashboardTraceabilityFilter("missing-tasks")}><span>{copy.dashboard.cards.missingTasks}</span><strong>{dashboardCounts.missing_tasks_requirements}</strong></article>
            </div>

            <section className="dashboard-insight-grid">
              <article className="detail-card dashboard-insight-card">
                <div className="inline-actions">
                  <h3>{copy.dashboard.executiveSummaryTitle}</h3>
                  <span className="table-caption">{copy.dashboard.executiveSummaryCaption}</span>
                </div>
                <ul className="simple-list dashboard-insight-list">
                    {executiveSignals.map((signal) => (
                      <li key={signal.title}>
                        <button type="button" className="dashboard-list-button" onClick={() => applyExecutiveSignalFilter(signal.title)}>
                          <strong>{signal.title}</strong>
                          <div>{signal.summary}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>

              <article className="detail-card dashboard-insight-card">
                <div className="inline-actions">
                  <h3>{copy.dashboard.metricGuideTitle}</h3>
                  <span className="table-caption">{copy.dashboard.metricGuideCaption}</span>
                </div>
                <ul className="simple-list dashboard-insight-list">
                  <li>
                    <strong>{copy.dashboard.metricGuideItems.acceptedTitle}</strong>
                    <div>{copy.dashboard.metricGuideItems.acceptedBody}</div>
                  </li>
                  <li>
                    <strong>{copy.dashboard.metricGuideItems.atRiskTitle}</strong>
                    <div>{copy.dashboard.metricGuideItems.atRiskBody}</div>
                  </li>
                  <li>
                    <strong>{copy.dashboard.metricGuideItems.missingTraceabilityTitle}</strong>
                    <div>{copy.dashboard.metricGuideItems.missingTraceabilityBody}</div>
                  </li>
                </ul>
              </article>
            </section>

            <section className="dashboard-insight-grid">
              <article className="detail-card dashboard-insight-card">
                <div className="inline-actions">
                  <h3>{copy.dashboard.attentionNeededTitle}</h3>
                  <span className="table-caption">{copy.dashboard.attentionNeededCaption}</span>
                </div>
                {dashboardAttentionItems.length === 0 ? (
                  <p className="dashboard-inline-empty">{copy.dashboard.attentionNeededEmpty}</p>
                ) : (
                  <ul className="simple-list dashboard-insight-list">
                    {dashboardAttentionItems.map((item) => (
                      <li key={`attention-${item.id}`}>
                        <button type="button" className="dashboard-list-button" onClick={() => openRequirementFromDashboard(item.id)}>
                          <strong>{item.title}</strong>
                          <div>{item.summary}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="detail-card dashboard-insight-card">
                <div className="inline-actions">
                  <h3>{copy.dashboard.recommendedActionsTitle}</h3>
                  <span className="table-caption">{copy.dashboard.recommendedActionsCaption}</span>
                </div>
                <ul className="simple-list dashboard-insight-list">
                  {dashboardRecommendedActions.map((action) => (
                    <li key={action.owner}>
                      <strong>{action.owner}</strong>
                      <div>{action.summary}</div>
                    </li>
                  ))}
                </ul>
              </article>
            </section>

            <article className="detail-card dashboard-insight-card">
              <div className="inline-actions">
                <h3>{copy.dashboard.acceptedScopeTitle}</h3>
                <span className="table-caption">{copy.dashboard.acceptedScopeCaption}</span>
              </div>
              {acceptedRows.length === 0 ? (
                <p className="dashboard-inline-empty">{copy.dashboard.acceptedScopeEmpty}</p>
              ) : (
                <ul className="simple-list dashboard-insight-list">
                  {acceptedRows.slice(0, 5).map((row) => (
                    <li key={`accepted-${row.id}`}>
                      <button type="button" className="dashboard-list-button" onClick={() => openRequirementFromDashboard(row.id)}>
                        <strong>{row.title}</strong>
                        <div>{copy.dashboard.acceptedScopeRowSummary(row.scenario_count, row.task_count, row.latest_test_summary_result)}</div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <article className="detail-card dashboard-filter-bar">
              {activeDashboardFilters.length > 0 ? (
                <div className="dashboard-active-filters" aria-label={copy.dashboard.filters.activeFiltersAriaLabel}>
                  {activeDashboardFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      className="dashboard-filter-chip"
                      onClick={() => clearDashboardFilter(filter.key)}
                    >
                      {filter.label} ×
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="filter-grid">
                <select aria-label={copy.dashboard.filters.statusAriaLabel} value={dashboardStatusFilter} onChange={(e) => setDashboardStatusFilter(e.target.value as DashboardStatusFilter)}>
                  <option value="all">{copy.dashboard.filters.allStatuses}</option>
                  <option value="draft">{copy.dashboard.cards.draft}</option>
                  <option value="ready">{copy.dashboard.cards.ready}</option>
                  <option value="in_progress">{copy.dashboard.filters.inProgress}</option>
                  <option value="blocked">{copy.dashboard.activeFilterValues.blocked}</option>
                  <option value="done">{copy.dashboard.activeFilterValues.done}</option>
                </select>
                <select aria-label={copy.dashboard.filters.acceptanceAriaLabel} value={dashboardAcceptanceFilter} onChange={(e) => setDashboardAcceptanceFilter(e.target.value as DashboardAcceptanceFilter)}>
                  <option value="all">{copy.dashboard.filters.allAcceptance}</option>
                  <option value="passed">{copy.dashboard.activeFilterValues.passed}</option>
                  <option value="failed">{copy.dashboard.activeFilterValues.failed}</option>
                  <option value="blocked">{copy.dashboard.activeFilterValues.blocked}</option>
                  <option value="none">{copy.dashboard.filters.noAcceptance}</option>
                </select>
                <select aria-label={copy.dashboard.filters.healthAriaLabel} value={dashboardHealthFilter} onChange={(e) => setDashboardHealthFilter(e.target.value as DashboardHealthFilter)}>
                  <option value="all">{copy.dashboard.filters.allHealth}</option>
                  <option value="accepted">{copy.dashboard.cards.accepted}</option>
                  <option value="at-risk">{copy.dashboard.filters.atRisk}</option>
                  <option value="needs-definition">{copy.dashboard.filters.needsDefinition}</option>
                  <option value="in-progress">{copy.dashboard.filters.inProgress}</option>
                  <option value="ready-for-review">{copy.dashboard.filters.readyForReview}</option>
                </select>
                <select aria-label={copy.dashboard.filters.traceabilityAriaLabel} value={dashboardTraceabilityFilter} onChange={(e) => setDashboardTraceabilityFilter(e.target.value as DashboardTraceabilityFilter)}>
                  <option value="all">{copy.dashboard.filters.allTraceability}</option>
                  <option value="missing-scenarios">{copy.dashboard.filters.missingScenarios}</option>
                  <option value="missing-tasks">{copy.dashboard.filters.missingTasks}</option>
                </select>
                <button type="button" className="ghost-button" onClick={clearDashboardFilters}>{copy.dashboard.filters.clear}</button>
              </div>
            </article>

            <article className="detail-card dashboard-table-card">
              <div className="inline-actions">
                <h3>{copy.dashboard.requirementSummaryTitle}</h3>
                <span className="table-caption">{copy.dashboard.requirementSummaryCaption}</span>
              </div>
              {isDashboardDatasetEmpty ? (
                <div className="dashboard-empty-state" aria-live="polite">
                  <h4>{copy.dashboard.emptyStateTitle}</h4>
                  <p>{copy.dashboard.emptyStateBody}</p>
                </div>
              ) : null}
              <div className="summary-table-wrap">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>{copy.dashboard.table.title}</th>
                      <th>{copy.dashboard.table.status}</th>
                      <th>{copy.dashboard.table.scenarios}</th>
                      <th>{copy.dashboard.table.tasks}</th>
                      <th>{copy.dashboard.table.acceptance}</th>
                      <th>{copy.dashboard.table.health}</th>
                      <th>{copy.dashboard.table.testSummary}</th>
                      <th>{copy.dashboard.table.updated}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDashboardRows.map((row) => (
                      <tr key={row.id} onClick={() => openRequirementFromDashboard(row.id)}>
                        <td>{row.title}</td>
                        <td><span className={badgeClassName("status", row.status)}>{displayRequirementStatus(row.status)}</span></td>
                        <td>{row.scenario_count}</td>
                        <td>{row.task_count}</td>
                        <td><span className={badgeClassName("acceptance", row.latest_acceptance_status)}>{displayAcceptanceStatus(row.latest_acceptance_status)}</span></td>
                        <td><span className={badgeClassName("health", row.health)}>{displayDashboardHealth(row.health)}</span></td>
                        <td><span className={badgeClassName("acceptance", row.latest_test_summary_result)}>{displayAcceptanceStatus(row.latest_test_summary_result)}</span></td>
                        <td>{new Date(row.updated_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {isDashboardFilterEmpty ? (
                      <tr>
                          <td colSpan={8} className="empty-table-cell">{copy.dashboard.emptyFilteredBody}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </article>
          </section>
        ) : (
        <>
        <section className="panel panel-left">
          <h2>{copy.workspace.requirementsTitle}</h2>
          <RequirementDraftPanel
            draft={requirementDraft}
            draftForm={draftForm}
            loading={aiLoading.requirement}
            onDraftFormChange={(field, value) =>
              setDraftForm((current) => ({ ...current, [field]: value }))
            }
            onGenerate={() => void handleRequirementDraft()}
            onDraftChange={setRequirementDraft}
            onApplyDraft={() => {
              if (requirementDraft) applyRequirementDraft(requirementDraft);
            }}
          />
          <form className="stack" onSubmit={handleRequirementSubmit}>
            <input aria-label={copy.workspace.requirementForm.titleLabel} placeholder={copy.workspace.requirementForm.titlePlaceholder} value={requirementForm.title} onChange={(e) => setRequirementForm((c) => ({ ...c, title: e.target.value }))} required />
            <textarea aria-label={copy.workspace.requirementForm.summaryLabel} placeholder={copy.workspace.requirementForm.summaryPlaceholder} value={requirementForm.summary} onChange={(e) => setRequirementForm((c) => ({ ...c, summary: e.target.value }))} />
            <textarea aria-label={copy.workspace.requirementForm.businessValueLabel} placeholder={copy.workspace.requirementForm.businessValuePlaceholder} value={requirementForm.business_value} onChange={(e) => setRequirementForm((c) => ({ ...c, business_value: e.target.value }))} />
            <textarea aria-label={copy.workspace.requirementForm.acceptanceCriteriaLabel} placeholder={copy.workspace.requirementForm.acceptanceCriteriaPlaceholder} value={requirementForm.acceptance_criteria} onChange={(e) => setRequirementForm((c) => ({ ...c, acceptance_criteria: e.target.value }))} />
            <select aria-label={copy.workspace.requirementForm.statusLabel} value={requirementForm.status} onChange={(e) => setRequirementForm((c) => ({ ...c, status: e.target.value }))}><option value="draft">{displayRequirementStatus("draft")}</option><option value="ready">{displayRequirementStatus("ready")}</option><option value="in_progress">{displayRequirementStatus("in_progress")}</option><option value="in_acceptance">{displayRequirementStatus("in_acceptance")}</option><option value="done">{displayRequirementStatus("done")}</option><option value="blocked">{displayRequirementStatus("blocked")}</option></select>
            <button type="submit">{copy.workspace.requirementForm.createButton}</button>
          </form>
          {loadState === "loading" ? <p>{copy.workspace.loadingRequirements}</p> : null}
          <ul className="card-list">{requirements.map((requirement) => <li key={requirement.id}><button className={requirement.id === selectedRequirementId ? "list-card selected" : "list-card"} type="button" onClick={() => setSelectedRequirementId(requirement.id)}><strong>{requirement.title}</strong><span>{displayRequirementStatus(requirement.status)}</span></button></li>)}</ul>
        </section>

        <section className="panel panel-right">
          <h2>{selectedRequirementTitle}</h2>
          {detailState === "loading" ? <p>{copy.workspace.loadingDetails}</p> : null}
          {selectedRequirement ? <div className="detail-grid">
            <article className="detail-card">
              <div className="inline-actions">
                <h3>{copy.dashboard.requirementSummaryTitle}</h3>
                <button type="button" className="ghost-button" onClick={beginRequirementEdit}>
                  {copy.workspace.requirementDetail.editButton}
                </button>
              </div>
              {isEditingRequirement ? (
                <form className="stack compact" onSubmit={handleRequirementEditSubmit}>
                  <input
                    aria-label={copy.workspace.requirementDetail.editTitleLabel}
                    value={requirementEditForm.title}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, title: e.target.value }))
                    }
                    required
                  />
                  <textarea
                    aria-label={copy.workspace.requirementDetail.editSummaryLabel}
                    value={requirementEditForm.summary}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, summary: e.target.value }))
                    }
                  />
                  <textarea
                    aria-label={copy.workspace.requirementDetail.editBusinessValueLabel}
                    value={requirementEditForm.business_value}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, business_value: e.target.value }))
                    }
                  />
                  <textarea
                    aria-label={copy.workspace.requirementDetail.editAcceptanceCriteriaLabel}
                    value={requirementEditForm.acceptance_criteria}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({
                        ...c,
                        acceptance_criteria: e.target.value,
                      }))
                    }
                  />
                  <select
                    aria-label={copy.workspace.requirementDetail.editStatusLabel}
                    value={requirementEditForm.status}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, status: e.target.value }))
                    }
                  >
                    <option value="draft">{displayRequirementStatus("draft")}</option>
                    <option value="ready">{displayRequirementStatus("ready")}</option>
                    <option value="in_progress">{displayRequirementStatus("in_progress")}</option>
                    <option value="in_acceptance">{displayRequirementStatus("in_acceptance")}</option>
                    <option value="done">{displayRequirementStatus("done")}</option>
                    <option value="blocked">{displayRequirementStatus("blocked")}</option>
                  </select>
                  <div className="inline-actions">
                    <button type="submit">{copy.workspace.requirementDetail.saveButton}</button>
                    <button type="button" className="ghost-button" onClick={cancelRequirementEdit}>
                      {copy.workspace.requirementDetail.cancelButton}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{selectedRequirement.summary || copy.workspace.requirementDetail.noSummary}</p>
                  <p>
                    <strong>{copy.workspace.requirementDetail.businessValueLabel}</strong>{" "}
                    {selectedRequirement.business_value || copy.workspace.requirementDetail.notProvided}
                  </p>
                  <p>
                    <strong>{copy.workspace.requirementDetail.acceptanceCriteriaLabel}</strong>{" "}
                    {selectedRequirement.acceptance_criteria || copy.workspace.requirementDetail.notProvided}
                  </p>
                </>
              )}
            </article>

            <article className="detail-card">
              <h3>{copy.workspace.scenario.title}</h3>
              <ScenarioDraftEditor
                draft={scenarioDraft}
                loading={aiLoading.scenario}
                onGenerate={() => void handleScenarioDraft()}
                onChange={setScenarioDraft}
                onSaveAll={() => void saveScenarioDrafts()}
              />
              <form className="stack compact" onSubmit={handleScenarioSubmit}>
                <input aria-label={copy.workspace.scenario.featureNameLabel} placeholder={copy.workspace.scenario.featureNamePlaceholder} value={scenarioForm.feature_name} onChange={(e) => setScenarioForm((c) => ({ ...c, feature_name: e.target.value }))} required />
                <input aria-label={copy.workspace.scenario.titleLabel} placeholder={copy.workspace.scenario.titlePlaceholder} value={scenarioForm.scenario_title} onChange={(e) => setScenarioForm((c) => ({ ...c, scenario_title: e.target.value }))} required />
                <textarea aria-label={copy.workspace.scenario.givenLabel} placeholder={copy.workspace.scenario.givenPlaceholder} value={scenarioForm.given_text} onChange={(e) => setScenarioForm((c) => ({ ...c, given_text: e.target.value }))} />
                <textarea aria-label={copy.workspace.scenario.whenLabel} placeholder={copy.workspace.scenario.whenPlaceholder} value={scenarioForm.when_text} onChange={(e) => setScenarioForm((c) => ({ ...c, when_text: e.target.value }))} />
                <textarea aria-label={copy.workspace.scenario.thenLabel} placeholder={copy.workspace.scenario.thenPlaceholder} value={scenarioForm.then_text} onChange={(e) => setScenarioForm((c) => ({ ...c, then_text: e.target.value }))} />
                <button type="submit">{copy.workspace.scenario.addButton}</button>
              </form>
              <ul className="simple-list">
                {scenarios.map((scenario) => (
                  <li key={scenario.id}>
                    {editingScenarioId === scenario.id ? (
                      <form className="stack compact" onSubmit={handleScenarioEditSubmit}>
                        <input
                          aria-label={copy.workspace.scenario.editFeatureLabel(scenario.id)}
                          value={editingScenarioForm.feature_name}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({
                              ...c,
                              feature_name: e.target.value,
                            }))
                          }
                          required
                        />
                        <input
                          aria-label={copy.workspace.scenario.editTitleLabel(scenario.id)}
                          value={editingScenarioForm.scenario_title}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({
                              ...c,
                              scenario_title: e.target.value,
                            }))
                          }
                          required
                        />
                        <textarea
                          aria-label={copy.workspace.scenario.editGivenLabel(scenario.id)}
                          value={editingScenarioForm.given_text}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, given_text: e.target.value }))
                          }
                        />
                        <textarea
                          aria-label={copy.workspace.scenario.editWhenLabel(scenario.id)}
                          value={editingScenarioForm.when_text}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, when_text: e.target.value }))
                          }
                        />
                        <textarea
                          aria-label={copy.workspace.scenario.editThenLabel(scenario.id)}
                          value={editingScenarioForm.then_text}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, then_text: e.target.value }))
                          }
                        />
                        <select
                          aria-label={copy.workspace.scenario.editStatusLabel(scenario.id)}
                          value={editingScenarioForm.status}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, status: e.target.value }))
                          }
                        >
                          <option value="draft">{displayScenarioStatus("draft")}</option>
                          <option value="ready">{displayScenarioStatus("ready")}</option>
                          <option value="covered">covered</option>
                          <option value="blocked">{displayScenarioStatus("blocked")}</option>
                        </select>
                        <div className="inline-actions">
                          <button type="submit">{copy.workspace.scenario.saveButton}</button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={cancelScenarioEdit}
                          >
                            {copy.workspace.scenario.cancelButton}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="inline-actions">
                          <strong>{scenario.feature_name}</strong>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => beginScenarioEdit(scenario)}
                          >
                            {copy.workspace.scenario.editButton}
                          </button>
                        </div>
                        <div>{scenario.scenario_title}</div>
                        <div>{displayScenarioStatus(scenario.status)}</div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-card">
              <h3>{copy.workspace.task.title}</h3>
              <TaskDraftEditor
                draft={taskDraft}
                loading={aiLoading.task}
                onGenerate={() => void handleTaskDraft()}
                onChange={setTaskDraft}
                onSaveAll={() => void saveTaskDrafts()}
              />
              <form className="stack compact" onSubmit={handleTaskSubmit}>
                <input aria-label={copy.workspace.task.titleLabel} placeholder={copy.workspace.task.titlePlaceholder} value={taskForm.title} onChange={(e) => setTaskForm((c) => ({ ...c, title: e.target.value }))} required />
                <textarea aria-label={copy.workspace.task.descriptionLabel} placeholder={copy.workspace.task.descriptionPlaceholder} value={taskForm.description} onChange={(e) => setTaskForm((c) => ({ ...c, description: e.target.value }))} />
                <input aria-label={copy.workspace.task.editOwnerLabel(0)} placeholder={copy.workspace.task.unassigned} value={taskForm.owner_name} onChange={(e) => setTaskForm((c) => ({ ...c, owner_name: e.target.value }))} />
                <select aria-label={copy.workspace.task.editTypeLabel(0)} value={taskForm.task_type} onChange={(e) => setTaskForm((c) => ({ ...c, task_type: e.target.value }))}><option value="backend">{displayTaskType("backend")}</option><option value="frontend">{displayTaskType("frontend")}</option><option value="app">{displayTaskType("app")}</option><option value="qa">{displayTaskType("qa")}</option><option value="product">{displayTaskType("product")}</option></select>
                <select aria-label={copy.workspace.task.editStatusLabel(0)} value={taskForm.status} onChange={(e) => setTaskForm((c) => ({ ...c, status: e.target.value }))}><option value="todo">{displayTaskStatus("todo")}</option><option value="in_progress">{displayTaskStatus("in_progress")}</option><option value="review">{displayTaskStatus("review")}</option><option value="done">{displayTaskStatus("done")}</option><option value="blocked">{displayTaskStatus("blocked")}</option></select>
                <button type="submit">{copy.workspace.task.addButton}</button>
              </form>
              <ul className="simple-list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    {editingTaskId === task.id ? (
                      <form className="stack compact" onSubmit={handleTaskEditSubmit}>
                        <input
                          aria-label={copy.workspace.task.editTitleLabel(task.id)}
                          value={editingTaskForm.title}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, title: e.target.value }))
                          }
                          required
                        />
                        <textarea
                          aria-label={copy.workspace.task.editDescriptionLabel(task.id)}
                          value={editingTaskForm.description}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, description: e.target.value }))
                          }
                        />
                        <input
                          aria-label={copy.workspace.task.editOwnerLabel(task.id)}
                          value={editingTaskForm.owner_name}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, owner_name: e.target.value }))
                          }
                        />
                        <select
                          aria-label={copy.workspace.task.editTypeLabel(task.id)}
                          value={editingTaskForm.task_type}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, task_type: e.target.value }))
                          }
                        >
                          <option value="backend">{displayTaskType("backend")}</option>
                          <option value="frontend">{displayTaskType("frontend")}</option>
                          <option value="app">{displayTaskType("app")}</option>
                          <option value="qa">{displayTaskType("qa")}</option>
                          <option value="product">{displayTaskType("product")}</option>
                        </select>
                        <select
                          aria-label={copy.workspace.task.editStatusLabel(task.id)}
                          value={editingTaskForm.status}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, status: e.target.value }))
                          }
                        >
                          <option value="todo">{displayTaskStatus("todo")}</option>
                          <option value="in_progress">{displayTaskStatus("in_progress")}</option>
                          <option value="review">{displayTaskStatus("review")}</option>
                          <option value="done">{displayTaskStatus("done")}</option>
                          <option value="blocked">{displayTaskStatus("blocked")}</option>
                        </select>
                        <div className="inline-actions">
                          <button type="submit">{copy.workspace.task.saveButton}</button>
                          <button type="button" className="ghost-button" onClick={cancelTaskEdit}>
                            {copy.workspace.task.cancelButton}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="inline-actions">
                          <strong>{task.title}</strong>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => beginTaskEdit(task)}
                          >
                            {copy.workspace.task.editButton}
                          </button>
                        </div>
                        <div>
                          {displayTaskType(task.task_type)} / {displayTaskStatus(task.status)} / {task.owner_name || copy.workspace.task.unassigned}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-card"><h3>{copy.workspace.acceptance.title}</h3><form className="stack compact" onSubmit={handleAcceptanceSubmit}><select aria-label={copy.workspace.acceptance.statusLabel} value={acceptanceForm.status} onChange={(e) => setAcceptanceForm((c) => ({ ...c, status: e.target.value }))}><option value="pending">{displayAcceptanceStatus("pending")}</option><option value="in_review">{displayAcceptanceStatus("in_review")}</option><option value="passed">{displayAcceptanceStatus("passed")}</option><option value="failed">{displayAcceptanceStatus("failed")}</option><option value="blocked">{displayAcceptanceStatus("blocked")}</option></select><input aria-label={copy.workspace.acceptance.recordedByLabel} placeholder={copy.workspace.acceptance.recordedByPlaceholder} value={acceptanceForm.recorded_by} onChange={(e) => setAcceptanceForm((c) => ({ ...c, recorded_by: e.target.value }))} /><textarea aria-label={copy.workspace.acceptance.notesLabel} placeholder={copy.workspace.acceptance.notesPlaceholder} value={acceptanceForm.notes} onChange={(e) => setAcceptanceForm((c) => ({ ...c, notes: e.target.value }))} /><button type="submit">{copy.workspace.acceptance.submitButton}</button></form><ul className="simple-list">{acceptanceRuns.map((run) => <li key={run.id}><strong>{displayAcceptanceStatus(run.status)}</strong><div>{run.recorded_by || copy.workspace.acceptance.unknown}</div><div>{run.notes || copy.workspace.acceptance.noNotes}</div></li>)}</ul></article>

            <article className="detail-card"><h3>{copy.workspace.github.title}</h3><form className="stack compact" onSubmit={handleGitHubLinkSubmit}><select aria-label={copy.workspace.github.linkTypeLabel} value={githubLinkForm.link_type} onChange={(e) => setGitHubLinkForm((c) => ({ ...c, link_type: e.target.value }))}><option value="issue">issue</option><option value="pr">pr</option><option value="commit">commit</option><option value="discussion">discussion</option></select><input aria-label={copy.workspace.github.urlLabel} placeholder="https://github.com/org/repo/issues/1" value={githubLinkForm.url} onChange={(e) => setGitHubLinkForm((c) => ({ ...c, url: e.target.value }))} required /><input aria-label={copy.workspace.github.labelLabel} placeholder={copy.workspace.github.labelPlaceholder} value={githubLinkForm.label} onChange={(e) => setGitHubLinkForm((c) => ({ ...c, label: e.target.value }))} /><button type="submit">{copy.workspace.github.submitButton}</button></form><ul className="simple-list">{githubLinks.map((link) => <li key={link.id}><strong>{link.link_type}</strong><div>{link.label || copy.workspace.github.noLabel}</div><a href={link.url} target="_blank" rel="noreferrer">{link.url}</a></li>)}</ul></article>

            <article className="detail-card"><h3>{copy.workspace.testSummary.title}</h3><form className="stack compact" onSubmit={handleTestSummarySubmit}><input aria-label={copy.workspace.testSummary.sourceLabel} placeholder={copy.workspace.testSummary.sourcePlaceholder} value={testSummaryForm.source} onChange={(e) => setTestSummaryForm((c) => ({ ...c, source: e.target.value }))} required /><select aria-label={copy.workspace.testSummary.resultLabel} value={testSummaryForm.result} onChange={(e) => setTestSummaryForm((c) => ({ ...c, result: e.target.value }))}><option value="passed">{displayTestSummaryResult("passed")}</option><option value="failed">{displayTestSummaryResult("failed")}</option><option value="partial">{displayTestSummaryResult("partial")}</option><option value="blocked">{displayTestSummaryResult("blocked")}</option></select><textarea aria-label={copy.workspace.testSummary.textLabel} placeholder={copy.workspace.testSummary.textPlaceholder} value={testSummaryForm.summary} onChange={(e) => setTestSummaryForm((c) => ({ ...c, summary: e.target.value }))} /><input aria-label={copy.workspace.testSummary.reportUrlLabel} placeholder={copy.workspace.testSummary.reportUrlPlaceholder} value={testSummaryForm.report_url} onChange={(e) => setTestSummaryForm((c) => ({ ...c, report_url: e.target.value }))} /><button type="submit">{copy.workspace.testSummary.submitButton}</button></form><ul className="simple-list">{testSummaries.map((summary) => <li key={summary.id}><strong>{summary.source} / {displayTestSummaryResult(summary.result)}</strong><div>{summary.summary || copy.workspace.testSummary.noSummary}</div><div>{summary.report_url || copy.workspace.testSummary.noReportLink}</div></li>)}</ul></article>
          </div> : <p>{copy.workspace.emptySelection}</p>}
        </section>
        </>
        )}
      </main>
    </div>
  );
}





