export interface Requirement {
  id: number;
  title: string;
  raw_input: string | null;
  summary: string | null;
  business_value: string | null;
  acceptance_criteria: string | null;
  design_links_json: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RequirementDetailResponse {
  requirement: Requirement;
  scenarios: Scenario[];
  tasks: Task[];
  acceptance_runs: AcceptanceRun[];
  github_links: GitHubLink[];
  test_summaries: TestSummary[];
}

export interface Scenario {
  id: number;
  requirement_id: number;
  feature_name: string;
  scenario_title: string;
  given_text: string | null;
  when_text: string | null;
  then_text: string | null;
  coverage_frontend: boolean;
  coverage_backend: boolean;
  coverage_app: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  requirement_id: number;
  scenario_id: number | null;
  title: string;
  description: string | null;
  task_type: string;
  owner_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AcceptanceRun {
  id: number;
  requirement_id: number;
  status: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface GitHubLink {
  id: number;
  requirement_id: number | null;
  task_id: number | null;
  link_type: string;
  url: string;
  label: string | null;
  created_at: string;
}

export interface TestSummary {
  id: number;
  requirement_id: number;
  source: string;
  result: string;
  summary: string | null;
  report_url: string | null;
  run_at: string | null;
  created_at: string;
}

export interface RequirementDraftResponse {
  title: string;
  summary: string;
  business_value: string;
  acceptance_criteria: string;
  status: string;
}

export interface ScenarioDraft {
  scenario_title: string;
  given_text: string | null;
  when_text: string | null;
  then_text: string | null;
  coverage_frontend: boolean;
  coverage_backend: boolean;
  coverage_app: boolean;
  status: string;
}

export interface ScenarioDraftResponse {
  feature_name: string;
  scenarios: ScenarioDraft[];
}

export interface TaskBreakdownDraftItem {
  title: string;
  description: string | null;
  task_type: string;
  owner_name: string | null;
  status: string;
}

export interface TaskBreakdownDraftResponse {
  tasks: TaskBreakdownDraftItem[];
}

export interface DashboardRequirementSummary {
  id: number;
  title: string;
  status: string;
  scenario_count: number;
  task_count: number;
  latest_acceptance_status: string;
  latest_test_summary_result: string;
  health: string;
  needs_attention: boolean;
  updated_at: string;
}

export interface DashboardSummaryCounts {
  total_requirements: number;
  draft_requirements: number;
  ready_requirements: number;
  accepted_requirements: number;
  at_risk_requirements: number;
  missing_scenarios_requirements: number;
  missing_tasks_requirements: number;
  in_progress_requirements: number;
  ready_for_review_requirements: number;
}

export interface DashboardAttentionItem {
  id: number;
  title: string;
  health: string;
  summary: string;
}

export interface DashboardRecommendedAction {
  owner: string;
  summary: string;
}

export interface DashboardSummaryResponse {
  counts: DashboardSummaryCounts;
  rows: DashboardRequirementSummary[];
  attention_needed: DashboardAttentionItem[];
  recommended_actions: DashboardRecommendedAction[];
}
