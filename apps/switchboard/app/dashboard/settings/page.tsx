"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import type { OrganizationSettings } from "@/lib/types";

type SettingsTab = "Profile" | "Thresholds" | "Integrations" | "Governance";

const tabs: SettingsTab[] = ["Profile", "Thresholds", "Integrations", "Governance"];

export default function SettingsPage() {
  const { organizationSettings, saveOrganizationSettings, testNotificationIntegration, resetDemoData } = useAppState();
  const [draft, setDraft] = useState<OrganizationSettings>(organizationSettings);
  const [activeTab, setActiveTab] = useState<SettingsTab>("Profile");
  const [savedMessage, setSavedMessage] = useState("Settings are synced with the current browser session.");

  useEffect(() => {
    setDraft(organizationSettings);
  }, [organizationSettings]);

  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(organizationSettings), [draft, organizationSettings]);

  function updateDraft(changes: Partial<OrganizationSettings>) {
    setDraft((current) => ({ ...current, ...changes }));
    setSavedMessage("Unsaved changes");
  }

  function updateThresholds(changes: Partial<OrganizationSettings["thresholds"]>) {
    setDraft((current) => ({ ...current, thresholds: { ...current.thresholds, ...changes } }));
    setSavedMessage("Unsaved changes");
  }

  function save() {
    saveOrganizationSettings(draft);
    setSavedMessage("Settings saved for this browser session.");
  }

  function discard() {
    setDraft(organizationSettings);
    setSavedMessage("Unsaved changes discarded.");
  }

  function resetLocalState() {
    if (!window.confirm("Reset local workspace state? This restores the seeded product data for this browser session.")) return;
    resetDemoData();
    setSavedMessage("Local workspace state reset.");
  }

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Set organisation defaults, alert thresholds, notifications and governance retention."
        action={<button className="button" type="button" onClick={save} disabled={!isDirty}>Save changes</button>}
      />

      <section className="settings-shell">
        <aside className="settings-tabs" aria-label="Settings sections">
          {tabs.map((tab) => (
            <button key={tab} className={activeTab === tab ? "active" : ""} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
              <span>{tabSummary(tab)}</span>
            </button>
          ))}
        </aside>

        <Card pad className="settings-panel">
          {activeTab === "Profile" ? (
            <section className="settings-section">
              <div className="card-header">
                <div>
                  <h3>Organisation profile</h3>
                  <p className="muted">These values appear in the app shell and generated workspace URLs.</p>
                </div>
                <StatusBadge value={draft.aiOpsStatus} />
              </div>
              <div className="form-grid">
                <label className="field-group"><span className="metric-label">Organisation name</span><input className="field" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} /></label>
                <label className="field-group"><span className="metric-label">Company domain</span><input className="field" value={draft.domain} onChange={(event) => updateDraft({ domain: event.target.value })} /></label>
                <label className="field-group"><span className="metric-label">Data region</span><select className="field" value={draft.region} onChange={(event) => updateDraft({ region: event.target.value })}><option>UAE North</option><option>Dubai Office</option><option>eu-west-1</option></select></label>
                <label className="field-group"><span className="metric-label">Environment label</span><select className="field" value={draft.environment} onChange={(event) => updateDraft({ environment: event.target.value })}><option>Production</option><option>Pilot</option><option>Development</option></select></label>
                <label className="field-group"><span className="metric-label">AI Ops status</span><select className="field" value={draft.aiOpsStatus} onChange={(event) => updateDraft({ aiOpsStatus: event.target.value as OrganizationSettings["aiOpsStatus"] })}><option>Healthy</option><option>Warning</option><option>Critical</option></select></label>
              </div>
            </section>
          ) : null}

          {activeTab === "Thresholds" ? (
            <section className="settings-section">
              <div className="card-header"><div><h3>Operational thresholds</h3><p className="muted">Overview and Monitoring use these thresholds to flag capacity and cost risk.</p></div></div>
              <div className="form-grid">
                <NumberField label="GPU warning %" value={draft.thresholds.gpuWarning} onChange={(value) => updateThresholds({ gpuWarning: value })} />
                <NumberField label="GPU critical %" value={draft.thresholds.gpuCritical} onChange={(value) => updateThresholds({ gpuCritical: value })} />
                <NumberField label="Latency warning ms" value={draft.thresholds.latencyWarningMs} onChange={(value) => updateThresholds({ latencyWarningMs: value })} />
                <NumberField label="Cost warning %" value={draft.thresholds.costWarningPercent} onChange={(value) => updateThresholds({ costWarningPercent: value })} />
              </div>
              <div className="callout">Thresholds are local to this browser session until backend policy storage is connected.</div>
            </section>
          ) : null}

          {activeTab === "Integrations" ? (
            <section className="settings-section">
              <div className="card-header">
                <div><h3>Notification channels</h3><p className="muted">Critical incidents, provider degradation and approval requests use these channels.</p></div>
                <StatusBadge value={organizationSettings.integrationStatus} />
              </div>
              <div className="form-grid compact">
                <label className="field-group"><span className="metric-label">Alert channel</span><select className="field" value={draft.notificationChannel} onChange={(event) => updateDraft({ notificationChannel: event.target.value })}><option>Slack and email</option><option>Email only</option><option>Slack only</option><option>Webhook only</option></select></label>
                <div className="settings-result"><span className="metric-label">Last test</span><strong>{organizationSettings.integrationLastTest}</strong><small>{organizationSettings.integrationStatus === "Testing" ? "Testing notification path..." : "Current saved integration state"}</small></div>
              </div>
              <button className="button secondary" type="button" onClick={testNotificationIntegration}>Test integration</button>
            </section>
          ) : null}

          {activeTab === "Governance" ? (
            <section className="settings-section">
              <div className="card-header"><div><h3>Governance defaults</h3><p className="muted">Evidence readiness supports ISO/IEC 42001 preparation; it does not mean certification.</p></div></div>
              <div className="form-grid compact">
                <label className="field-group"><span className="metric-label">Audit retention</span><select className="field" value={draft.auditRetention} onChange={(event) => updateDraft({ auditRetention: event.target.value })}><option>3 years</option><option>7 years</option><option>10 years</option></select></label>
                <NumberField label="Evidence readiness %" value={draft.evidenceReadiness} onChange={(value) => updateDraft({ evidenceReadiness: value })} />
              </div>
              <div className="control-list">
                <div className="control-row"><div><strong>Human approval for external actions</strong><small>Default for governed agents with external tools.</small></div><StatusBadge value="Active" /></div>
                <div className="control-row"><div><strong>Restricted data fails closed</strong><small>No external fallback for restricted knowledge routes.</small></div><StatusBadge value="Active" /></div>
              </div>
              <button className="button danger" type="button" onClick={resetLocalState}>Reset local workspace state</button>
            </section>
          ) : null}
        </Card>
      </section>

      <div className={`sticky-save-bar ${isDirty ? "visible" : ""}`} aria-live="polite">
        <span>{savedMessage}</span>
        <div>
          <button className="button secondary" type="button" onClick={discard} disabled={!isDirty}>Discard</button>
          <button className="button" type="button" onClick={save} disabled={!isDirty}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field-group">
      <span className="metric-label">{label}</span>
      <input className="field" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function tabSummary(tab: SettingsTab) {
  if (tab === "Profile") return "Org, region, environment";
  if (tab === "Thresholds") return "GPU, latency, spend";
  if (tab === "Integrations") return "Alerts and tests";
  return "Audit and evidence";
}
