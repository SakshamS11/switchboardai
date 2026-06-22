"use client";

import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { organization } from "@/lib/mock-data";

export default function AuditPage() {
  const { auditEvents, recordAudit } = useAppState();
  return <div className="page"><PageHeader eyebrow="Operate" title="Audit & Evidence" description="Append-only audit events and ISO/IEC 42001 readiness evidence support." action={<button className="button" onClick={() => recordAudit("Exported readiness evidence", "Evidence pack", "Evidence")}>Export evidence</button>} /><div className="grid kpis"><MetricCard label="Audit events" value={String(auditEvents.length)} detail="This browser session" status="Healthy" /><MetricCard label="Evidence readiness" value={`${organization.evidenceReadiness}%`} detail="Readiness support only" status="Warning" /><MetricCard label="Open gaps" value="5" detail="Preparation tasks" status="Warning" /><MetricCard label="Certification claim" value="None" detail="No certification implied" status="Healthy" /></div><Card style={{ marginTop: 18 }}><div className="card-header"><div><h3>Audit trail</h3><p className="muted">Conversation content is not sent to Switchboard AI. Audit rows represent metadata and control-plane actions.</p></div><ButtonLink href="/dashboard/settings" secondary>Retention settings</ButtonLink></div><div className="table-wrap"><table><thead><tr><th>Time</th><th>Actor</th><th>Type</th><th>Action</th><th>Target</th><th>Status</th></tr></thead><tbody>{auditEvents.map((event) => <tr key={event.id}><td>{event.time}</td><td>{event.actor}</td><td>{event.type}</td><td>{event.action}</td><td>{event.target}</td><td><StatusBadge value={event.status} /></td></tr>)}</tbody></table></div></Card></div>;
}
