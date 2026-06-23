"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { accessState as seedAccessState, agentApprovals as seedAgentApprovals, agents as seedAgents, applications as seedApplications, auditEvents as seedAudit, incidents as seedIncidents, infrastructureTargets as seedServers, invitations as seedInvitations, knowledgeBases as seedKnowledgeBases, modelCatalog as seedModelCatalog, organization as seedOrganization, routingPolicies as seedRoutingPolicies, stackDeployments as seedStackDeployments, stackTemplates as seedStackTemplates, teamMembers as seedTeamMembers, teams as seedTeams } from "@/lib/mock-data";
import type { AccessState, AgentApproval, AIApplication, AuditEvent, CreateApplicationInput, GovernedAgent, Incident, IncidentStatus, InfrastructureTarget, InvitationRecord, KnowledgeBase, ModelRecord, OrganizationSettings, RoutingPolicy, StackDeployment, StackTemplate, Team, TeamMember } from "@/lib/types";

type AppContextValue = {
  organizationSettings: OrganizationSettings;
  applications: AIApplication[];
  auditEvents: AuditEvent[];
  teams: Team[];
  teamMembers: TeamMember[];
  invitations: InvitationRecord[];
  accessState: AccessState;
  modelCatalog: ModelRecord[];
  knowledgeBases: KnowledgeBase[];
  governedAgents: GovernedAgent[];
  routingPolicies: RoutingPolicy[];
  agentApprovals: AgentApproval[];
  incidents: Incident[];
  servers: InfrastructureTarget[];
  stackTemplates: StackTemplate[];
  stackDeployments: StackDeployment[];
  isHydrated: boolean;
  toast: string | null;
  createApplication: (input: CreateApplicationInput) => AIApplication;
  saveOrganizationSettings: (input: OrganizationSettings) => void;
  testNotificationIntegration: () => void;
  publishApplication: (id: string) => void;
  redeployApplication: (id: string) => void;
  disableApplication: (id: string) => void;
  resetDemoData: () => void;
  recordAudit: (action: string, target: string, type?: string) => void;
  simulateAction: (action: string, target: string, type?: string) => void;
  acknowledgeIncident: (id: string) => void;
  mitigateIncident: (id: string) => void;
  resolveIncident: (id: string, summary: string, rootCause: string) => void;
  addServer: (input: { name: string; type: string; region: string; environment: string }) => InfrastructureTarget;
  restartServerAgent: (id: string) => void;
  deployStack: (templateId: string, serverId: string) => { ok: boolean; message: string };
  saveAccessState: (next: AccessState, note?: string) => void;
  openAccessManager: (options?: Partial<AccessDrawerState>) => void;
  closeAccessManager: () => void;
  accessDrawer: AccessDrawerState;
  inviteMember: (input: { email: string; teamId: string; role: "Member" | "Team Admin" | "Viewer" }) => void;
  revokeInvitation: (id: string) => void;
  updateTeamBudget: (teamId: string, tokenBudget: number, spendBudgetAed: number, hardLimit: boolean) => { ok: boolean; message: string };
  updateUserLimit: (userId: string, tokenLimit: number) => { ok: boolean; message: string };
  addModel: (input: Omit<ModelRecord, "id" | "status"> & { status?: ModelRecord["status"] }) => ModelRecord;
  refreshProviderHealth: () => void;
  addKnowledgeBase: (input: Omit<KnowledgeBase, "id" | "documents" | "status" | "assignedApps" | "assignedTeams" | "lastSync">) => KnowledgeBase;
  updateAgent: (id: string, changes: Partial<GovernedAgent>, action?: string) => void;
  createAgent: (input: Pick<GovernedAgent, "name" | "owner" | "approvalRule" | "budgetAed">) => GovernedAgent;
  decideAgentApproval: (id: string, decision: "Approved" | "Rejected") => void;
  createRoutingPolicy: (input: Omit<RoutingPolicy, "id" | "version" | "status" | "active">) => { ok: boolean; message: string };
  updateRoutingPolicy: (id: string, changes: Partial<RoutingPolicy>, action?: string) => { ok: boolean; message: string };
};

const AppContext = createContext<AppContextValue | null>(null);
export type AccessDrawerState = {
  open: boolean;
  teamId: string;
  mode: "team" | "matrix";
  tab: "models" | "knowledge" | "agents";
  filterResourceId?: string;
};

const storageKey = "switchboard-ai-state-v3";

const seededOrganizationSettings: OrganizationSettings = {
  name: seedOrganization.name,
  domain: seedOrganization.domain,
  region: seedOrganization.region,
  aiOpsStatus: seedOrganization.aiOpsStatus as OrganizationSettings["aiOpsStatus"],
  environment: "Production",
  auditRetention: "7 years",
  notificationChannel: "Slack and email",
  evidenceReadiness: seedOrganization.evidenceReadiness,
  thresholds: {
    gpuWarning: 85,
    gpuCritical: 95,
    latencyWarningMs: 1200,
    costWarningPercent: 80
  },
  integrationStatus: "Connected",
  integrationLastTest: "Today 09:30"
};

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings>(seededOrganizationSettings);
  const [applications, setApplications] = useState(seedApplications);
  const [auditEvents, setAuditEvents] = useState(seedAudit);
  const [teams, setTeams] = useState<Team[]>(seedTeams);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(seedTeamMembers);
  const [invitations, setInvitations] = useState<InvitationRecord[]>(seedInvitations);
  const [accessState, setAccessState] = useState<AccessState>(seedAccessState);
  const [modelCatalog, setModelCatalog] = useState<ModelRecord[]>(seedModelCatalog);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>(seedKnowledgeBases);
  const [governedAgents, setGovernedAgents] = useState<GovernedAgent[]>(seedAgents);
  const [routingPolicies, setRoutingPolicies] = useState<RoutingPolicy[]>(seedRoutingPolicies);
  const [agentApprovals, setAgentApprovals] = useState<AgentApproval[]>(seedAgentApprovals);
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [servers, setServers] = useState<InfrastructureTarget[]>(seedServers);
  const [stackTemplates] = useState<StackTemplate[]>(seedStackTemplates);
  const [stackDeployments, setStackDeployments] = useState<StackDeployment[]>(seedStackDeployments);
  const [accessDrawer, setAccessDrawer] = useState<AccessDrawerState>({ open: false, teamId: seedTeams[0]?.id ?? "legal", mode: "team", tab: "models" });
  const [isHydrated, setIsHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setIsHydrated(true);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { organizationSettings?: OrganizationSettings; applications?: AIApplication[]; auditEvents?: AuditEvent[]; teams?: Team[]; teamMembers?: TeamMember[]; invitations?: InvitationRecord[]; accessState?: AccessState; modelCatalog?: ModelRecord[]; knowledgeBases?: KnowledgeBase[]; governedAgents?: GovernedAgent[]; routingPolicies?: RoutingPolicy[]; agentApprovals?: AgentApproval[]; incidents?: Incident[]; servers?: InfrastructureTarget[]; stackDeployments?: StackDeployment[] };
      if (parsed.organizationSettings) setOrganizationSettings(parsed.organizationSettings);
      if (parsed.applications) setApplications(parsed.applications);
      if (parsed.auditEvents) setAuditEvents(parsed.auditEvents);
      if (parsed.teams) setTeams(parsed.teams);
      if (parsed.teamMembers) setTeamMembers(parsed.teamMembers);
      if (parsed.invitations) setInvitations(parsed.invitations);
      if (parsed.accessState) setAccessState(parsed.accessState);
      if (parsed.modelCatalog) setModelCatalog(parsed.modelCatalog);
      if (parsed.knowledgeBases) setKnowledgeBases(parsed.knowledgeBases);
      if (parsed.governedAgents) setGovernedAgents(parsed.governedAgents);
      if (parsed.routingPolicies) setRoutingPolicies(parsed.routingPolicies);
      if (parsed.agentApprovals) setAgentApprovals(parsed.agentApprovals);
      if (parsed.incidents) setIncidents(parsed.incidents);
      if (parsed.servers) setServers(parsed.servers);
      if (parsed.stackDeployments) setStackDeployments(parsed.stackDeployments);
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ organizationSettings, applications, auditEvents, teams, teamMembers, invitations, accessState, modelCatalog, knowledgeBases, governedAgents, routingPolicies, agentApprovals, incidents, servers, stackDeployments }));
  }, [organizationSettings, applications, auditEvents, teams, teamMembers, invitations, accessState, modelCatalog, knowledgeBases, governedAgents, routingPolicies, agentApprovals, incidents, servers, stackDeployments]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2600);
  }

  function recordAudit(action: string, target: string, type = "Configuration") {
    const event: AuditEvent = {
      id: `audit-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      actor: "admin",
      type,
      action,
      target,
      status: "Success"
    };
    setAuditEvents((current) => [event, ...current]);
  }

  function simulateAction(action: string, target: string, type = "Configuration") {
    recordAudit(action, target, type);
    showToast(`${action}. Audit entry recorded.`);
  }

  function saveOrganizationSettings(input: OrganizationSettings) {
    setOrganizationSettings(input);
    recordAudit("Saved organization settings", input.name, "Configuration");
    showToast("Settings saved for this browser session.");
  }

  function testNotificationIntegration() {
    setOrganizationSettings((current) => ({ ...current, integrationStatus: "Testing" }));
    recordAudit("Tested notification integration", organizationSettings.notificationChannel, "Configuration");
    window.setTimeout(() => {
      setOrganizationSettings((current) => ({ ...current, integrationStatus: "Connected", integrationLastTest: now() }));
      showToast("Notification test completed. Settings state updated.");
    }, 800);
  }

  function now() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function appendIncidentEvent(id: string, event: string, outcome: string, status?: IncidentStatus) {
    setIncidents((current) => current.map((incident) => incident.id === id ? {
      ...incident,
      status: status ?? incident.status,
      timeline: [{ time: now(), actor: "admin", event, outcome }, ...incident.timeline]
    } : incident));
  }

  function acknowledgeIncident(id: string) {
    const incident = incidents.find((item) => item.id === id);
    if (!incident || incident.status === "Resolved") return;
    setIncidents((current) => current.map((item) => item.id === id ? { ...item, status: "Acknowledged", acknowledgedAt: now(), timeline: [{ time: now(), actor: "admin", event: "Incident acknowledged", outcome: "Owner actively reviewing" }, ...item.timeline] } : item));
    recordAudit("Acknowledged incident", incident.title, "Monitoring");
    showToast(`${incident.title} acknowledged.`);
  }

  function mitigateIncident(id: string) {
    const incident = incidents.find((item) => item.id === id);
    if (!incident) return;
    appendIncidentEvent(id, "Mitigation started", incident.recommendedAction, "Mitigating");
    const incidentTitle = incident.title;
    const serverId = incident.serverId;
    recordAudit("Started incident mitigation", incidentTitle, "Monitoring");
    if (serverId) {
      setServers((current) => current.map((server) => server.id === serverId ? { ...server, agent: "Restarting", status: "Warning", heartbeat: "restarting now" } : server));
      window.setTimeout(() => {
        setServers((current) => current.map((server) => server.id === serverId ? { ...server, agent: "Online", status: server.gpuLoad >= 85 ? "Warning" : "Healthy", heartbeat: "just now" } : server));
        setApplications((current) => current.map((app) => app.targetServerId === serverId && app.status === "Deploying" ? { ...app, status: "Live", lastDeployed: "Recovered just now" } : app));
        appendIncidentEvent(id, "Mitigation completed", "Agent online and related workspace checks recovered", "Ready to resolve");
        recordAudit("Mitigation completed", incidentTitle, "Monitoring");
      }, 1300);
    } else {
      window.setTimeout(() => appendIncidentEvent(id, "Mitigation completed", "Fallback policy confirmed", "Ready to resolve"), 900);
    }
  }

  function resolveIncident(id: string, summary: string, rootCause: string) {
    const incident = incidents.find((item) => item.id === id);
    if (!incident || !summary.trim()) return;
    setIncidents((current) => current.map((item) => item.id === id ? { ...item, status: "Resolved", resolvedAt: now(), resolutionSummary: summary, rootCause, timeline: [{ time: now(), actor: "admin", event: "Incident resolved", outcome: summary }, ...item.timeline] } : item));
    recordAudit("Resolved incident", incident.title, "Monitoring");
    showToast(`${incident.title} resolved.`);
  }

  function addServer(input: { name: string; type: string; region: string; environment: string }) {
    const server: InfrastructureTarget = {
      id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `server-${Date.now()}`,
      name: input.name,
      type: input.type,
      region: input.region,
      environment: input.environment,
      status: "Healthy",
      agent: "Online",
      stack: "Unassigned",
      gpu: input.type.includes("GPU") ? "Detected GPU" : "Not detected",
      gpuLoad: input.type.includes("GPU") ? 14 : 0,
      vramUsed: input.type.includes("GPU") ? 2 : 0,
      vramTotal: input.type.includes("GPU") ? 24 : 0,
      heartbeat: "just now"
    };
    setServers((current) => [server, ...current]);
    recordAudit("Connected server agent", server.name, "Infrastructure");
    showToast(`${server.name} connected. Deploy an AI stack next.`);
    return server;
  }

  function restartServerAgent(id: string) {
    const server = servers.find((item) => item.id === id);
    if (!server) return;
    setServers((current) => current.map((item) => item.id === id ? { ...item, agent: "Restarting", status: "Warning", heartbeat: "restarting now" } : item));
    recordAudit("Restarted server agent", server.name, "Infrastructure");
    window.setTimeout(() => {
      setServers((current) => current.map((item) => item.id === id ? { ...item, agent: "Online", status: item.gpuLoad >= 85 ? "Warning" : "Healthy", heartbeat: "just now" } : item));
      showToast(`${server.name} agent is online.`);
    }, 1000);
  }

  function deployStack(templateId: string, serverId: string) {
    const template = stackTemplates.find((item) => item.id === templateId);
    const server = servers.find((item) => item.id === serverId);
    if (!template || !server) return { ok: false, message: "Select a stack template and server." };
    if (template.automatic) return { ok: false, message: "This stack is provisioned automatically when a workspace is published." };
    if (server.agent !== "Online") return { ok: false, message: "Deployment requires an online server agent." };
    if (template.minVramGb > server.vramTotal) return { ok: false, message: `Insufficient VRAM. Requires ${template.minVramGb}GB; this server has ${server.vramTotal}GB.` };
    if (!template.compatibility.includes(server.type)) return { ok: false, message: "Template is not compatible with this infrastructure type." };
    const selectedTemplate = template;
    const selectedServer = server;
    const deployment: StackDeployment = {
      id: `deploy-${selectedTemplate.id}-${Date.now()}`,
      name: `${selectedTemplate.name} on ${selectedServer.name}`,
      templateId,
      serverId,
      version: "v0.2",
      services: selectedTemplate.services,
      status: "Queued",
      health: "Warning",
      updated: "Queued now"
    };
    setStackDeployments((current) => [deployment, ...current]);
    setServers((current) => current.map((item) => item.id === serverId ? { ...item, stack: selectedTemplate.name, status: "Warning" } : item));
    recordAudit("Queued stack deployment", deployment.name, "Deployment");
    window.setTimeout(() => setStackDeployments((current) => current.map((item) => item.id === deployment.id ? { ...item, status: "Deploying", updated: "Deploying now" } : item)), 500);
    window.setTimeout(() => {
      setStackDeployments((current) => current.map((item) => item.id === deployment.id ? { ...item, status: "Running", health: "Healthy", updated: "Running just now" } : item));
      setServers((current) => current.map((item) => item.id === serverId ? { ...item, stack: selectedTemplate.name, status: item.gpuLoad >= 85 ? "Warning" : "Healthy" } : item));
      recordAudit("Stack deployment running", deployment.name, "Deployment");
      showToast(`${selectedTemplate.name} is running on ${selectedServer.name}.`);
    }, 1500);
    return { ok: true, message: "Deployment queued. Progress will update automatically." };
  }

  function saveAccessState(next: AccessState, note = "Saved team access policy") {
    setAccessState(next);
    recordAudit(note, "Shared access model", "Permission");
    showToast(`${note}. Employees now inherit the saved access.`);
  }

  function openAccessManager(options?: Partial<AccessDrawerState>) {
    setAccessDrawer((current) => ({ ...current, ...options, open: true }));
  }

  function closeAccessManager() {
    setAccessDrawer((current) => ({ ...current, open: false, filterResourceId: undefined }));
  }

  function inviteMember(input: { email: string; teamId: string; role: "Member" | "Team Admin" | "Viewer" }) {
    const invitation: InvitationRecord = { id: `invite-${Date.now()}`, email: input.email, teamId: input.teamId, role: input.role, invitedAt: "Just now", expiresIn: "72 hours", status: "Pending" };
    setInvitations((current) => [invitation, ...current]);
    recordAudit("Created invitation record", input.email, "Permission");
    showToast("Invitation created for this workspace session.");
  }

  function revokeInvitation(id: string) {
    const invitation = invitations.find((item) => item.id === id);
    setInvitations((current) => current.map((item) => item.id === id ? { ...item, status: "Revoked" } : item));
    if (invitation) recordAudit("Revoked invitation", invitation.email, "Permission");
  }

  function updateTeamBudget(teamId: string, tokenBudget: number, spendBudgetAed: number, hardLimit: boolean) {
    const team = teams.find((item) => item.id === teamId);
    if (!team) return { ok: false, message: "Select a team." };
    if (tokenBudget < 0 || spendBudgetAed < 0) return { ok: false, message: "Budgets cannot be negative." };
    const reserved = teamMembers.filter((member) => member.teamId === teamId).reduce((sum, member) => sum + member.tokenLimit, 0);
    if (reserved > tokenBudget) return { ok: false, message: "Reserved individual limits exceed the team token budget." };
    setTeams((current) => current.map((item) => item.id === teamId ? { ...item, tokenBudget, spendBudgetAed, hardLimit } : item));
    setApplications((current) => current.map((app) => app.team === team.name ? { ...app, tokenBudget, spendBudgetAed } : app));
    recordAudit("Updated team budget limits", team.name, "Budget");
    showToast("Budget limits saved. Workspace allowance views updated.");
    return { ok: true, message: "Budget limits saved." };
  }

  function updateUserLimit(userId: string, tokenLimit: number) {
    const member = teamMembers.find((item) => item.id === userId);
    if (!member) return { ok: false, message: "Select a user." };
    const team = teams.find((item) => item.id === member.teamId);
    if (!team) return { ok: false, message: "User team was not found." };
    if (tokenLimit < 0) return { ok: false, message: "Limit cannot be negative." };
    if (tokenLimit > team.tokenBudget) return { ok: false, message: "Individual limit cannot exceed the team limit." };
    const reserved = teamMembers.filter((item) => item.teamId === member.teamId && item.id !== userId).reduce((sum, item) => sum + item.tokenLimit, 0) + tokenLimit;
    if (reserved > team.tokenBudget) return { ok: false, message: "Total reserved individual limits exceed the team budget." };
    setTeamMembers((current) => current.map((item) => item.id === userId ? { ...item, tokenLimit } : item));
    recordAudit("Updated individual token limit", member.email, "Budget");
    return { ok: true, message: "User limit saved." };
  }

  function addModel(input: Omit<ModelRecord, "id" | "status"> & { status?: ModelRecord["status"] }) {
    const model: ModelRecord = { ...input, id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `model-${Date.now()}`, status: input.status ?? (input.hosting === "External provider" ? "Connected" : "Running") };
    setModelCatalog((current) => [model, ...current]);
    recordAudit("Added governed model", model.name, "Model");
    showToast(`${model.name} added to governed catalog.`);
    return model;
  }

  function refreshProviderHealth() {
    setModelCatalog((current) => current.map((model) => model.provider === "OpenAI" ? { ...model, status: model.status === "Warning" ? "Connected" : "Warning" } : model));
    recordAudit("Refreshed provider health", "Models & Providers", "Model");
    showToast("Provider health refreshed.");
  }

  function addKnowledgeBase(input: Omit<KnowledgeBase, "id" | "documents" | "status" | "assignedApps" | "assignedTeams" | "lastSync">) {
    const kb: KnowledgeBase = { ...input, id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `kb-${Date.now()}`, documents: 0, status: "Syncing", assignedApps: [], assignedTeams: [], lastSync: "Queued" };
    setKnowledgeBases((current) => [kb, ...current]);
    recordAudit("Connected knowledge source", kb.name, "Knowledge");
    return kb;
  }

  function updateAgent(id: string, changes: Partial<GovernedAgent>, action = "Updated governed agent") {
    const agent = governedAgents.find((item) => item.id === id);
    setGovernedAgents((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
    if (agent) recordAudit(action, agent.name, "Agent");
  }

  function createAgent(input: Pick<GovernedAgent, "name" | "owner" | "approvalRule" | "budgetAed">) {
    const agent: GovernedAgent = { id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `agent-${Date.now()}`, name: input.name, owner: input.owner, allowedModels: [], knowledgeBases: [], tools: ["retrieval_search"], approvalRule: input.approvalRule, externalModelRule: "Restricted", budgetAed: input.budgetAed, monthlySpendLimitAed: input.budgetAed, monthlyTokenLimit: 1000000, status: "Active", killSwitch: "Not armed" };
    setGovernedAgents((current) => [agent, ...current]);
    recordAudit("Created governed agent", agent.name, "Agent");
    return agent;
  }

  function decideAgentApproval(id: string, decision: "Approved" | "Rejected") {
    const approval = agentApprovals.find((item) => item.id === id);
    setAgentApprovals((current) => current.map((item) => item.id === id ? { ...item, status: decision } : item));
    if (approval) recordAudit(`${decision} agent approval`, approval.requestedAction, "Agent");
  }

  function validatePolicy(input: Partial<RoutingPolicy>) {
    if (input.module === "Sovereignty Router") {
      const primary = modelCatalog.find((model) => model.name === input.primary);
      if (!primary || primary.hosting !== "Customer server" || primary.status !== "Running") return "Sovereignty Router primary model must be a running local model.";
      if (input.fallback !== "None" && input.fallback !== "Fail closed") return "Sovereignty Router must fail closed with no external fallback.";
      if (!String(input.blocked ?? "").toLowerCase().includes("external")) return "External models must be blocked for restricted sovereignty routes.";
    }
    return "";
  }

  function createRoutingPolicy(input: Omit<RoutingPolicy, "id" | "version" | "status" | "active">) {
    const error = validatePolicy(input);
    if (error) return { ok: false, message: error };
    const policy: RoutingPolicy = { ...input, id: `policy-${Date.now()}`, version: "v1", status: "Healthy", active: true, outcome: `${input.scope} uses ${input.primary}. Fallback: ${input.fallback}. Blocked: ${input.blocked}.` };
    setRoutingPolicies((current) => [policy, ...current]);
    recordAudit("Created routing policy", policy.name, "Policy");
    return { ok: true, message: "Policy created." };
  }

  function updateRoutingPolicy(id: string, changes: Partial<RoutingPolicy>, action = "Updated routing policy") {
    const policy = routingPolicies.find((item) => item.id === id);
    const merged = policy ? { ...policy, ...changes } : changes;
    const error = validatePolicy(merged);
    if (error) return { ok: false, message: error };
    setRoutingPolicies((current) => current.map((item) => item.id === id ? { ...item, ...changes, version: changes.version ?? `v${Number(item.version.replace("v", "")) + 1}` } : item));
    if (policy) recordAudit(action, policy.name, "Policy");
    return { ok: true, message: "Policy saved." };
  }

  function createApplication(input: CreateApplicationInput) {
    const application: AIApplication = {
      id: `${input.slug}-${Date.now()}`,
      name: input.name,
      team: input.team,
      purpose: input.purpose,
      slug: input.slug,
      url: `https://chat.${input.slug}.acme.ai`,
      status: "Draft",
      targetServerId: input.targetServerId,
      chatEngine: "Managed workspace chat",
      allowedModels: input.allowedModels,
      knowledgeBases: input.knowledgeBases,
      agents: input.agents,
      routingPolicy: input.routingPolicy,
      tokenBudget: input.tokenBudget,
      tokensUsed: 0,
      spendBudgetAed: input.spendBudgetAed,
      spendUsedAed: 0,
      externalModelRule: input.externalModelRule,
      lastDeployed: "Draft",
      activeUsers: 0,
      monthlyRequests: 0,
      avgLatencyMs: 0
    };
    setApplications((current) => [application, ...current]);
    const teamId = teams.find((item) => item.name === application.team)?.id;
    if (teamId) setAccessState((current) => ({ ...current, workspaceGrants: { ...current.workspaceGrants, [teamId]: [...new Set([...(current.workspaceGrants[teamId] ?? []), application.id])] } }));
    recordAudit("Created AI Workspace draft", application.name, "Workspace");
    showToast(`${application.name} draft created.`);
    return application;
  }

  function updateApplication(id: string, changes: Partial<AIApplication>, action: string) {
    const app = applications.find((item) => item.id === id);
    setApplications((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
    if (app) recordAudit(action, app.name, "Workspace");
    showToast(`${action} queued. Audit entry recorded.`);
  }

  function publishApplication(id: string) {
    const app = applications.find((item) => item.id === id);
    if (!app) return;
    updateApplication(id, { status: "Deploying", lastDeployed: "Validating configuration" }, "Started AI Workspace deployment");
    window.setTimeout(() => {
      setApplications((current) => current.map((item) => item.id === id ? { ...item, status: "Live", lastDeployed: "Live just now" } : item));
      recordAudit("AI Workspace deployment completed", app.name, "Workspace");
      showToast(`${app.name} is live. Employee preview is available.`);
    }, 1300);
  }

  function redeployApplication(id: string) {
    updateApplication(id, { status: "Deploying", lastDeployed: "Redeploy requested" }, "Redeployed workspace chat runtime");
  }

  function disableApplication(id: string) {
    updateApplication(id, { status: "Disabled" }, "Disabled AI Workspace");
  }

  function resetDemoData() {
    window.localStorage.removeItem(storageKey);
    setOrganizationSettings(seededOrganizationSettings);
    setApplications(seedApplications);
    setAuditEvents(seedAudit);
    setTeams(seedTeams);
    setTeamMembers(seedTeamMembers);
    setInvitations(seedInvitations);
    setAccessState(seedAccessState);
    setModelCatalog(seedModelCatalog);
    setKnowledgeBases(seedKnowledgeBases);
    setGovernedAgents(seedAgents);
    setRoutingPolicies(seedRoutingPolicies);
    setAgentApprovals(seedAgentApprovals);
    setIncidents(seedIncidents);
    setServers(seedServers);
    setStackDeployments(seedStackDeployments);
    showToast("Local workspace state reset.");
  }

  const value = useMemo(() => ({ organizationSettings, applications, auditEvents, teams, teamMembers, invitations, accessState, modelCatalog, knowledgeBases, governedAgents, routingPolicies, agentApprovals, incidents, servers, stackTemplates, stackDeployments, isHydrated, toast, createApplication, saveOrganizationSettings, testNotificationIntegration, publishApplication, redeployApplication, disableApplication, resetDemoData, recordAudit, simulateAction, acknowledgeIncident, mitigateIncident, resolveIncident, addServer, restartServerAgent, deployStack, saveAccessState, openAccessManager, closeAccessManager, accessDrawer, inviteMember, revokeInvitation, updateTeamBudget, updateUserLimit, addModel, refreshProviderHealth, addKnowledgeBase, updateAgent, createAgent, decideAgentApproval, createRoutingPolicy, updateRoutingPolicy }), [organizationSettings, applications, auditEvents, teams, teamMembers, invitations, accessState, modelCatalog, knowledgeBases, governedAgents, routingPolicies, agentApprovals, incidents, servers, stackTemplates, stackDeployments, isHydrated, toast, accessDrawer]);

  return (
    <AppContext.Provider value={value}>
      {children}
      {toast ? <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 50 }} className="card pad">{toast}</div> : null}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}
