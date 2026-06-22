"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applications as seedApplications, auditEvents as seedAudit } from "@/lib/mock-data";
import type { AIApplication, AuditEvent } from "@/lib/types";

type AppContextValue = {
  applications: AIApplication[];
  auditEvents: AuditEvent[];
  toast: string | null;
  publishApplication: (id: string) => void;
  redeployApplication: (id: string) => void;
  disableApplication: (id: string) => void;
  recordAudit: (action: string, target: string, type?: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);
const storageKey = "switchboard-ai-demo-state";

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
      actor: "demo-admin",
      type,
      action,
      target,
      status: "Success"
    };
    setAuditEvents((current) => [event, ...current]);
  }

  function updateApplication(id: string, changes: Partial<AIApplication>, action: string) {
    const app = applications.find((item) => item.id === id);
    setApplications((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
    if (app) recordAudit(action, app.name, "Application");
    showToast(`${action} simulated. No backend change was made.`);
  }

  function publishApplication(id: string) {
    updateApplication(id, { status: "Deploying", lastDeployed: "Deployment pending" }, "Publish application");
  }

  function redeployApplication(id: string) {
    updateApplication(id, { status: "Deploying", lastDeployed: "Redeploy requested" }, "Redeploy AnythingLLM instance");
  }

  function disableApplication(id: string) {
    updateApplication(id, { status: "Disabled" }, "Disable application");
  }

  const value = useMemo(() => ({ applications, auditEvents, toast, publishApplication, redeployApplication, disableApplication, recordAudit }), [applications, auditEvents, toast]);

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
