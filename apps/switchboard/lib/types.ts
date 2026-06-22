export type Status = "Healthy" | "Warning" | "Critical" | "Offline" | "Draft" | "Deploying" | "Live" | "Disabled" | "Connected" | "Running" | "Failed" | "Success" | "Pending";

export type Sensitivity = "General" | "Internal" | "Confidential" | "Restricted";

export type AIApplication = {
  id: string;
  name: string;
  team: string;
  purpose: string;
  slug: string;
  url: string;
  status: "Draft" | "Deploying" | "Live" | "Disabled" | "Failed";
  targetServerId: string;
  chatEngine: "AnythingLLM";
  allowedModels: string[];
  knowledgeBases: string[];
  agents: string[];
  routingPolicy: string;
  tokenBudget: number;
  tokensUsed: number;
  spendBudgetAed: number;
  spendUsedAed: number;
  externalModelRule: "Allowed" | "Restricted" | "Blocked";
  lastDeployed: string;
  activeUsers: number;
  monthlyRequests: number;
  avgLatencyMs: number;
};

export type CreateApplicationInput = {
  name: string;
  team: string;
  purpose: string;
  slug: string;
  targetServerId: string;
  allowedModels: string[];
  knowledgeBases: string[];
  agents: string[];
  routingPolicy: string;
  tokenBudget: number;
  spendBudgetAed: number;
  externalModelRule: "Allowed" | "Restricted" | "Blocked";
};

export type InfrastructureTarget = {
  id: string;
  name: string;
  type: string;
  region: string;
  status: "Healthy" | "Warning" | "Offline";
  agent: "Waiting for agent" | "Online" | "Restarting" | "Offline" | "Failed";
  stack: string;
  gpu: string;
  gpuLoad: number;
  vramUsed: number;
  vramTotal: number;
  heartbeat: string;
  environment?: string;
};

export type IncidentStatus = "Open" | "Acknowledged" | "Mitigating" | "Ready to resolve" | "Resolved";

export type IncidentTimelineEvent = {
  time: string;
  actor: string;
  event: string;
  outcome: string;
};

export type Incident = {
  id: string;
  severity: "Critical" | "Warning" | "Info";
  status: IncidentStatus;
  title: string;
  category: "Infrastructure" | "Capacity" | "Provider" | "Cost" | "Service";
  affected: string;
  affectedServices: string[];
  businessImpact: string;
  evidence: string;
  owner: string;
  age: string;
  openedAt: string;
  recommendedAction: string;
  serverId?: string;
  provider?: string;
  timeline: IncidentTimelineEvent[];
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionSummary?: string;
  rootCause?: string;
};

export type StackTemplate = {
  id: string;
  name: string;
  bestUse: string;
  services: string[];
  requirements: string;
  minVramGb: number;
  compatibility: string[];
  automatic?: boolean;
};

export type StackDeploymentStatus = "Queued" | "Deploying" | "Running" | "Failed";

export type StackDeployment = {
  id: string;
  name: string;
  templateId: string;
  serverId: string;
  version: string;
  services: string[];
  status: StackDeploymentStatus;
  health: "Healthy" | "Warning" | "Failed";
  updated: string;
};

export type ModelRecord = {
  id: string;
  name: string;
  provider: string;
  runtime: "Ollama" | "vLLM" | "External API";
  hosting: "Customer server" | "External provider";
  status: "Running" | "Connected" | "Warning";
  sensitivityFit: Sensitivity;
  target: string;
  inputCostAed: number;
  outputCostAed: number;
  contextWindow: string;
  fallbackEligible: boolean;
};

export type RoutingPolicy = {
  id: string;
  name: string;
  module: "Sovereignty Router" | "Cost Ladder" | "Provider Degradation" | "Budget Circuit Breaker" | "Prompt Firewall";
  scope: string;
  sensitivity: Sensitivity;
  primary: string;
  fallback: string;
  blocked: string;
  status: Status;
  version: string;
};

export type KnowledgeBase = {
  id: string;
  name: string;
  source: "Upload" | "SharePoint" | "Google Drive" | "S3";
  documents: number;
  status: "Indexed" | "Syncing" | "Warning";
  sensitivity: Sensitivity;
  assignedApps: string[];
  assignedTeams: string[];
  lastSync: string;
};

export type GovernedAgent = {
  id: string;
  name: string;
  owner: string;
  allowedModels: string[];
  knowledgeBases: string[];
  tools: string[];
  approvalRule: string;
  externalModelRule: "Allowed" | "Restricted" | "Blocked";
  budgetAed: number;
  status: Status;
  killSwitch: "Armed" | "Ready";
};

export type Team = {
  id: string;
  name: string;
  owner: string;
  users: number;
  applications: string[];
  tokenBudget: number;
  tokensUsed: number;
  spendBudgetAed: number;
  spendUsedAed: number;
  risk: Status;
};

export type AuditEvent = {
  id: string;
  time: string;
  actor: string;
  type: string;
  action: string;
  target: string;
  status: "Success" | "Blocked" | "Pending";
};
