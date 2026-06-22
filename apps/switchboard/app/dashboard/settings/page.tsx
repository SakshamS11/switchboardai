"use client";

import { useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { organization } from "@/lib/mock-data";

export default function SettingsPage() {
  const { simulateAction } = useAppState();
  const [orgName, setOrgName] = useState(organization.name);
  const [domain, setDomain] = useState(organization.domain);
  const [region, setRegion] = useState(organization.region);
  const [gpuWarning, setGpuWarning] = useState(85);
  const [gpuCritical, setGpuCritical] = useState(95);
  const [latencyWarning, setLatencyWarning] = useState(1200);
  const [costWarning, setCostWarning] = useState(80);
  const [auditRetention, setAuditRetention] = useState("7 years");
  const [notifications, setNotifications] = useState("Slack and email");
  const [saveState, setSaveState] = useState("Ready");

  function saveSettings() {
    setSaveState("Saved");
    simulateAction("Saved organization settings", "Settings");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="System" title="Settings" description="Manage organisation profile, thresholds, notifications, retention, and governance defaults." action={<button className="button" type="button" onClick={saveSettings}>Save changes</button>} />
      <div className="grid kpis">
        <MetricCard label="Organisation" value={orgName} detail={domain} status="Healthy" />
        <MetricCard label="Data region" value={region} detail="Customer-selected residency" status="Healthy" />
        <MetricCard label="Default chat" value="AnythingLLM" detail="Deployed per application" status="Healthy" />
        <MetricCard label="Settings state" value={saveState} detail="Last action in this session" status={saveState === "Saved" ? "Healthy" : "Pending"} />
      </div>

      <div className="settings-grid" style={{ marginTop: 18 }}>
        <Card pad>
          <h3>Organisation profile</h3>
          <div className="form-grid">
            <label className="field-group"><span className="metric-label">Organisation name</span><input className="field" value={orgName} onChange={(event) => setOrgName(event.target.value)} /></label>
            <label className="field-group"><span className="metric-label">Company domain</span><input className="field" value={domain} onChange={(event) => setDomain(event.target.value)} /></label>
            <label className="field-group"><span className="metric-label">Data region</span><select className="field" value={region} onChange={(event) => setRegion(event.target.value)}><option>UAE North</option><option>Dubai Office</option><option>eu-west-1</option></select></label>
            <label className="field-group"><span className="metric-label">Audit retention</span><select className="field" value={auditRetention} onChange={(event) => setAuditRetention(event.target.value)}><option>3 years</option><option>7 years</option><option>10 years</option></select></label>
          </div>
        </Card>
        <Card pad>
          <h3>Operational thresholds</h3>
          <div className="form-grid">
            <label className="field-group"><span className="metric-label">GPU warning %</span><input className="field" type="number" value={gpuWarning} onChange={(event) => setGpuWarning(Number(event.target.value))} /></label>
            <label className="field-group"><span className="metric-label">GPU critical %</span><input className="field" type="number" value={gpuCritical} onChange={(event) => setGpuCritical(Number(event.target.value))} /></label>
            <label className="field-group"><span className="metric-label">Latency warning ms</span><input className="field" type="number" value={latencyWarning} onChange={(event) => setLatencyWarning(Number(event.target.value))} /></label>
            <label className="field-group"><span className="metric-label">Cost warning %</span><input className="field" type="number" value={costWarning} onChange={(event) => setCostWarning(Number(event.target.value))} /></label>
          </div>
        </Card>
        <Card pad>
          <h3>Notifications</h3>
          <label className="field-group"><span className="metric-label">Alert channels</span><select className="field" value={notifications} onChange={(event) => setNotifications(event.target.value)}><option>Slack and email</option><option>Email only</option><option>Slack only</option><option>Webhook only</option></select></label>
          <p className="muted">Critical incidents, provider degradation, and approval requests use these channels.</p>
          <StatusBadge value="Connected" />
        </Card>
        <Card pad>
          <h3>Governance defaults</h3>
          <p className="muted">Evidence readiness supports ISO/IEC 42001 preparation. It does not mean certification.</p>
          <div className="control-list">
            <div className="control-row"><div><strong>Human approval for external actions</strong><small>Default for governed agents</small></div><StatusBadge value="Active" /></div>
            <div className="control-row"><div><strong>Restricted data fails closed</strong><small>No external fallback for restricted knowledge</small></div><StatusBadge value="Active" /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
