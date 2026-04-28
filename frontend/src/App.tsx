import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "./api";
import { RequirementDraftPanel } from "./components/RequirementDraftPanel";
import { ScenarioDraftEditor } from "./components/ScenarioDraftEditor";
import { TaskDraftEditor } from "./components/TaskDraftEditor";
import type {
  AcceptanceRun,
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

export default function App() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
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

  useEffect(() => {
    void loadRequirements();
  }, []);

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
          .map((scenario) => `Feature: ${scenario.feature_name}\nScenario: ${scenario.scenario_title}\nGiven: ${scenario.given_text || ""}\nWhen: ${scenario.when_text || ""}\nThen: ${scenario.then_text || ""}`)
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

  return (
    <div className="app-shell">
      <header className="topbar"><div><h1>Spec Driven Delivery Tool</h1><p>Requirements, scenarios, tasks, and acceptance in one place.</p></div></header>
      {error ? <div className="error-banner">{error}</div> : null}
      <main className="layout">
        <section className="panel panel-left">
          <h2>Requirements</h2>
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
            <input aria-label="Requirement title" placeholder="Requirement title" value={requirementForm.title} onChange={(e) => setRequirementForm((c) => ({ ...c, title: e.target.value }))} required />
            <textarea aria-label="Requirement summary" placeholder="Summary" value={requirementForm.summary} onChange={(e) => setRequirementForm((c) => ({ ...c, summary: e.target.value }))} />
            <textarea aria-label="Business value" placeholder="Business value" value={requirementForm.business_value} onChange={(e) => setRequirementForm((c) => ({ ...c, business_value: e.target.value }))} />
            <textarea aria-label="Acceptance criteria" placeholder="Acceptance criteria" value={requirementForm.acceptance_criteria} onChange={(e) => setRequirementForm((c) => ({ ...c, acceptance_criteria: e.target.value }))} />
            <select aria-label="Requirement status" value={requirementForm.status} onChange={(e) => setRequirementForm((c) => ({ ...c, status: e.target.value }))}><option value="draft">draft</option><option value="ready">ready</option><option value="in_progress">in_progress</option><option value="in_acceptance">in_acceptance</option><option value="done">done</option><option value="blocked">blocked</option></select>
            <button type="submit">Create Requirement</button>
          </form>
          {loadState === "loading" ? <p>Loading requirements...</p> : null}
          <ul className="card-list">{requirements.map((requirement) => <li key={requirement.id}><button className={requirement.id === selectedRequirementId ? "list-card selected" : "list-card"} type="button" onClick={() => setSelectedRequirementId(requirement.id)}><strong>{requirement.title}</strong><span>{requirement.status}</span></button></li>)}</ul>
        </section>

        <section className="panel panel-right">
          <h2>{selectedRequirementTitle}</h2>
          {detailState === "loading" ? <p>Loading details...</p> : null}
          {selectedRequirement ? <div className="detail-grid">
            <article className="detail-card">
              <div className="inline-actions">
                <h3>Requirement Summary</h3>
                <button type="button" className="ghost-button" onClick={beginRequirementEdit}>
                  Edit
                </button>
              </div>
              {isEditingRequirement ? (
                <form className="stack compact" onSubmit={handleRequirementEditSubmit}>
                  <input
                    aria-label="Edit requirement title"
                    value={requirementEditForm.title}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, title: e.target.value }))
                    }
                    required
                  />
                  <textarea
                    aria-label="Edit requirement summary"
                    value={requirementEditForm.summary}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, summary: e.target.value }))
                    }
                  />
                  <textarea
                    aria-label="Edit requirement business value"
                    value={requirementEditForm.business_value}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, business_value: e.target.value }))
                    }
                  />
                  <textarea
                    aria-label="Edit requirement acceptance criteria"
                    value={requirementEditForm.acceptance_criteria}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({
                        ...c,
                        acceptance_criteria: e.target.value,
                      }))
                    }
                  />
                  <select
                    aria-label="Edit requirement status"
                    value={requirementEditForm.status}
                    onChange={(e) =>
                      setRequirementEditForm((c) => ({ ...c, status: e.target.value }))
                    }
                  >
                    <option value="draft">draft</option>
                    <option value="ready">ready</option>
                    <option value="in_progress">in_progress</option>
                    <option value="in_acceptance">in_acceptance</option>
                    <option value="done">done</option>
                    <option value="blocked">blocked</option>
                  </select>
                  <div className="inline-actions">
                    <button type="submit">Save Requirement</button>
                    <button type="button" className="ghost-button" onClick={cancelRequirementEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{selectedRequirement.summary || "No summary yet."}</p>
                  <p>
                    <strong>Business value:</strong>{" "}
                    {selectedRequirement.business_value || "Not provided"}
                  </p>
                  <p>
                    <strong>Acceptance criteria:</strong>{" "}
                    {selectedRequirement.acceptance_criteria || "Not provided"}
                  </p>
                </>
              )}
            </article>

            <article className="detail-card">
              <h3>Scenarios</h3>
              <ScenarioDraftEditor
                draft={scenarioDraft}
                loading={aiLoading.scenario}
                onGenerate={() => void handleScenarioDraft()}
                onChange={setScenarioDraft}
                onSaveAll={() => void saveScenarioDrafts()}
              />
              <form className="stack compact" onSubmit={handleScenarioSubmit}>
                <input aria-label="Feature name" placeholder="Feature name" value={scenarioForm.feature_name} onChange={(e) => setScenarioForm((c) => ({ ...c, feature_name: e.target.value }))} required />
                <input aria-label="Scenario title" placeholder="Scenario title" value={scenarioForm.scenario_title} onChange={(e) => setScenarioForm((c) => ({ ...c, scenario_title: e.target.value }))} required />
                <textarea aria-label="Given" placeholder="Given" value={scenarioForm.given_text} onChange={(e) => setScenarioForm((c) => ({ ...c, given_text: e.target.value }))} />
                <textarea aria-label="When" placeholder="When" value={scenarioForm.when_text} onChange={(e) => setScenarioForm((c) => ({ ...c, when_text: e.target.value }))} />
                <textarea aria-label="Then" placeholder="Then" value={scenarioForm.then_text} onChange={(e) => setScenarioForm((c) => ({ ...c, then_text: e.target.value }))} />
                <button type="submit">Add Scenario</button>
              </form>
              <ul className="simple-list">
                {scenarios.map((scenario) => (
                  <li key={scenario.id}>
                    {editingScenarioId === scenario.id ? (
                      <form className="stack compact" onSubmit={handleScenarioEditSubmit}>
                        <input
                          aria-label={`Edit scenario feature ${scenario.id}`}
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
                          aria-label={`Edit scenario title ${scenario.id}`}
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
                          aria-label={`Edit scenario given ${scenario.id}`}
                          value={editingScenarioForm.given_text}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, given_text: e.target.value }))
                          }
                        />
                        <textarea
                          aria-label={`Edit scenario when ${scenario.id}`}
                          value={editingScenarioForm.when_text}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, when_text: e.target.value }))
                          }
                        />
                        <textarea
                          aria-label={`Edit scenario then ${scenario.id}`}
                          value={editingScenarioForm.then_text}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, then_text: e.target.value }))
                          }
                        />
                        <select
                          aria-label={`Edit scenario status ${scenario.id}`}
                          value={editingScenarioForm.status}
                          onChange={(e) =>
                            setEditingScenarioForm((c) => ({ ...c, status: e.target.value }))
                          }
                        >
                          <option value="draft">draft</option>
                          <option value="ready">ready</option>
                          <option value="covered">covered</option>
                          <option value="blocked">blocked</option>
                        </select>
                        <div className="inline-actions">
                          <button type="submit">Save Scenario</button>
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={cancelScenarioEdit}
                          >
                            Cancel
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
                            Edit
                          </button>
                        </div>
                        <div>{scenario.scenario_title}</div>
                        <div>{scenario.status}</div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-card">
              <h3>Tasks</h3>
              <TaskDraftEditor
                draft={taskDraft}
                loading={aiLoading.task}
                onGenerate={() => void handleTaskDraft()}
                onChange={setTaskDraft}
                onSaveAll={() => void saveTaskDrafts()}
              />
              <form className="stack compact" onSubmit={handleTaskSubmit}>
                <input aria-label="Task title" placeholder="Task title" value={taskForm.title} onChange={(e) => setTaskForm((c) => ({ ...c, title: e.target.value }))} required />
                <textarea aria-label="Task description" placeholder="Description" value={taskForm.description} onChange={(e) => setTaskForm((c) => ({ ...c, description: e.target.value }))} />
                <input aria-label="Task owner" placeholder="Owner" value={taskForm.owner_name} onChange={(e) => setTaskForm((c) => ({ ...c, owner_name: e.target.value }))} />
                <select aria-label="Task type" value={taskForm.task_type} onChange={(e) => setTaskForm((c) => ({ ...c, task_type: e.target.value }))}><option value="backend">backend</option><option value="frontend">frontend</option><option value="app">app</option><option value="qa">qa</option><option value="product">product</option></select>
                <select aria-label="Task status" value={taskForm.status} onChange={(e) => setTaskForm((c) => ({ ...c, status: e.target.value }))}><option value="todo">todo</option><option value="in_progress">in_progress</option><option value="review">review</option><option value="done">done</option><option value="blocked">blocked</option></select>
                <button type="submit">Add Task</button>
              </form>
              <ul className="simple-list">
                {tasks.map((task) => (
                  <li key={task.id}>
                    {editingTaskId === task.id ? (
                      <form className="stack compact" onSubmit={handleTaskEditSubmit}>
                        <input
                          aria-label={`Edit task title ${task.id}`}
                          value={editingTaskForm.title}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, title: e.target.value }))
                          }
                          required
                        />
                        <textarea
                          aria-label={`Edit task description ${task.id}`}
                          value={editingTaskForm.description}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, description: e.target.value }))
                          }
                        />
                        <input
                          aria-label={`Edit task owner ${task.id}`}
                          value={editingTaskForm.owner_name}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, owner_name: e.target.value }))
                          }
                        />
                        <select
                          aria-label={`Edit task type ${task.id}`}
                          value={editingTaskForm.task_type}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, task_type: e.target.value }))
                          }
                        >
                          <option value="backend">backend</option>
                          <option value="frontend">frontend</option>
                          <option value="app">app</option>
                          <option value="qa">qa</option>
                          <option value="product">product</option>
                        </select>
                        <select
                          aria-label={`Edit task status ${task.id}`}
                          value={editingTaskForm.status}
                          onChange={(e) =>
                            setEditingTaskForm((c) => ({ ...c, status: e.target.value }))
                          }
                        >
                          <option value="todo">todo</option>
                          <option value="in_progress">in_progress</option>
                          <option value="review">review</option>
                          <option value="done">done</option>
                          <option value="blocked">blocked</option>
                        </select>
                        <div className="inline-actions">
                          <button type="submit">Save Task</button>
                          <button type="button" className="ghost-button" onClick={cancelTaskEdit}>
                            Cancel
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
                            Edit
                          </button>
                        </div>
                        <div>
                          {task.task_type} / {task.status} / {task.owner_name || "unassigned"}
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </article>

            <article className="detail-card"><h3>Acceptance Runs</h3><form className="stack compact" onSubmit={handleAcceptanceSubmit}><select aria-label="Acceptance status" value={acceptanceForm.status} onChange={(e) => setAcceptanceForm((c) => ({ ...c, status: e.target.value }))}><option value="pending">pending</option><option value="in_review">in_review</option><option value="passed">passed</option><option value="failed">failed</option><option value="blocked">blocked</option></select><input aria-label="Recorded by" placeholder="Recorded by" value={acceptanceForm.recorded_by} onChange={(e) => setAcceptanceForm((c) => ({ ...c, recorded_by: e.target.value }))} /><textarea aria-label="Acceptance notes" placeholder="Notes" value={acceptanceForm.notes} onChange={(e) => setAcceptanceForm((c) => ({ ...c, notes: e.target.value }))} /><button type="submit">Record Acceptance</button></form><ul className="simple-list">{acceptanceRuns.map((run) => <li key={run.id}><strong>{run.status}</strong><div>{run.recorded_by || "unknown"}</div><div>{run.notes || "No notes"}</div></li>)}</ul></article>

            <article className="detail-card"><h3>GitHub Links</h3><form className="stack compact" onSubmit={handleGitHubLinkSubmit}><select aria-label="GitHub link type" value={githubLinkForm.link_type} onChange={(e) => setGitHubLinkForm((c) => ({ ...c, link_type: e.target.value }))}><option value="issue">issue</option><option value="pr">pr</option><option value="commit">commit</option><option value="discussion">discussion</option></select><input aria-label="GitHub URL" placeholder="https://github.com/org/repo/issues/1" value={githubLinkForm.url} onChange={(e) => setGitHubLinkForm((c) => ({ ...c, url: e.target.value }))} required /><input aria-label="GitHub label" placeholder="Label" value={githubLinkForm.label} onChange={(e) => setGitHubLinkForm((c) => ({ ...c, label: e.target.value }))} /><button type="submit">Add GitHub Link</button></form><ul className="simple-list">{githubLinks.map((link) => <li key={link.id}><strong>{link.link_type}</strong><div>{link.label || "No label"}</div><a href={link.url} target="_blank" rel="noreferrer">{link.url}</a></li>)}</ul></article>

            <article className="detail-card"><h3>Test Summaries</h3><form className="stack compact" onSubmit={handleTestSummarySubmit}><input aria-label="Test summary source" placeholder="Source" value={testSummaryForm.source} onChange={(e) => setTestSummaryForm((c) => ({ ...c, source: e.target.value }))} required /><select aria-label="Test summary result" value={testSummaryForm.result} onChange={(e) => setTestSummaryForm((c) => ({ ...c, result: e.target.value }))}><option value="passed">passed</option><option value="failed">failed</option><option value="partial">partial</option><option value="blocked">blocked</option></select><textarea aria-label="Test summary text" placeholder="Summary" value={testSummaryForm.summary} onChange={(e) => setTestSummaryForm((c) => ({ ...c, summary: e.target.value }))} /><input aria-label="Test summary report URL" placeholder="Report URL" value={testSummaryForm.report_url} onChange={(e) => setTestSummaryForm((c) => ({ ...c, report_url: e.target.value }))} /><button type="submit">Add Test Summary</button></form><ul className="simple-list">{testSummaries.map((summary) => <li key={summary.id}><strong>{summary.source} / {summary.result}</strong><div>{summary.summary || "No summary"}</div><div>{summary.report_url || "No report link"}</div></li>)}</ul></article>
          </div> : <p>Select or create a requirement to start.</p>}
        </section>
      </main>
    </div>
  );
}
