"use client";

import { use, useState } from "react";
import { buildConflicts } from "@/components/access-manager";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { aed, formatNumber, percent } from "@/lib/utils";

const tabs = ["Configuration", "Deployment", "Usage"] as const;

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { applications, publishApplication, redeployApplication, disableApplication, simulateAction, teams, servers, accessState, modelCatalog, knowledgeBases, governedAgents, routingPolicies, openAccessManager } = useAppState();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Configuration");
  const app = applications.find((item) => item.id === id);
  if (!app) return <div className="page"><Card pad><h2>Workspace not found</h2><p className="muted">Return to the workspace registry and select an active record.</p></Card></div>;
  const workspaceId = app.id;
  const workspaceName = app.name;
  const target = servers.find((item) => item.id === app.targetServerId);
  const team = teams.find((item) => item.name === app.team);
  const conflicts = team ? buildConflicts(team.id, accessState, [app], modelCatalog, knowledgeBases, governedAgents) : ["Workspace team was not found."];
  const policy = routingPolicies.find((item) => item.name === app.routingPolicy);
  const readiness = [
    { label: "Target server online", value: target?.agent === "Online" ? "Ready" : "Blocked" },
    { label: "Required stack running", value: target?.stack && target.stack !== "No stack" ? "Ready" : "Blocked" },
    { label: "Selected models active", value: app.allowedModels.every((name) => ["Running", "Connected"].includes(modelCatalog.find((model) => model.name === name)?.status ?? "")) ? "Ready" : "Blocked" },
    { label: "Knowledge bases indexed", value: app.knowledgeBases.every((name) => knowledgeBases.find((kb) => kb.name === name)?.status === "Indexed") ? "Ready" : "Blocked" },
    { label: "Team assigned", value: app.team ? "Ready" : "Blocked" },
    { label: "Team access compatible", value: conflicts.length ? "Blocked" : "Ready" },
    { label: "Routing policy valid", value: policy?.status !== "Failed" && policy ? "Ready" : "Blocked" },
    { label: "SSO configured", value: "Ready" },
    { label: "URL available", value: app.slug ? "Ready" : "Blocked" }
  ];
  const canPublish = readiness.every((item) => item.value === "Ready");

  function handleDisable() {
    const confirmed = window.confirm(`Disable ${workspaceName}? Employees will immediately lose access to this workspace.`);
    if (confirmed) disableApplication(workspaceId);
  }

  function handlePublish() {
    if (!canPublish) {
      simulateAction("Workspace publish blocked by readiness review", workspaceName, "Workspace");
      return;
    }
    publishApplication(workspaceId);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="AI Workspace" title={app.name} description={`${app.team} employee AI workspace with governed models, knowledge and agents.`} action={<ButtonLink href="/dashboard/applications" secondary>Back to workspaces</ButtonLink>} />
      <section className="application-hero" style={{ marginBottom: 18 }}>
        <div className="row"><div><p className="eyebrow" style={{ color: "var(--brand-accent)" }}>Employee launch URL</p><h2 style={{ margin: 0 }}>{app.url.replace("https://", "")}</h2><p>Employees access this governed workspace at its subdomain. Switchboard AI configures policy and boundaries.</p></div><div className="row"><button className="button secondary" onClick={() => { navigator.clipboard?.writeText(app.url); simulateAction("Copied employee workspace link", app.name, "Workspace"); }}>Copy employee link</button><ButtonLink href={`/dashboard/applications/${app.id}/preview`}>Open chat preview</ButtonLink></div></div>
      </section>
      <div className="grid kpis"><Card pad><span className="metric-label">Status</span><div className="metric-value"><StatusBadge value={app.status} /></div><p className="muted">{app.lastDeployed}</p></Card><Card pad><span className="metric-label">Target server</span><div className="metric-value" style={{ fontSize: 18 }}>{target?.name ?? "Unassigned"}</div><p className="muted">{target?.agent ?? "No agent"}</p></Card><Card pad><span className="metric-label">Monthly requests</span><div className="metric-value">{formatNumber(app.monthlyRequests)}</div><p className="muted">{app.activeUsers} active users</p></Card><Card pad><span className="metric-label">Spend</span><div className="metric-value">{aed(app.spendUsedAed)}</div><Progress value={percent(app.spendUsedAed, app.spendBudgetAed)} /></Card></div>
      <div className="tabs" style={{ marginTop: 18 }}>{tabs.map((tab) => <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
      {activeTab === "Configuration" ? <Card pad style={{ marginTop: 18 }}><h3>Configuration</h3><div className="grid three"><Detail label="Chat interface type" value="Managed workspace chat" /><Detail label="Subdomain slug" value={app.slug} /><Detail label="External model rule" value={app.externalModelRule} /><Detail label="Allowed models" value={app.allowedModels.join(", ")} /><Detail label="Knowledge bases" value={app.knowledgeBases.join(", ")} /><Detail label="Governed agents" value={app.agents.join(", ") || "None assigned"} /><Detail label="Routing and safeguards" value={`${app.routingPolicy}; ${policy?.outcome ?? "policy outcome tracked"}`} /></div>{team ? <div className="callout" style={{ marginTop: 16 }}>{conflicts.length ? conflicts.map((conflict) => <p key={conflict}>{conflict}</p>) : <p>Team access is compatible with this workspace.</p>}<button className="button secondary" type="button" onClick={() => openAccessManager({ teamId: team.id, tab: "models" })}>Manage team access</button></div> : null}</Card> : null}
      {activeTab === "Deployment" ? <Card pad style={{ marginTop: 18 }}><h3>Deployment</h3><p className="muted">Publishing validates server, stack, model, knowledge, team access, routing, SSO and URL readiness.</p><div className="grid three"><Detail label="Deployment status" value={app.status} /><Detail label="Target server" value={target?.name ?? "Unassigned"} /><Detail label="Last deployed" value={app.lastDeployed} /></div><h3 style={{ marginTop: 18 }}>Readiness review</h3><div className="control-list">{readiness.map((item) => <div className="control-row" key={item.label}><div><strong>{item.label}</strong><small>{item.value === "Ready" ? "Dependency is satisfied" : item.label.includes("access") && team ? "Open Manage team access to fix grants." : "Resolve this before publishing."}</small></div><StatusBadge value={item.value} /></div>)}</div><div className="row" style={{ justifyContent: "flex-start", marginTop: 16 }}><button className="button" onClick={app.status === "Live" ? () => redeployApplication(app.id) : handlePublish}>{app.status === "Live" ? "Redeploy" : "Publish workspace"}</button><button className="button secondary" onClick={handleDisable}>Disable workspace</button>{team ? <button className="button secondary" type="button" onClick={() => openAccessManager({ teamId: team.id, tab: "models" })}>Manage access</button> : null}</div></Card> : null}
      {activeTab === "Usage" ? <Card pad style={{ marginTop: 18 }}><h3>Usage</h3><div className="grid three"><Detail label="Active users" value={String(app.activeUsers)} /><Detail label="Tokens used" value={`${formatNumber(app.tokensUsed)} / ${formatNumber(app.tokenBudget)}`} /><Detail label="Average latency" value={`${app.avgLatencyMs} ms`} /></div></Card> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
