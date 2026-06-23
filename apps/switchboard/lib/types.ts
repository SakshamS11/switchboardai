export type Status = "Healthy" | "Warning" | "Critical" | "Offline" | "Draft" | "Deploying" | "Live" | "Disabled" | "Connected" | "Running" | "Failed" | "Success" | "Pending" | "Active" | "Paused";

export type Sensitivity = "General" | "Internal" | "Confidential" | "Restricted";

export type OrganizationSettings = {
  name: string;
  domain: string;
  region: string;
  aiOpsStatus: "Healthy" | "Warning" | "Critical";
  environment: string;
  auditRetention: string;
  notificationChannel: string;
  evidenceReadiness: number;
  thresholds: {
    gpuWarning: number;
    gpuCritical: number;
    latencyWarningMs: number;
    costWarningPercent: number;
  };
  integrationStatus: "Untested" | "Testing" | "Connected" | "Failed";
  integrationLastTest: string;
};

export type AIApplication = {
  id: string;
  name: string;
  team: string;
  purpose: string;
  slug: string;
  url: string;
  status: "Draft" | "Deploying" | "Live" | "Disabled" | "Failed";
  targetServerId: string;
  chatEngine: "Managed workspace chat";
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
  status: "Untested" | "Testing" | "Running" | "Connected" | "Warning" | "Failed";
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
  active?: boolean;
  outcome?: string;
};

export type KnowledgeBase = {
  id: string;
  name: string;
  source: "Upload" | "SharePoint" | "Google Drive" | "S3";
  documents: number;
  status: "Indexed" | "Syncing" | "Warning" | "Failed";
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
  status: "Active" | "Paused";
  killSwitch: "Armed" | "Not armed";
  monthlyTokenLimit?: number;
  monthlySpendLimitAed?: number;
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
  hardLimit?: boolean;
  governanceOwner?: string;
};

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  teamId: string;
  role: "Member" | "Team Admin" | "Viewer";
  clearance: Sensitivity;
  tokenLimit: number;
  tokensUsed: number;
};

export type InvitationRecord = {
  id: string;
  email: string;
  teamId: string;
  role: "Member" | "Team Admin" | "Viewer";
  invitedAt: string;
  expiresIn: string;
  status: "Pending" | "Accepted" | "Expired" | "Revoked";
};

export type AccessState = {
  modelGrants: Record<string, string[]>;
  knowledgeGrants: Record<string, string[]>;
  agentGrants: Record<string, string[]>;
  workspaceGrants: Record<string, string[]>;
};

export type AgentApproval = {
  id: string;
  agentId: string;
  requestedAction: string;
  payloadSummary: string;
  requestingRun: string;
  risk: "Low" | "Medium" | "High";
  approver: string;
  createdAt: string;
  expiresIn: string;
  status: "Pending" | "Approved" | "Rejected" | "Expired";
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
