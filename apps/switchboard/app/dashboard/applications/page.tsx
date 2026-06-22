"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets, knowledgeBases, modelCatalog, routingPolicies, teams } from "@/lib/mock-data";
import { aed, percent, slugify } from "@/lib/utils";

export default function ApplicationsPage() {
  const { applications, publishApplication } = useAppState();
  const [name, setName] = useState("Finance AI Desk");
  const slug = useMemo(() => slugify(name).replace(/-assistant|-desk|-ai/g, "") || "finance", [name]);
  const onlineTargets = infrastructureTargets.filter((target) => target.agent === "Online");
  return (
    <div className="page">
      <PageHeader eyebrow="Build" title="AI Applications" description="Create governed employee AI experiences. Publishing deploys a dedicated AnythingLLM instance at the application subdomain." action={<a className="button" href="#create-application">Create application</a>} />
      <div className="grid kpis">
        <Card pad><span className="metric-label">Applications</span><div className="metric-value">{applications.length}</div><p className="muted">Configured employee AI experiences</p></Card>
        <Card pad><span className="metric-label">Live URLs</span><div className="metric-value">{applications.filter((app) => app.status === "Live").length}</div><p className="muted">Active AnythingLLM subdomains</p></Card>
        <Card pad><span className="metric-label">Local-only apps</span><div className="metric-value">{applications.filter((app) => app.externalModelRule === "Blocked").length}</div><p className="muted">No external model route</p></Card>
        <Card pad><span className="metric-label">Total app spend</span><div className="metric-value">{aed(applications.reduce((sum, app) => sum + app.spendUsedAed, 0))}</div><p className="muted">Current period usage metadata</p></Card>
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Application registry</h3><p className="muted">The subdomain URL is the employee launch link.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Application</th><th>Team</th><th>Chat URL</th><th>Status</th><th>Models</th><th>Budget</th><th>Action</th></tr></thead><tbody>{applications.map((app) => <tr key={app.id}><td><strong>{app.name}</strong><br /><span className="muted">{app.chatEngine} - {app.purpose}</span></td><td>{app.team}</td><td><a className="muted" href={app.url} target="_blank">{app.url.replace("https://", "")}</a></td><td><StatusBadge value={app.status} /></td><td>{app.allowedModels.length}</td><td><Progress value={percent(app.tokensUsed, app.tokenBudget)} /></td><td><Link className="button secondary" href={`/dashboard/applications/${app.id}`}>Manage</Link></td></tr>)}</tbody></table></div>
      </Card>
      <div id="create-application" className="grid two" style={{ marginTop: 18 }}>
        <Card pad><h3>Create application</h3><p className="muted">Frontend mock only. Real publish will generate and deploy AnythingLLM configuration through the agent.</p><label className="stack"><span className="metric-label">Application name</span><input value={name} onChange={(event) => setName(event.target.value)} className="field" /></label><div className="grid two" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 12 }}><Field label="Subdomain preview" value={`chat.${slug}.acme.ai`} /><Field label="Chat engine" value="AnythingLLM" /><Field label="Target server" value={onlineTargets[0]?.name ?? "No online targets"} /><Field label="Routing policy" value={routingPolicies[0].name} /></div><div className="row" style={{ marginTop: 16 }}><button className="button" type="button" onClick={() => publishApplication("legal-ai")}>Simulate publish</button><ButtonLink href="/dashboard/infrastructure" secondary>Check servers</ButtonLink></div></Card>
        <Card pad><h3>Configuration sources</h3><p className="muted">Allowed options come from governed catalog objects.</p><div className="stack"><Field label="Active models" value={modelCatalog.filter((m) => m.status === "Running" || m.status === "Connected").map((m) => m.name).join(", ")} /><Field label="Knowledge bases" value={knowledgeBases.map((kb) => kb.name).join(", ")} /><Field label="Teams" value={teams.map((team) => team.name).join(", ")} /></div></Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
