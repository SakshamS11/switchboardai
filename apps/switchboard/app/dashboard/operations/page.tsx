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
    nextStep: "Reconnect the Legal Sandbox agent, then redeploy the AnythingLLM instance if configuration drift is detected."
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
  const [selectedId, setSelectedId] = useState(incidents[0].id);
  const selected = incidents.find((incident) => incident.id === selectedId) ?? incidents[0];

  return (
    <div className="page">
      <PageHeader eyebrow="Command Center" title="Incidents" description="Track active AI operations incidents, affected systems, mitigations, and response history." />
      <div className="grid kpis">
        <MetricCard label="Open incidents" value={String(incidents.length)} detail="Active response queue" status="Warning" />
        <MetricCard label="Critical incidents" value="1" detail="Legal Sandbox offline" status="Critical" />
        <MetricCard label="Mitigations ready" value={String(operations.length)} detail="Operator actions available" status="Healthy" />
        <MetricCard label="SLA risk" value={selected.due} detail="Nearest due response" status="Warning" />
      </div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card>
          <div className="card-header"><div><h3>Incident queue</h3><p className="muted">Select an incident to review evidence and take action.</p></div></div>
          <div className="selector-list" style={{ padding: 16 }}>
            {incidents.map((incident) => (
              <button key={incident.id} type="button" className={`selector-item ${incident.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(incident.id)}>
                <span className="row"><strong>{incident.title}</strong><StatusBadge value={incident.severity} /></span>
                <small>{incident.category} - {incident.affected}</small>
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
              <button className="button" type="button" onClick={() => simulateAction(selected.action, selected.title, "Incident")}>{selected.action}</button>
              <button className="button secondary" type="button" onClick={() => simulateAction("Opened incident evidence", selected.title, "Incident")}>View evidence</button>
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
    </div>
  );
}
