export const requirementStatusLabels = {
  draft: "草稿",
  ready: "就绪",
  in_progress: "进行中",
  in_acceptance: "验收中",
  blocked: "阻塞",
  done: "完成",
} as const;

export const scenarioStatusLabels = {
  draft: "草稿",
  ready: "就绪",
  in_progress: "进行中",
  blocked: "阻塞",
  done: "完成",
} as const;

export const taskStatusLabels = {
  todo: "待办",
  in_progress: "进行中",
  review: "评审中",
  done: "完成",
  blocked: "阻塞",
} as const;

export const taskTypeLabels = {
  backend: "后端",
  frontend: "前端",
  app: "应用",
  qa: "测试",
  product: "产品",
} as const;

export const acceptanceStatusLabels = {
  none: "暂无",
  pending: "待处理",
  in_review: "评审中",
  passed: "通过",
  failed: "失败",
  blocked: "阻塞",
} as const;

export const testSummaryResultLabels = {
  passed: "通过",
  failed: "失败",
  partial: "部分通过",
  blocked: "阻塞",
} as const;

export const dashboardHealthLabels = {
  Accepted: "已验收",
  "At Risk": "有风险",
  "Needs Definition": "待澄清",
  "In Progress": "进行中",
  "Ready for Review": "待评审",
} as const;

export function displayRequirementStatus(status: string) {
  return requirementStatusLabels[status as keyof typeof requirementStatusLabels] ?? status;
}

export function displayScenarioStatus(status: string) {
  return scenarioStatusLabels[status as keyof typeof scenarioStatusLabels] ?? status;
}

export function displayTaskStatus(status: string) {
  return taskStatusLabels[status as keyof typeof taskStatusLabels] ?? status;
}

export function displayTaskType(taskType: string) {
  return taskTypeLabels[taskType as keyof typeof taskTypeLabels] ?? taskType;
}

export function displayAcceptanceStatus(status: string) {
  return acceptanceStatusLabels[status as keyof typeof acceptanceStatusLabels] ?? status;
}

export function displayTestSummaryResult(result: string) {
  return testSummaryResultLabels[result as keyof typeof testSummaryResultLabels] ?? result;
}

export function displayDashboardHealth(health: string) {
  return dashboardHealthLabels[health as keyof typeof dashboardHealthLabels] ?? health;
}
