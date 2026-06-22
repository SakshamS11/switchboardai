"use client";

import Link from "next/link";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, MetricCard, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets, modelCatalog, operations, organization, teams } from "@/lib/mock-data";
import { aed, formatNumber, percent } from "@/lib/utils";

export default function DashboardPage() {
  const { applications } = useAppState();
  const liveApps = applications.filter((app) => app.status === "Live").length;
  const monthlyRequests = applications.reduce((sum, app) => sum + app.monthlyRequests, 0);
  const projectedSpend = applications.reduce((sum, app) => sum + app.spendUsedAed, 0);
  const offlineTargets = infrastructureTargets.filter((target) => target.status === "Offline").length;

  return (
    <div className="page">
      <PageHeader eyebrow="Command Center" title="AI estate overview" description="Health, application availability, cost, capacity, and evidence readiness for Acme Corp." action={<ButtonLink href="/dashboard/applications">Create AI Application</ButtonLink>} />
      <div className="grid kpis">
        <Card pad className="status-card"><div className="row"><span className="metric-label">AI Ops Status</span><StatusBadge value="Warning" /></div><div className="metric-value">3 issues</div><p className="muted">Legal agent offline, Claims GPU pressure, provider latency.</p></Card>
        <MetricCard label="AI Applications" value={`${liveApps}/${applications.length} live`} detail="AnythingLLM instances" status="Warning" />
        <MetricCard label="Infrastructure" value={`${infrastructureTargets.length - offlineTargets}/${infrastructureTargets.length} online`} detail="Agent-connected servers" status={offlineTargets ? "Warning" : "Healthy"} />
        <MetricCard label="Monthly requests" value={formatNumber(monthlyRequests)} detail="Across governed chat URLs" status="Healthy" />
      </div>
      <div className="grid kpis" style={{ marginTop: 16 }}>
        <MetricCard label="Projected spend" value={aed(projectedSpend)} detail="Metadata only, no content" status="Warning" />
        <MetricCard label="Evidence readiness" value={`${organization.evidenceReadiness}%`} detail="ISO/IEC 42001 readiness support" status="Warning" />
        <MetricCard label="Models available" value={String(modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected").length)} detail="Assignable to applications" status="Healthy" />
        <Card pad><div className="row"><span className="metric-label">Next action</span><StatusBadge value="Critical" /></div><div className="metric-value">Reconnect Legal</div><ButtonLink href="/dashboard/operations" secondary>Open operations</ButtonLink></Card>
      </div>
      <div className="grid two" style={{ marginTop: 18 }}>
        <Card>
          <div className="card-header"><div><h3>Immediate attention</h3><p className="muted">Response work lives in Health & Operations.</p></div><ButtonLink href="/dashboard/operations" secondary>View all</ButtonLink></div>
          {operations.map((item) => (
            <Link className="split-row" href={item.href} key={item.title}>
              <div><div className="row" style={{ justifyContent: "flex-start" }}><StatusBadge value={item.severity} /><strong>{item.title}</strong></div><p className="muted">{item.affected} - {item.action}</p></div>
              <span className="muted">{item.owner}</span>
            </Link>
          ))}
        </Card>
        <Card>
          <div className="card-header"><div><h3>Application availability</h3><p className="muted">One AnythingLLM instance per application.</p></div></div>
          <div className="stack" style={{ padding: 18 }}>
            {applications.map((app) => <div key={app.id}><div className="row"><Link href={`/dashboard/applications/${app.id}`}><strong>{app.name}</strong></Link><StatusBadge value={app.status} /></div><p className="muted">{app.url}</p></div>)}
          </div>
        </Card>
      </div>
      <div className="grid three" style={{ marginTop: 18 }}>
        <Card pad><h3>Usage by team</h3><div className="mini-bars">{teams.map((team) => <div className="mini-bar" key={team.id}><span>{team.name}</span><Progress value={percent(team.tokensUsed, team.tokenBudget)} /><span>{percent(team.tokensUsed, team.tokenBudget)}%</span></div>)}</div></Card>
        <Card pad><h3>Model posture</h3><p className="muted">Only Running or Connected catalog models can be assigned to applications.</p><div className="stack">{modelCatalog.slice(0, 4).map((model) => <div className="row" key={model.id}><span>{model.name}</span><StatusBadge value={model.status} /></div>)}</div></Card>
        <Card pad><h3>Evidence readiness</h3><div className="metric-value">{organization.evidenceReadiness}%</div><Progress value={organization.evidenceReadiness} /><p className="muted">ISO/IEC 42001 readiness support only. This is not certification.</p><ButtonLink href="/dashboard/audit" secondary>Open evidence</ButtonLink></Card>
      </div>
    </div>
  );
}
