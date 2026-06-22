"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applications as seedApplications, auditEvents as seedAudit, incidents as seedIncidents, infrastructureTargets as seedServers, stackDeployments as seedStackDeployments, stackTemplates as seedStackTemplates } from "@/lib/mock-data";
import type { AIApplication, AuditEvent, CreateApplicationInput, Incident, IncidentStatus, InfrastructureTarget, StackDeployment, StackTemplate } from "@/lib/types";

type AppContextValue = {
  applications: AIApplication[];
  auditEvents: AuditEvent[];
  incidents: Incident[];
  servers: InfrastructureTarget[];
  stackTemplates: StackTemplate[];
  stackDeployments: StackDeployment[];
  toast: string | null;
  createApplication: (input: CreateApplicationInput) => AIApplication;
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
};

const AppContext = createContext<AppContextValue | null>(null);
const storageKey = "switchboard-ai-state-v2";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState(seedApplications);
  const [auditEvents, setAuditEvents] = useState(seedAudit);
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [servers, setServers] = useState<InfrastructureTarget[]>(seedServers);
  const [stackTemplates] = useState<StackTemplate[]>(seedStackTemplates);
  const [stackDeployments, setStackDeployments] = useState<StackDeployment[]>(seedStackDeployments);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { applications?: AIApplication[]; auditEvents?: AuditEvent[]; incidents?: Incident[]; servers?: InfrastructureTarget[]; stackDeployments?: StackDeployment[] };
      if (parsed.applications) setApplications(parsed.applications);
      if (parsed.auditEvents) setAuditEvents(parsed.auditEvents);
      if (parsed.incidents) setIncidents(parsed.incidents);
      if (parsed.servers) setServers(parsed.servers);
      if (parsed.stackDeployments) setStackDeployments(parsed.stackDeployments);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ applications, auditEvents, incidents, servers, stackDeployments }));
  }, [applications, auditEvents, incidents, servers, stackDeployments]);

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
      chatEngine: "AnythingLLM",
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
    setApplications(seedApplications);
    setAuditEvents(seedAudit);
    setIncidents(seedIncidents);
    setServers(seedServers);
    setStackDeployments(seedStackDeployments);
    showToast("Demo data reset.");
  }

  const value = useMemo(() => ({ applications, auditEvents, incidents, servers, stackTemplates, stackDeployments, toast, createApplication, publishApplication, redeployApplication, disableApplication, resetDemoData, recordAudit, simulateAction, acknowledgeIncident, mitigateIncident, resolveIncident, addServer, restartServerAgent, deployStack }), [applications, auditEvents, incidents, servers, stackTemplates, stackDeployments, toast]);

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
