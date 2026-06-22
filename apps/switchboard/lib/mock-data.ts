import type { AIApplication, AuditEvent, GovernedAgent, InfrastructureTarget, KnowledgeBase, ModelRecord, RoutingPolicy, Team } from "./types";

export const organization = {
  name: "Acme Corp",
  domain: "acme.ai",
  region: "UAE North",
  aiOpsStatus: "Warning",
  evidenceReadiness: 72
};

export const infrastructureTargets: InfrastructureTarget[] = [
  { id: "acme-azure", name: "Acme Azure GPU Server", type: "Azure VM", region: "UAE North", status: "Healthy", agent: "Online", stack: "Private AI Production - vLLM", gpu: "NVIDIA L40S", gpuLoad: 71, vramUsed: 34, vramTotal: 48, heartbeat: "18 sec ago" },
  { id: "claims-node", name: "Claims On-Prem Node", type: "On-prem GPU", region: "Dubai Office", status: "Warning", agent: "Online", stack: "Private RAG Stack", gpu: "RTX 4090", gpuLoad: 92, vramUsed: 22, vramTotal: 24, heartbeat: "22 sec ago" },
  { id: "aws-private", name: "AWS Private AI Node", type: "AWS EC2", region: "eu-west-1", status: "Healthy", agent: "Online", stack: "Developer AI Stack", gpu: "A10G", gpuLoad: 54, vramUsed: 16, vramTotal: 24, heartbeat: "26 sec ago" },
  { id: "legal-sandbox", name: "Legal Sandbox", type: "Workstation", region: "Legal Department", status: "Offline", agent: "Offline", stack: "Governed Chat Workspace", gpu: "Not detected", gpuLoad: 0, vramUsed: 0, vramTotal: 0, heartbeat: "42 min ago" }
];

export const modelCatalog: ModelRecord[] = [
  { id: "falcon-40b", name: "Falcon 40B Local", provider: "TII Falcon", runtime: "vLLM", hosting: "Customer server", status: "Running", sensitivityFit: "Restricted", target: "Acme Azure GPU Server", inputCostAed: 0, outputCostAed: 0, contextWindow: "8k", fallbackEligible: true },
  { id: "qwen-32b", name: "Qwen 32B Local", provider: "Qwen", runtime: "vLLM", hosting: "Customer server", status: "Running", sensitivityFit: "Restricted", target: "Claims On-Prem Node", inputCostAed: 0, outputCostAed: 0, contextWindow: "32k", fallbackEligible: true },
  { id: "deepseek-coder", name: "DeepSeek Coder Local", provider: "DeepSeek weights", runtime: "Ollama", hosting: "Customer server", status: "Running", sensitivityFit: "Internal", target: "AWS Private AI Node", inputCostAed: 0, outputCostAed: 0, contextWindow: "16k", fallbackEligible: true },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", runtime: "External API", hosting: "External provider", status: "Warning", sensitivityFit: "General", target: "Secret ref: openai-prod", inputCostAed: 18, outputCostAed: 54, contextWindow: "128k", fallbackEligible: true },
  { id: "claude-sonnet", name: "Claude Sonnet", provider: "Anthropic", runtime: "External API", hosting: "External provider", status: "Connected", sensitivityFit: "Internal", target: "Secret ref: anthropic-prod", inputCostAed: 22, outputCostAed: 66, contextWindow: "200k", fallbackEligible: true }
];

export const applications: AIApplication[] = [
  { id: "legal-ai", name: "Legal AI Assistant", team: "Legal", purpose: "Contract review, legal drafting, and restricted document Q&A.", slug: "legal", url: "https://chat.legal.acme.ai", status: "Deploying", targetServerId: "legal-sandbox", chatEngine: "AnythingLLM", allowedModels: ["Qwen 32B Local", "Claude Sonnet"], knowledgeBases: ["Legal Contracts"], agents: ["Contract Review Agent"], routingPolicy: "Legal Sovereignty Router", tokenBudget: 4200000, tokensUsed: 2600000, spendBudgetAed: 30000, spendUsedAed: 18600, externalModelRule: "Restricted", lastDeployed: "Pending reconnect", activeUsers: 18, monthlyRequests: 16300, avgLatencyMs: 940 },
  { id: "claims-ai", name: "Claims AI Assistant", team: "Claims", purpose: "Private claims summarization and policy retrieval.", slug: "claims", url: "https://chat.claims.acme.ai", status: "Live", targetServerId: "claims-node", chatEngine: "AnythingLLM", allowedModels: ["Qwen 32B Local", "Falcon 40B Local"], knowledgeBases: ["Claims SOPs", "Policy Documents"], agents: ["Claims Summary Agent"], routingPolicy: "Claims Local-Only", tokenBudget: 9000000, tokensUsed: 7100000, spendBudgetAed: 42000, spendUsedAed: 31200, externalModelRule: "Blocked", lastDeployed: "Today 10:18", activeUsers: 46, monthlyRequests: 38120, avgLatencyMs: 1180 },
  { id: "engineering-copilot", name: "Engineering Copilot", team: "Engineering", purpose: "Code drafting, review, architecture help, and engineering knowledge.", slug: "engineering", url: "https://chat.engineering.acme.ai", status: "Live", targetServerId: "aws-private", chatEngine: "AnythingLLM", allowedModels: ["DeepSeek Coder Local", "Claude Sonnet", "GPT-4o"], knowledgeBases: ["Engineering Docs"], agents: ["Code Review Agent"], routingPolicy: "Engineering Code Ladder", tokenBudget: 12000000, tokensUsed: 8200000, spendBudgetAed: 72000, spendUsedAed: 42000, externalModelRule: "Allowed", lastDeployed: "Yesterday 16:04", activeUsers: 72, monthlyRequests: 41200, avgLatencyMs: 760 },
  { id: "support-desk", name: "Support Desk AI", team: "Customer Support", purpose: "Product FAQ retrieval and support response drafting.", slug: "support", url: "https://chat.support.acme.ai", status: "Live", targetServerId: "acme-azure", chatEngine: "AnythingLLM", allowedModels: ["Falcon 40B Local", "GPT-4o"], knowledgeBases: ["Product FAQ"], agents: ["Support Triage Agent"], routingPolicy: "Support Cache Ladder", tokenBudget: 7600000, tokensUsed: 4600000, spendBudgetAed: 25000, spendUsedAed: 14200, externalModelRule: "Restricted", lastDeployed: "Today 08:32", activeUsers: 91, monthlyRequests: 28700, avgLatencyMs: 690 }
];

export const routingPolicies: RoutingPolicy[] = [
  { id: "legal-router", name: "Legal Sovereignty Router", module: "Sovereignty Router", scope: "Legal AI Assistant", sensitivity: "Restricted", primary: "Qwen 32B Local", fallback: "Fail closed", blocked: "GPT-4o, Gemini", status: "Warning", version: "v3" },
  { id: "claims-local", name: "Claims Local-Only", module: "Sovereignty Router", scope: "Claims AI Assistant", sensitivity: "Restricted", primary: "Qwen 32B Local", fallback: "Falcon 40B Local", blocked: "All external providers", status: "Healthy", version: "v7" },
  { id: "support-cache", name: "Support Cache Ladder", module: "Budget Circuit Breaker", scope: "Support Desk AI", sensitivity: "Internal", primary: "Falcon 40B Local", fallback: "GPT-4o by approval", blocked: "Premium model over budget", status: "Healthy", version: "v4" },
  { id: "provider-degradation", name: "OpenAI Degradation Fallback", module: "Provider Degradation", scope: "External-enabled applications", sensitivity: "Internal", primary: "Claude Sonnet", fallback: "Local Qwen for sensitive work", blocked: "Degraded provider", status: "Warning", version: "v2" }
];

export const knowledgeBases: KnowledgeBase[] = [
  { id: "legal-contracts", name: "Legal Contracts", source: "SharePoint", documents: 1240, status: "Indexed", sensitivity: "Restricted", assignedApps: ["Legal AI Assistant"], assignedTeams: ["Legal"], lastSync: "16 min ago" },
  { id: "claims-sops", name: "Claims SOPs", source: "S3", documents: 850, status: "Indexed", sensitivity: "Confidential", assignedApps: ["Claims AI Assistant"], assignedTeams: ["Claims"], lastSync: "22 min ago" },
  { id: "engineering-docs", name: "Engineering Docs", source: "Google Drive", documents: 2100, status: "Syncing", sensitivity: "Internal", assignedApps: ["Engineering Copilot"], assignedTeams: ["Engineering"], lastSync: "Syncing now" },
  { id: "product-faq", name: "Product FAQ", source: "Upload", documents: 390, status: "Indexed", sensitivity: "General", assignedApps: ["Support Desk AI"], assignedTeams: ["Customer Support"], lastSync: "1 hour ago" }
];

export const agents: GovernedAgent[] = [
  { id: "contract-review", name: "Contract Review Agent", owner: "Legal Ops", allowedModels: ["Qwen 32B Local"], knowledgeBases: ["Legal Contracts"], tools: ["redline_summary", "clause_compare"], approvalRule: "Approval required before final legal recommendation", externalModelRule: "Blocked", budgetAed: 8000, status: "Warning", killSwitch: "Ready" },
  { id: "claims-summary", name: "Claims Summary Agent", owner: "Claims Ops", allowedModels: ["Qwen 32B Local"], knowledgeBases: ["Claims SOPs"], tools: ["claim_summary_generator"], approvalRule: "Approval required before claim decision", externalModelRule: "Blocked", budgetAed: 12000, status: "Healthy", killSwitch: "Ready" },
  { id: "code-review", name: "Code Review Agent", owner: "Engineering Platform", allowedModels: ["DeepSeek Coder Local", "Claude Sonnet"], knowledgeBases: ["Engineering Docs"], tools: ["repo_reader", "diff_explainer"], approvalRule: "Approval required before merge action", externalModelRule: "Restricted", budgetAed: 18000, status: "Healthy", killSwitch: "Ready" }
];

export const teams: Team[] = [
  { id: "legal", name: "Legal", owner: "Maya Khan", users: 18, applications: ["Legal AI Assistant"], tokenBudget: 4200000, tokensUsed: 2600000, spendBudgetAed: 30000, spendUsedAed: 18600, risk: "Warning" },
  { id: "claims", name: "Claims", owner: "Omar Nasser", users: 46, applications: ["Claims AI Assistant"], tokenBudget: 9000000, tokensUsed: 7100000, spendBudgetAed: 42000, spendUsedAed: 31200, risk: "Warning" },
  { id: "engineering", name: "Engineering", owner: "Sara Patel", users: 72, applications: ["Engineering Copilot"], tokenBudget: 12000000, tokensUsed: 8200000, spendBudgetAed: 72000, spendUsedAed: 42000, risk: "Healthy" },
  { id: "support", name: "Customer Support", owner: "Daniel Lee", users: 91, applications: ["Support Desk AI"], tokenBudget: 7600000, tokensUsed: 4600000, spendBudgetAed: 25000, spendUsedAed: 14200, risk: "Healthy" }
];

export const auditEvents: AuditEvent[] = [
  { id: "audit-1", time: "12:08", actor: "demo-admin", type: "Application", action: "Published AnythingLLM application", target: "Support Desk AI", status: "Success" },
  { id: "audit-2", time: "11:54", actor: "agent:claims-node", type: "Command", action: "Reported GPU pressure", target: "Claims On-Prem Node", status: "Pending" },
  { id: "audit-3", time: "11:40", actor: "governance-lead", type: "Policy", action: "Updated Sovereignty Router", target: "Legal AI Assistant", status: "Success" },
  { id: "audit-4", time: "11:22", actor: "system", type: "Provider", action: "Detected OpenAI latency drift", target: "GPT-4o", status: "Pending" },
  { id: "audit-5", time: "10:51", actor: "demo-admin", type: "Evidence", action: "Exported readiness evidence", target: "ISO/IEC 42001 pack", status: "Success" }
];

export const operations = [
  { severity: "Critical", title: "Legal Sandbox agent offline", affected: "Legal AI Assistant", action: "Reconnect agent before application can go Live", owner: "Infrastructure", href: "/dashboard/infrastructure" },
  { severity: "Warning", title: "Claims GPU near VRAM limit", affected: "Claims On-Prem Node", action: "Simulate capacity reallocation before adding load", owner: "Platform Ops", href: "/dashboard/cost-capacity" },
  { severity: "Warning", title: "OpenAI latency degraded", affected: "External-enabled applications", action: "Confirm fallback policy is active", owner: "AI Platform", href: "/dashboard/safeguards" }
] as const;
