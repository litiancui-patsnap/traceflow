import type {
  AcceptanceRun,
  GitHubLink,
  RequirementDetailResponse,
  Requirement,
  RequirementDraftResponse,
  Scenario,
  ScenarioDraftResponse,
  Task,
  TaskBreakdownDraftResponse,
  TestSummary,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  listRequirements: () => request<Requirement[]>("/api/requirements"),
  createRequirement: (payload: Partial<Requirement>) =>
    request<Requirement>("/api/requirements", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateRequirement: (id: number, payload: Partial<Requirement>) =>
    request<Requirement>(`/api/requirements/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  getRequirement: (id: number) => request<Requirement>(`/api/requirements/${id}`),
  getRequirementDetail: (id: number) =>
    request<RequirementDetailResponse>(`/api/requirements/${id}/detail`),
  listScenarios: (requirementId: number) =>
    request<Scenario[]>(`/api/requirements/${requirementId}/scenarios`),
  createScenario: (requirementId: number, payload: Partial<Scenario>) =>
    request<Scenario>(`/api/requirements/${requirementId}/scenarios`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateScenario: (id: number, payload: Partial<Scenario>) =>
    request<Scenario>(`/api/scenarios/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listTasks: (requirementId: number) =>
    request<Task[]>(`/api/requirements/${requirementId}/tasks`),
  createTask: (requirementId: number, payload: Partial<Task>) =>
    request<Task>(`/api/requirements/${requirementId}/tasks`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateTask: (id: number, payload: Partial<Task>) =>
    request<Task>(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listAcceptanceRuns: (requirementId: number) =>
    request<AcceptanceRun[]>(`/api/requirements/${requirementId}/acceptance-runs`),
  createAcceptanceRun: (requirementId: number, payload: Partial<AcceptanceRun>) =>
    request<AcceptanceRun>(`/api/requirements/${requirementId}/acceptance-runs`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listRequirementGitHubLinks: (requirementId: number) =>
    request<GitHubLink[]>(`/api/requirements/${requirementId}/github-links`),
  createRequirementGitHubLink: (requirementId: number, payload: Partial<GitHubLink>) =>
    request<GitHubLink>(`/api/requirements/${requirementId}/github-links`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listTestSummaries: (requirementId: number) =>
    request<TestSummary[]>(`/api/requirements/${requirementId}/test-summaries`),
  createTestSummary: (requirementId: number, payload: Partial<TestSummary>) =>
    request<TestSummary>(`/api/requirements/${requirementId}/test-summaries`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  generateRequirementDraft: (payload: {
    raw_input: string;
    business_context?: string;
    design_hints?: string;
  }) =>
    request<RequirementDraftResponse>("/api/ai/requirement-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  generateScenarioDraft: (payload: {
    title: string;
    summary?: string;
    acceptance_criteria?: string;
  }) =>
    request<ScenarioDraftResponse>("/api/ai/scenario-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  generateTaskBreakdownDraft: (payload: {
    title: string;
    summary?: string;
    acceptance_criteria?: string;
    scenarios_text?: string;
  }) =>
    request<TaskBreakdownDraftResponse>("/api/ai/task-breakdown-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
