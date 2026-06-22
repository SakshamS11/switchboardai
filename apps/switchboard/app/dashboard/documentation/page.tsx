"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card, PageHeader } from "@/components/ui";

const articles = [
  {
    slug: "product-overview",
    title: "Product overview",
    workflow: "Observe, configure, govern, monitor, optimise",
    content: "Switchboard AI is the control plane for where enterprise AI runs, who can use it, what knowledge it can retrieve, what it costs, and how administrative actions are audited."
  },
  {
    slug: "ai-estate-health",
    title: "AI estate health",
    workflow: "Observe current health and open the affected module",
    content: "Use the Overview to understand infrastructure health, provider status, workspace availability, cost pressure, and the next operational action."
  },
  {
    slug: "servers",
    title: "Servers",
    workflow: "Register infrastructure, connect an agent, deploy a stack",
    content: "Servers represent customer-owned infrastructure. A connected agent reports health, services, GPU/VRAM status, and deployment readiness."
  },
  {
    slug: "stacks",
    title: "Stacks",
    workflow: "Select an approved stack and deploy it to an online server",
    content: "Stacks install approved AI runtime capabilities such as model serving, gateway services, retrieval infrastructure, and governed employee chat hosting."
  },
  {
    slug: "models-providers",
    title: "Models & Providers",
    workflow: "Register local or external models, then test connection",
    content: "Models become selectable only after they are registered and connected. Secret values stay server-side; the frontend shows metadata and secret references only."
  },
  {
    slug: "routing-policies",
    title: "Routing policies",
    workflow: "Define primary route, fallback, blocked models, and data boundary",
    content: "Routing policies decide whether requests stay local, use approved external providers, or fail closed when a policy does not allow a route."
  },
  {
    slug: "ai-workspaces",
    title: "AI Workspaces",
    workflow: "Create draft, review readiness, publish, then preview employee experience",
    content: "An AI Workspace is the governed employee-facing AI experience. It combines teams, models, knowledge, agents, routing, budgets, and deployment status."
  },
  {
    slug: "knowledge-bases",
    title: "Knowledge bases",
    workflow: "Connect source, sync, index, then assign access",
    content: "Knowledge sources can be uploads, SharePoint, Google Drive, or S3. Users retrieve only from sources assigned to their team, workspace, or governed agent."
  },
  {
    slug: "governed-agents",
    title: "Governed agents",
    workflow: "Assign owner, tools, models, knowledge, budget, and approval rules",
    content: "Governed agents are controlled AI workers. High-risk actions need human approval and the kill switch blocks new runs when armed."
  },
  {
    slug: "teams",
    title: "Teams",
    workflow: "Invite users and manage effective access",
    content: "Teams inherit workspace, model, knowledge, agent, budget, token, and routing access. Effective access summaries show what employees can actually use."
  },
  {
    slug: "audit-logs",
    title: "Audit logs",
    workflow: "Search, inspect, and export administrative events",
    content: "Audit Logs show simulated append-only control-plane events. Production immutability requires backend persistence and access controls."
  },
  {
    slug: "compliance-readiness",
    title: "Compliance readiness",
    workflow: "Track evidence, risks, human oversight, and gaps",
    content: "Readiness support does not constitute or imply certification. Certification requires an accredited third-party assessment."
  },
  {
    slug: "resource-planner",
    title: "Resource planner",
    workflow: "Compare current and proposed capacity plans",
    content: "Resource Planner simulates cost, latency, GPU pressure, provider share, and governance impact before applying a plan."
  },
  {
    slug: "cost-capacity",
    title: "Cost & Capacity",
    workflow: "Review forecast, identify drivers, then tune policies or capacity",
    content: "Cost & Capacity shows spend forecast, team/model drivers, budget risk, GPU allocation, and savings opportunities."
  },
  {
    slug: "settings",
    title: "Settings",
    workflow: "Configure organisation, thresholds, integrations, and retention",
    content: "Settings affect the simulation, including organisation display, alert thresholds, residency labels, integration availability, and audit retention."
  }
];

const manualUrl = "/docs/Switchboard_AI_User_Manual_Final_5585.docx";

export default function DocumentationPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("product-overview");
  const [from, setFrom] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const topic = params.get("topic");
    const origin = params.get("from");
    if (origin?.startsWith("/dashboard")) setFrom(origin);
    if (topic && articles.some((article) => article.slug === topic)) setSelectedSlug(topic);
  }, []);

  const visibleArticles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return articles.filter((article) => !needle || `${article.title} ${article.content} ${article.workflow}`.toLowerCase().includes(needle));
  }, [query]);

  const selected = articles.find((article) => article.slug === selectedSlug) ?? articles[0];
  const selectedIndex = articles.findIndex((article) => article.slug === selected.slug);
  const previous = articles[selectedIndex - 1] ?? articles[articles.length - 1];
  const next = articles[selectedIndex + 1] ?? articles[0];

  return (
    <div className="page">
      <PageHeader
        eyebrow="System"
        title="Documentation"
        description="Manual-grounded guidance for Switchboard AI administrators and workspace owners."
        action={<a className="button" href={manualUrl} download>Download complete manual</a>}
      />
      <div className="doc-breadcrumb">
        <button className="button secondary" type="button" onClick={() => router.back()}>Back</button>
        <Link className="button secondary" href={from}>Back to originating page</Link>
        <Link className="button secondary" href="/dashboard">Back to Overview</Link>
      </div>
      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card pad>
          <label className="field-group"><span className="metric-label">Search documentation</span><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics and guidance..." /></label>
          <div className="selector-list" style={{ marginTop: 14 }}>
            {visibleArticles.length ? visibleArticles.map((article) => <button key={article.slug} type="button" className={`selector-item ${selected.slug === article.slug ? "active" : ""}`} onClick={() => setSelectedSlug(article.slug)}>{article.title}<br /><small>{article.workflow}</small></button>) : <div className="empty-state">No documentation topics match this search.</div>}
          </div>
        </Card>
        <Card pad>
          <p className="eyebrow">Manual version: Final 5585</p>
          <h3>{selected.title}</h3>
          <p className="muted">{selected.content}</p>
          <div className="callout" style={{ marginTop: 16 }}>Switchboard AI stores operational, usage, health, cost and policy metadata. It does not receive conversation content.</div>
          <div className="doc-nav">
            <button className="button secondary" type="button" onClick={() => setSelectedSlug(previous.slug)}>Previous: {previous.title}</button>
            <button className="button secondary" type="button" onClick={() => setSelectedSlug(next.slug)}>Next: {next.title}</button>
          </div>
          <Card pad className="status-card" style={{ marginTop: 16 }}>
            <span className="metric-label">Related workflow</span>
            <p><strong>{selected.workflow}</strong></p>
          </Card>
        </Card>
      </div>
    </div>
  );
}
