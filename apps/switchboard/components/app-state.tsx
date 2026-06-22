"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applications as seedApplications, auditEvents as seedAudit } from "@/lib/mock-data";
import type { AIApplication, AuditEvent, CreateApplicationInput } from "@/lib/types";

type AppContextValue = {
  applications: AIApplication[];
  auditEvents: AuditEvent[];
  toast: string | null;
  createApplication: (input: CreateApplicationInput) => AIApplication;
  publishApplication: (id: string) => void;
  redeployApplication: (id: string) => void;
  disableApplication: (id: string) => void;
  resetDemoData: () => void;
  recordAudit: (action: string, target: string, type?: string) => void;
  simulateAction: (action: string, target: string, type?: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const storageKey = "switchboard-ai-state-v2";

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [applications, setApplications] = useState(seedApplications);
  const [auditEvents, setAuditEvents] = useState(seedAudit);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { applications?: AIApplication[]; auditEvents?: AuditEvent[] };
      if (parsed.applications) setApplications(parsed.applications);
      if (parsed.auditEvents) setAuditEvents(parsed.auditEvents);
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify({ applications, auditEvents }));
  }, [applications, auditEvents]);

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
    showToast("Demo data reset.");
  }

  const value = useMemo(() => ({ applications, auditEvents, toast, createApplication, publishApplication, redeployApplication, disableApplication, resetDemoData, recordAudit, simulateAction }), [applications, auditEvents, toast]);

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
