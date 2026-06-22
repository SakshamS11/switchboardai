"use client";

import { use, useState } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets } from "@/lib/mock-data";
import { aed, formatNumber, percent } from "@/lib/utils";

const tabs = ["Configuration", "Deployment", "Usage", "Safeguards"] as const;

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { applications, publishApplication, redeployApplication, disableApplication } = useAppState();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Configuration");
  const app = applications.find((item) => item.id === id);
  if (!app) return <div className="page"><Card pad><h2>Application not found</h2><p className="muted">Return to the application registry and select an active record.</p></Card></div>;
  const target = infrastructureTargets.find((item) => item.id === app.targetServerId);
  return (
    <div className="page">
      <PageHeader eyebrow="AI Application" title={app.name} description={`${app.team} employee AI application powered by a dedicated AnythingLLM instance.`} action={<ButtonLink href="/dashboard/applications" secondary>Back to applications</ButtonLink>} />
      <section className="application-hero" style={{ marginBottom: 18 }}>
        <div className="row"><div><p className="eyebrow" style={{ color: "var(--brand-accent)" }}>Employee launch URL</p><h2 style={{ margin: 0 }}>{app.url.replace("https://", "")}</h2><p>Employees access this governed application at its workspace subdomain. The admin configures policy; AnythingLLM handles chat.</p></div><div className="row"><button className="button secondary" onClick={() => navigator.clipboard?.writeText(app.url)}>Copy employee link</button><a className="button" href={app.url} target="_blank">Open chat interface</a></div></div>
      </section>
      <div className="grid kpis"><Card pad><span className="metric-label">Status</span><div className="metric-value"><StatusBadge value={app.status} /></div><p className="muted">{app.lastDeployed}</p></Card><Card pad><span className="metric-label">Target server</span><div className="metric-value" style={{ fontSize: 18 }}>{target?.name ?? "Unassigned"}</div><p className="muted">{target?.agent ?? "No agent"}</p></Card><Card pad><span className="metric-label">Monthly requests</span><div className="metric-value">{formatNumber(app.monthlyRequests)}</div><p className="muted">{app.activeUsers} active users</p></Card><Card pad><span className="metric-label">Spend</span><div className="metric-value">{aed(app.spendUsedAed)}</div><Progress value={percent(app.spendUsedAed, app.spendBudgetAed)} /></Card></div>
      <div className="tabs" style={{ marginTop: 18 }}>{tabs.map((tab) => <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      {activeTab === "Configuration" ? <Card pad style={{ marginTop: 18 }}><h3>Configuration</h3><div className="grid three"><Detail label="Chat engine" value="AnythingLLM" /><Detail label="Subdomain slug" value={app.slug} /><Detail label="External model rule" value={app.externalModelRule} /><Detail label="Allowed models" value={app.allowedModels.join(", ")} /><Detail label="Knowledge bases" value={app.knowledgeBases.join(", ")} /><Detail label="Governed agents" value={app.agents.join(", ")} /></div></Card> : null}
      {activeTab === "Deployment" ? <Card pad style={{ marginTop: 18 }}><h3>Deployment</h3><p className="muted">Publishing sends a typed allowlisted deploy command to the infrastructure agent. No arbitrary shell command is possible.</p><div className="grid three"><Detail label="Deployment status" value={app.status} /><Detail label="Target server" value={target?.name ?? "Unassigned"} /><Detail label="Last deployed" value={app.lastDeployed} /></div><div className="row" style={{ justifyContent: "flex-start", marginTop: 16 }}><button className="button" onClick={() => redeployApplication(app.id)}>Redeploy</button><button className="button secondary" onClick={() => publishApplication(app.id)}>Publish</button><button className="button secondary" onClick={() => disableApplication(app.id)}>Disable</button></div></Card> : null}
      {activeTab === "Usage" ? <Card pad style={{ marginTop: 18 }}><h3>Usage</h3><div className="grid three"><Detail label="Active users" value={String(app.activeUsers)} /><Detail label="Tokens used" value={`${formatNumber(app.tokensUsed)} / ${formatNumber(app.tokenBudget)}`} /><Detail label="Average latency" value={`${app.avgLatencyMs} ms`} /></div></Card> : null}
      {activeTab === "Safeguards" ? <Card pad style={{ marginTop: 18 }}><h3>Safeguards</h3><div className="callout">Sensitive prompts route to approved local models first. Restricted routes fail closed if no local model is available.</div><div className="grid three" style={{ marginTop: 14 }}><Detail label="Routing policy" value={app.routingPolicy} /><Detail label="Data boundary" value="Customer infrastructure" /><Detail label="Audit mode" value="Metadata and policy decisions only" /></div></Card> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
