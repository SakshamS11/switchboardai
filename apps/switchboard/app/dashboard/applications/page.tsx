"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { agents, infrastructureTargets, knowledgeBases, modelCatalog, routingPolicies, teams } from "@/lib/mock-data";
import { aed, percent, slugify } from "@/lib/utils";

export default function ApplicationsPage() {
  const { applications, createApplication } = useAppState();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("Finance AI Desk");
  const [purpose, setPurpose] = useState("Finance policy Q&A, variance explanation, and governed analysis.");
  const [team, setTeam] = useState("Finance");
  const [subdomain, setSubdomain] = useState("finance");
  const [targetServerId, setTargetServerId] = useState("acme-azure");
  const [externalModelRule, setExternalModelRule] = useState<"Allowed" | "Restricted" | "Blocked">("Restricted");
  const [tokenBudget, setTokenBudget] = useState(4000000);
  const [spendBudgetAed, setSpendBudgetAed] = useState(18000);
  const [selectedModels, setSelectedModels] = useState(["Falcon 40B Local"]);
  const [selectedKnowledge, setSelectedKnowledge] = useState(["Product FAQ"]);
  const [selectedAgents, setSelectedAgents] = useState(["Support Triage Agent"]);
  const [lastCreated, setLastCreated] = useState<string | null>(null);
  const generatedSlug = useMemo(() => slugify(name).replace(/-assistant|-desk|-ai/g, "") || "finance", [name]);
  const onlineTargets = infrastructureTargets.filter((target) => target.agent === "Online");
  const activeModels = modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected");

  useEffect(() => {
    setSubdomain(generatedSlug);
  }, [generatedSlug]);

  function toggleValue(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function handleCreateApplication() {
    const app = createApplication({
      name,
      team,
      purpose,
      slug: subdomain || generatedSlug,
      targetServerId,
      allowedModels: selectedModels.length ? selectedModels : [activeModels[0]?.name ?? "Falcon 40B Local"],
      knowledgeBases: selectedKnowledge,
      agents: selectedAgents,
      routingPolicy: routingPolicies[0].name,
      tokenBudget,
      spendBudgetAed,
      externalModelRule
    });
    setLastCreated(`${app.name} draft created. Publish when configuration, access and routing are ready.`);
    setCreateOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="AI Management" title="AI Workspaces" description="Create governed employee AI workspaces with model, knowledge, agent, budget and routing controls." action={<button className="button" type="button" onClick={() => setCreateOpen(true)}>Create workspace</button>} />
      <div className="grid kpis">
        <Card pad><span className="metric-label">Workspaces</span><div className="metric-value">{applications.length}</div><p className="muted">Configured employee AI experiences</p></Card>
        <Card pad><span className="metric-label">Live URLs</span><div className="metric-value">{applications.filter((app) => app.status === "Live").length}</div><p className="muted">Active workspace subdomains</p></Card>
        <Card pad><span className="metric-label">Local-only workspaces</span><div className="metric-value">{applications.filter((app) => app.externalModelRule === "Blocked").length}</div><p className="muted">No external model route</p></Card>
        <Card pad><span className="metric-label">Workspace spend</span><div className="metric-value">{aed(applications.reduce((sum, app) => sum + app.spendUsedAed, 0))}</div><p className="muted">Current period usage metadata</p></Card>
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Workspace registry</h3><p className="muted">The subdomain URL is the employee launch link after publication.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Workspace</th><th>Team</th><th>Chat URL</th><th>Status</th><th>Models</th><th>Budget</th><th>Action</th></tr></thead><tbody>{applications.map((app) => <tr key={app.id}><td><strong>{app.name}</strong><br /><span className="muted">{app.purpose}</span></td><td>{app.team}</td><td>{app.status === "Live" ? <Link className="muted" href={`/dashboard/applications/${app.id}/preview`}>{app.url.replace("https://", "")}</Link> : <span className="muted">{app.url.replace("https://", "")} not live</span>}</td><td><StatusBadge value={app.status} /></td><td>{app.allowedModels.length}</td><td><Progress value={percent(app.tokensUsed, app.tokenBudget)} /></td><td><Link className="button secondary" href={`/dashboard/applications/${app.id}`}>Manage</Link></td></tr>)}</tbody></table></div>
      </Card>
      {lastCreated ? <Card pad style={{ marginTop: 18 }}><div className="row"><div><h3>Workspace draft ready</h3><p className="muted">{lastCreated}</p></div><ButtonLink href="/dashboard/operations" secondary>View monitoring</ButtonLink></div></Card> : null}
      {createOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-application-title">
            <div className="modal-header">
              <div>
                <p className="eyebrow">New AI Workspace</p>
                <h3 id="create-application-title">Configure governed employee chat</h3>
                <p className="muted">Switchboard AI configures the governed employee workspace, chat route, access, and policy boundaries.</p>
              </div>
              <button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="field-group"><span className="metric-label">Workspace name</span><input className="field" value={name} onChange={(event) => setName(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Team</span><select className="field" value={team} onChange={(event) => setTeam(event.target.value)}>{teams.map((item) => <option key={item.id}>{item.name}</option>)}<option>Finance</option><option>Marketing</option></select></label>
                <label className="field-group wide"><span className="metric-label">Purpose</span><input className="field" value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Subdomain</span><input className="field" value={subdomain} onChange={(event) => setSubdomain(slugify(event.target.value))} /></label>
                <label className="field-group"><span className="metric-label">Target server</span><select className="field" value={targetServerId} onChange={(event) => setTargetServerId(event.target.value)}>{onlineTargets.map((target) => <option value={target.id} key={target.id}>{target.name}</option>)}</select></label>
                <Field label="Employee URL preview" value={`chat.${subdomain || generatedSlug}.acme.ai`} />
                <Field label="Chat interface type" value="Managed workspace chat runtime" />
                <label className="field-group"><span className="metric-label">Monthly token budget</span><input className="field" type="number" value={tokenBudget} onChange={(event) => setTokenBudget(Number(event.target.value))} /></label>
                <label className="field-group"><span className="metric-label">Monthly spend budget AED</span><input className="field" type="number" value={spendBudgetAed} onChange={(event) => setSpendBudgetAed(Number(event.target.value))} /></label>
                <label className="field-group"><span className="metric-label">External model rule</span><select className="field" value={externalModelRule} onChange={(event) => setExternalModelRule(event.target.value as "Allowed" | "Restricted" | "Blocked")}><option>Restricted</option><option>Allowed</option><option>Blocked</option></select></label>
                <Field label="Routing policy" value={routingPolicies[0].name} />
              </div>
              <Picker title="Allowed models" items={activeModels.map((model) => model.name)} values={selectedModels} onToggle={(item) => toggleValue(item, selectedModels, setSelectedModels)} />
              <Picker title="Knowledge bases" items={knowledgeBases.map((kb) => kb.name)} values={selectedKnowledge} onToggle={(item) => toggleValue(item, selectedKnowledge, setSelectedKnowledge)} />
              <Picker title="Governed agents" items={agents.map((agent) => agent.name)} values={selectedAgents} onToggle={(item) => toggleValue(item, selectedAgents, setSelectedAgents)} />
              <div className="callout">Saving creates a Draft. Publish the workspace when the team, model, knowledge and routing boundaries are correct.</div>
            </div>
            <div className="modal-footer">
              <button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="button" type="button" onClick={handleCreateApplication}>Create Draft workspace</button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}

function Picker({ title, items, values, onToggle }: { title: string; items: string[]; values: string[]; onToggle: (item: string) => void }) {
  return (
    <div className="picker">
      <span className="metric-label">{title}</span>
      <div className="chip-grid">
        {items.map((item) => <button key={item} type="button" className={`chip ${values.includes(item) ? "selected" : ""}`} onClick={() => onToggle(item)}>{item}</button>)}
      </div>
    </div>
  );
}
