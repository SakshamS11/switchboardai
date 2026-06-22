"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";

export default function AuditPage() {
  const { auditEvents, simulateAction } = useAppState();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const types = ["All", ...Array.from(new Set(auditEvents.map((event) => event.type)))];
  const rows = useMemo(() => auditEvents.filter((event) => (type === "All" || event.type === type) && `${event.actor} ${event.action} ${event.target}`.toLowerCase().includes(query.toLowerCase())), [auditEvents, query, type]);

  function exportAudit() {
    const content = rows.map((event) => `${event.time},${event.actor},${event.type},${event.action},${event.target},${event.status}`).join("\n");
    const blob = new Blob([`time,actor,type,action,target,status\n${content}`], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "switchboard-ai-audit-log.csv";
    link.click();
    URL.revokeObjectURL(url);
    simulateAction("Exported audit log", "Audit Logs", "Audit");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Governance" title="Audit Logs" description="Searchable control-plane audit events for metadata, policy, budget and remote operations." action={<button className="button" onClick={exportAudit}>Export Audit</button>} />
      <div className="callout">This frontend contains simulated append-only demo audit data. Production audit storage requires backend persistence and access controls.</div>
      <div className="grid kpis" style={{ marginTop: 18 }}>
        <MetricCard label="Audit events" value={String(auditEvents.length)} detail="Current demo state" status="Healthy" />
        <MetricCard label="Event categories" value={String(types.length - 1)} detail="Application, command, policy and more" status="Healthy" />
        <MetricCard label="Pending outcomes" value={String(auditEvents.filter((event) => event.status === "Pending").length)} detail="Open control events" status="Warning" />
        <MetricCard label="Exportable" value="CSV" detail="Download filtered rows" status="Healthy" />
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="card-header">
          <div><h3>Audit trail</h3><p className="muted">Conversation content is not sent to Switchboard AI.</p></div>
          <div className="row">
            <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search audit..." />
            <select className="field" value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select>
          </div>
        </div>
        <div className="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Type</th><th>Action</th><th>Target</th><th>Outcome</th></tr></thead><tbody>{rows.map((event) => <tr key={event.id}><td>{event.time}</td><td>{event.actor}</td><td>{event.type}</td><td>{event.action}</td><td>{event.target}</td><td><StatusBadge value={event.status} /></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
