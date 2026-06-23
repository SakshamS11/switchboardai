"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildConflicts } from "@/components/access-manager";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { aed, percent, slugify } from "@/lib/utils";

export default function ApplicationsPage() {
  const { applications, createApplication, teams, servers, modelCatalog, knowledgeBases, governedAgents, routingPolicies, accessState, openAccessManager } = useAppState();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("Finance AI Desk");
  const [purpose, setPurpose] = useState("Finance policy Q&A, variance explanation, and governed analysis.");
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "legal");
  const [subdomain, setSubdomain] = useState("finance");
  const [targetServerId, setTargetServerId] = useState(servers.find((target) => target.agent === "Online")?.id ?? "");
  const [externalModelRule, setExternalModelRule] = useState<"Allowed" | "Restricted" | "Blocked">("Restricted");
  const [tokenBudget, setTokenBudget] = useState(4000000);
  const [spendBudgetAed, setSpendBudgetAed] = useState(18000);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedKnowledge, setSelectedKnowledge] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [lastCreated, setLastCreated] = useState<string | null>(null);
  const selectedTeam = teams.find((team) => team.id === teamId) ?? teams[0]!;
  const generatedSlug = useMemo(() => slugify(name).replace(/-assistant|-desk|-ai/g, "") || "finance", [name]);
  const onlineTargets = servers.filter((target) => target.agent === "Online");
  const activeModels = modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected");
  const indexedKnowledge = knowledgeBases.filter((kb) => kb.status === "Indexed");
  const activeAgents = governedAgents.filter((agent) => agent.status === "Active" && agent.killSwitch !== "Armed");
  const teamModelIds = accessState.modelGrants[teamId] ?? [];
  const teamKnowledgeIds = accessState.knowledgeGrants[teamId] ?? [];
  const teamAgentIds = accessState.agentGrants[teamId] ?? [];
  const accessConflicts = [
    ...selectedModels.filter((id) => !teamModelIds.includes(id)).map((id) => `${modelCatalog.find((model) => model.id === id)?.name} is not granted to ${selectedTeam.name}.`),
    ...selectedKnowledge.filter((id) => !teamKnowledgeIds.includes(id)).map((id) => `${knowledgeBases.find((kb) => kb.id === id)?.name} is not granted to ${selectedTeam.name}.`),
    ...selectedAgents.filter((id) => !teamAgentIds.includes(id)).map((id) => `${governedAgents.find((agent) => agent.id === id)?.name} is not granted to ${selectedTeam.name}.`)
  ].filter(Boolean);

  useEffect(() => setSubdomain(generatedSlug), [generatedSlug]);
  useEffect(() => {
    setSelectedModels((accessState.modelGrants[teamId] ?? []).filter((id) => activeModels.some((model) => model.id === id)).slice(0, 2));
    setSelectedKnowledge((accessState.knowledgeGrants[teamId] ?? []).filter((id) => indexedKnowledge.some((kb) => kb.id === id)).slice(0, 2));
    setSelectedAgents((accessState.agentGrants[teamId] ?? []).filter((id) => activeAgents.some((agent) => agent.id === id)).slice(0, 1));
  }, [teamId]);

  function toggleValue(value: string, values: string[], setter: (next: string[]) => void) {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  }

  function handleCreateApplication() {
    if (accessConflicts.length) return;
    const app = createApplication({
      name,
      team: selectedTeam.name,
      purpose,
      slug: subdomain || generatedSlug,
      targetServerId,
      allowedModels: selectedModels.map((id) => modelCatalog.find((model) => model.id === id)?.name).filter(Boolean) as string[],
      knowledgeBases: selectedKnowledge.map((id) => knowledgeBases.find((kb) => kb.id === id)?.name).filter(Boolean) as string[],
      agents: selectedAgents.map((id) => governedAgents.find((agent) => agent.id === id)?.name).filter(Boolean) as string[],
      routingPolicy: routingPolicies[0]?.name ?? "Default Router",
      tokenBudget,
      spendBudgetAed,
      externalModelRule
    });
    setLastCreated(`${app.name} draft created. Publish after readiness review.`);
    setCreateOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="AI Management" title="AI Workspaces" description="Configure governed employee workspaces that connect teams, models, knowledge, agents, routing and budgets." action={<button className="button" type="button" onClick={() => setCreateOpen(true)}>Create workspace</button>} />
      <div className="grid kpis">
        <Card pad><span className="metric-label">Workspaces</span><div className="metric-value">{applications.length}</div><p className="muted">Configured employee AI experiences</p></Card>
        <Card pad><span className="metric-label">Live URLs</span><div className="metric-value">{applications.filter((app) => app.status === "Live").length}</div><p className="muted">Active workspace subdomains</p></Card>
        <Card pad><span className="metric-label">Access conflicts</span><div className="metric-value">{applications.reduce((sum, app) => {
          const team = teams.find((item) => item.name === app.team);
          return sum + (team ? buildConflicts(team.id, accessState, [app], modelCatalog, knowledgeBases, governedAgents).length : 0);
        }, 0)}</div><p className="muted">Publish blockers</p></Card>
        <Card pad><span className="metric-label">Workspace spend</span><div className="metric-value">{aed(applications.reduce((sum, app) => sum + app.spendUsedAed, 0))}</div><p className="muted">Current period metadata only</p></Card>
      </div>

      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Workspace registry</h3><p className="muted">The subdomain URL is the employee launch link after publication.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Workspace</th><th>Team</th><th>Subdomain URL</th><th>Status</th><th>Models</th><th>Budget</th><th>Action</th></tr></thead><tbody>{applications.map((app) => <tr key={app.id}><td><strong>{app.name}</strong><br /><span className="muted">{app.purpose}</span></td><td>{app.team}</td><td>{app.status === "Live" ? <Link className="muted" href={`/dashboard/applications/${app.id}/preview`}>{app.url.replace("https://", "")}</Link> : <span className="muted">{app.url.replace("https://", "")} not live</span>}</td><td><StatusBadge value={app.status} /></td><td>{app.allowedModels.length}</td><td><Progress value={percent(app.tokensUsed, app.tokenBudget)} /></td><td><Link className="button secondary" href={`/dashboard/applications/${app.id}`}>Manage</Link></td></tr>)}</tbody></table></div>
      </Card>
      {lastCreated ? <Card pad style={{ marginTop: 18 }}><div className="row"><div><h3>Workspace draft ready</h3><p className="muted">{lastCreated}</p></div><ButtonLink href="/dashboard/operations" secondary>View monitoring</ButtonLink></div></Card> : null}

      {createOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-application-title">
            <div className="modal-header"><div><p className="eyebrow">New AI Workspace</p><h3 id="create-application-title">Configure governed employee workspace</h3><p className="muted">Resources must be granted to the selected team before publication.</p></div><button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="field-group"><span className="metric-label">Workspace name</span><input className="field" value={name} onChange={(event) => setName(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Team</span><select className="field" value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teams.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
                <label className="field-group wide"><span className="metric-label">Purpose</span><input className="field" value={purpose} onChange={(event) => setPurpose(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Subdomain</span><input className="field" value={subdomain} onChange={(event) => setSubdomain(slugify(event.target.value))} /></label>
                <label className="field-group"><span className="metric-label">Target server</span><select className="field" value={targetServerId} onChange={(event) => setTargetServerId(event.target.value)}>{onlineTargets.map((target) => <option value={target.id} key={target.id}>{target.name}</option>)}</select></label>
                <Field label="Employee URL preview" value={`chat.${subdomain || generatedSlug}.acme.ai`} />
                <Field label="Chat interface type" value="Managed workspace chat" />
                <label className="field-group"><span className="metric-label">Monthly token budget</span><input className="field" type="number" value={tokenBudget} onChange={(event) => setTokenBudget(Number(event.target.value))} /></label>
                <label className="field-group"><span className="metric-label">Monthly spend budget AED</span><input className="field" type="number" value={spendBudgetAed} onChange={(event) => setSpendBudgetAed(Number(event.target.value))} /></label>
                <label className="field-group"><span className="metric-label">External model rule</span><select className="field" value={externalModelRule} onChange={(event) => setExternalModelRule(event.target.value as "Allowed" | "Restricted" | "Blocked")}><option>Restricted</option><option>Allowed</option><option>Blocked</option></select></label>
                <Field label="Routing policy" value={routingPolicies[0]?.name ?? "Default Router"} />
              </div>
              <Picker title="Allowed models" items={activeModels} values={selectedModels} grants={teamModelIds} onToggle={(item) => toggleValue(item, selectedModels, setSelectedModels)} />
              <Picker title="Knowledge bases" items={indexedKnowledge} values={selectedKnowledge} grants={teamKnowledgeIds} onToggle={(item) => toggleValue(item, selectedKnowledge, setSelectedKnowledge)} />
              <Picker title="Governed agents" items={activeAgents} values={selectedAgents} grants={teamAgentIds} onToggle={(item) => toggleValue(item, selectedAgents, setSelectedAgents)} />
              {accessConflicts.length ? <div className="callout">{accessConflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}<button className="button secondary" type="button" onClick={() => openAccessManager({ teamId, tab: "models" })}>Manage team access</button></div> : <div className="callout">Ready to save as Draft. Publish runs readiness checks before deployment.</div>}
            </div>
            <div className="modal-footer"><button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button" type="button" disabled={Boolean(accessConflicts.length)} onClick={handleCreateApplication}>Create Draft workspace</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}

function Picker({ title, items, values, grants, onToggle }: { title: string; items: { id: string; name: string }[]; values: string[]; grants: string[]; onToggle: (item: string) => void }) {
  return <div className="picker"><span className="metric-label">{title}</span><div className="chip-grid">{items.map((item) => {
    const granted = grants.includes(item.id);
    return <button key={item.id} type="button" disabled={!granted} className={`chip ${values.includes(item.id) ? "selected" : ""}`} onClick={() => onToggle(item.id)}>{item.name}{!granted ? " - not granted" : ""}</button>;
  })}</div></div>;
}
