"use client";

import { useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { operations } from "@/lib/mock-data";

const incidents = [
  {
    id: "legal-agent-offline",
    severity: "Critical",
    status: "Open",
    title: "Legal Sandbox agent offline",
    category: "Infrastructure",
    affected: "Legal AI Assistant",
    evidence: "No heartbeat for 42 minutes.",
    impact: "Legal team cannot use its governed local/private runtime.",
    owner: "Infrastructure",
    due: "18 min",
    action: "Restart agent",
    nextStep: "Reconnect the Legal Sandbox agent, then redeploy the workspace chat runtime if configuration drift is detected."
  },
  {
    id: "claims-gpu-pressure",
    severity: "Warning",
    status: "Open",
    title: "Claims GPU near VRAM limit",
    category: "Capacity",
    affected: "Claims On-Prem Node",
    evidence: "GPU 92%, VRAM 22/24GB.",
    impact: "Claims AI latency may increase and queue wait may breach SLA.",
    owner: "Platform Ops",
    due: "46 min",
    action: "Simulate capacity",
    nextStep: "Reclaim unused Finance capacity or add a Qwen Local replica before peak claims processing."
  },
  {
    id: "provider-latency",
    severity: "Warning",
    status: "Open",
    title: "External provider latency degraded",
    category: "Provider",
    affected: "External-enabled applications",
    evidence: "Provider health degraded 48 seconds ago.",
    impact: "Critical workflows may slow down unless approved fallbacks remain active.",
    owner: "AI Platform",
    due: "32 min",
    action: "Review routing",
    nextStep: "Confirm critical work is routed to approved Claude or local Qwen fallback by sensitivity."
  }
];

export default function OperationsPage() {
  const { simulateAction } = useAppState();
  const [alerts, setAlerts] = useState(incidents);
  const [selectedId, setSelectedId] = useState(incidents[0].id);
  const selected = alerts.find((incident) => incident.id === selectedId) ?? alerts[0];

  function updateAlert(status: string) {
    setAlerts((current) => current.map((alert) => alert.id === selected.id ? { ...alert, status } : alert));
    simulateAction(`${status} alert`, selected.title, "Monitoring");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Command Center" title="Monitoring" description="Operational signals, alerts, provider health, service health and response actions." />
      <div className="grid kpis">
        <MetricCard label="Open alerts" value={String(alerts.filter((alert) => alert.status === "Open").length)} detail="Active response queue" status="Warning" />
        <MetricCard label="Critical incidents" value="1" detail="Legal Sandbox offline" status="Critical" />
        <MetricCard label="Mitigations ready" value={String(operations.length)} detail="Operator actions available" status="Healthy" />
        <MetricCard label="SLA risk" value={selected.due} detail="Nearest due response" status="Warning" />
      </div>
      <div className="tabs" style={{ marginTop: 18 }}><button className="tab active">24h</button><button className="tab">7d</button><button className="tab">30d</button><select className="field"><option>All servers</option><option>Claims On-Prem Node</option><option>Legal Sandbox</option></select><select className="field"><option>All providers</option><option>OpenAI</option><option>Local vLLM</option></select><select className="field"><option>All severities</option><option>Critical</option><option>Warning</option></select></div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card>
          <div className="card-header"><div><h3>Incident queue</h3><p className="muted">Select an incident to review evidence and take action.</p></div></div>
          <div className="selector-list" style={{ padding: 16 }}>
            {alerts.map((incident) => (
              <button key={incident.id} type="button" className={`selector-item ${incident.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(incident.id)}>
                <span className="row"><strong>{incident.title}</strong><StatusBadge value={incident.severity} /></span>
                <small>{incident.category} - {incident.affected} - {incident.status}</small>
              </button>
            ))}
          </div>
        </Card>

        <Card pad>
          <div className="row"><div><h3>{selected.title}</h3><p className="muted">{selected.category} - owner: {selected.owner}</p></div><StatusBadge value={selected.severity} /></div>
          <div className="compact-card-grid" style={{ marginTop: 14 }}>
            <Card pad><span className="metric-label">Evidence</span><p><strong>{selected.evidence}</strong></p></Card>
            <Card pad><span className="metric-label">Impact</span><p><strong>{selected.impact}</strong></p></Card>
            <Card pad><span className="metric-label">Due response</span><div className="metric-value">{selected.due}</div></Card>
          </div>
          <Card pad style={{ marginTop: 14 }}>
            <h3>Recommended mitigation</h3>
            <p className="muted">{selected.nextStep}</p>
            <div className="row" style={{ justifyContent: "flex-start", marginTop: 12 }}>
              <button className="button" type="button" onClick={() => simulateAction(selected.action, selected.title, "Monitoring")}>{selected.action}</button>
              <button className="button secondary" type="button" onClick={() => updateAlert("Acknowledged")}>Acknowledge</button>
              <button className="button secondary" type="button" onClick={() => updateAlert("Resolved")}>Resolve</button>
            </div>
          </Card>
          <Card pad style={{ marginTop: 14 }}>
            <h3>Response timeline</h3>
            <div className="control-list">
              <div className="control-row"><div><strong>Signal detected</strong><small>{selected.evidence}</small></div><StatusBadge value="Open" /></div>
              <div className="control-row"><div><strong>Owner assigned</strong><small>{selected.owner}</small></div><StatusBadge value="Active" /></div>
              <div className="control-row"><div><strong>Mitigation ready</strong><small>{selected.action}</small></div><StatusBadge value="Healthy" /></div>
            </div>
          </Card>
        </Card>
      </div>
      <div className="grid three" style={{ marginTop: 18 }}>
        <Card pad><h3>GPU utilisation</h3><div className="mini-bars"><div className="mini-bar"><span>Claims</span><span className="progress warning"><span style={{ width: "92%" }} /></span><span>92%</span></div><div className="mini-bar"><span>Acme Azure</span><span className="progress"><span style={{ width: "71%" }} /></span><span>71%</span></div></div></Card>
        <Card pad><h3>Provider health</h3><div className="control-list"><div className="control-row"><div><strong>OpenAI</strong><small>Latency elevated</small></div><StatusBadge value="Warning" /></div><div className="control-row"><div><strong>Local vLLM</strong><small>Serving normally</small></div><StatusBadge value="Healthy" /></div></div></Card>
        <Card pad><h3>Service health</h3><div className="control-list"><div className="control-row"><div><strong>Claims RAG Stack</strong><small>All services running</small></div><StatusBadge value="Healthy" /></div><div className="control-row"><div><strong>Legal Sandbox</strong><small>Agent disconnected</small></div><StatusBadge value="Offline" /></div></div></Card>
      </div>
    </div>
  );
}
