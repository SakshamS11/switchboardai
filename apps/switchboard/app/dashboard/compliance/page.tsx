"use client";

import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { organization } from "@/lib/mock-data";

const gaps = [
  { gap: "Finance agent human approval evidence", owner: "Finance Ops", due: "2026-07-04", priority: "High", status: "Open" },
  { gap: "Legal workspace risk review refresh", owner: "Governance", due: "2026-07-08", priority: "High", status: "Open" },
  { gap: "Provider fallback policy acceptance", owner: "AI Platform", due: "2026-07-12", priority: "Medium", status: "In progress" }
];

export default function CompliancePage() {
  const { simulateAction } = useAppState();

  function exportEvidence() {
    const content = `Switchboard AI Evidence Pack\nReadiness: ${organization.evidenceReadiness}%\nGenerated: ${new Date().toISOString()}\nThis evidence pack supports ISO/IEC 42001 readiness preparation only. It does not constitute or imply ISO/IEC 42001 certification.`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "switchboard-ai-evidence-pack.txt";
    link.click();
    URL.revokeObjectURL(url);
    simulateAction("Exported compliance readiness evidence pack", "Compliance Readiness", "Compliance");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Governance" title="Compliance Readiness" description="Evidence, oversight and governance preparation for ISO/IEC 42001 readiness support." action={<button className="button" type="button" onClick={exportEvidence}>Export Evidence</button>} />
      <div className="callout">This evidence pack supports ISO/IEC 42001 readiness preparation only. It does not constitute or imply ISO/IEC 42001 certification.</div>
      <div className="grid kpis" style={{ marginTop: 18 }}>
        <MetricCard label="Readiness" value={`${organization.evidenceReadiness}%`} detail="Evidence coverage" status="Warning" />
        <MetricCard label="AI systems" value="4" detail="Registry records" status="Healthy" />
        <MetricCard label="Risk assessments" value="3/4" detail="Current records" status="Warning" />
        <MetricCard label="Open gaps" value={String(gaps.length)} detail="Governance tasks" status="Warning" />
      </div>
      <div className="grid two" style={{ marginTop: 18 }}>
        <Card style={{ minHeight: 0 }}>
          <div className="card-header"><div><h3>Governance gaps</h3><p className="muted">Preparation tasks that need owner follow-up.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Gap</th><th>Owner</th><th>Due</th><th>Priority</th><th>Status</th></tr></thead><tbody>{gaps.map((gap) => <tr key={gap.gap}><td><strong>{gap.gap}</strong></td><td>{gap.owner}</td><td>{gap.due}</td><td>{gap.priority}</td><td><StatusBadge value={gap.status} /></td></tr>)}</tbody></table></div>
        </Card>
        <Card pad>
          <h3>Evidence vault</h3>
          <div className="control-list" style={{ marginTop: 12 }}>
            {["AI System Registry", "Human Oversight Records", "Risk Assessments", "Policy Acceptance", "Remote Command Audit"].map((item) => <div className="control-row" key={item}><div><strong>{item}</strong><small>Metadata and control-plane evidence</small></div><StatusBadge value="Indexed" /></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}
