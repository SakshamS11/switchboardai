"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { aed } from "@/lib/utils";

const tabs = ["Overview", "Permissions", "Runs", "Approvals", "Usage"] as const;

export default function AgentsPage() {
  const { governedAgents, modelCatalog, knowledgeBases, teams, accessState, agentApprovals, openAccessManager, updateAgent, createAgent, decideAgentApproval } = useAppState();
  const [selectedId, setSelectedId] = useState(governedAgents[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [createOpen, setCreateOpen] = useState(false);
  const selected = governedAgents.find((row) => row.id === selectedId) ?? governedAgents[0];
  const invokingTeams = selected ? teams.filter((team) => (accessState.agentGrants[team.id] ?? []).includes(selected.id)) : [];
  const approvals = selected ? agentApprovals.filter((approval) => approval.agentId === selected.id) : [];
  const activeModels = modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected");
  const indexedKnowledge = knowledgeBases.filter((kb) => kb.status === "Indexed");

  function toggleList(field: "allowedModels" | "knowledgeBases" | "tools", value: string) {
    if (!selected) return;
    const list = selected[field];
    updateAgent(selected.id, { [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] }, "Updated agent permission boundary");
  }

  function toggleKillSwitch() {
    if (!selected) return;
    const next = selected.killSwitch === "Armed" ? "Not armed" : "Armed";
    if (next === "Armed" && !window.confirm(`Arm kill switch for ${selected.name}? Existing active runs stop and new runs are blocked.`)) return;
    updateAgent(selected.id, { killSwitch: next, status: next === "Armed" ? "Paused" : "Active" }, next === "Armed" ? "Armed agent kill switch" : "Disarmed agent kill switch");
  }

  function submitCreate(form: FormData) {
    const agent = createAgent({ name: String(form.get("name") || "New Agent"), owner: String(form.get("owner") || "AI Ops"), approvalRule: String(form.get("approval") || "Approval required before external action"), budgetAed: Number(form.get("budget") || 9000) });
    setSelectedId(agent.id);
    setCreateOpen(false);
  }

  const runs = useMemo(() => [
    { id: "run-1", task: "Retrieve approved knowledge", state: selected?.killSwitch === "Armed" ? "Blocked" : "Completed", model: selected?.allowedModels[0] ?? "n/a" },
    { id: "run-2", task: "Prepare action payload", state: approvals.some((item) => item.status === "Pending") ? "Waiting approval" : "Completed", model: selected?.allowedModels[0] ?? "n/a" }
  ], [approvals, selected]);

  return (
    <div className="page">
      <PageHeader eyebrow="Build" title="Governed Agents" description="Manage AI workers with fixed model, knowledge, tool, approval, budget and kill-switch boundaries." action={<button className="button" type="button" onClick={() => setCreateOpen(true)}>Create agent</button>} />
      <div className="grid kpis">
        <MetricCard label="Agents" value={String(governedAgents.length)} detail="Configured workers" status="Healthy" />
        <MetricCard label="Active" value={String(governedAgents.filter((row) => row.status === "Active").length)} detail="Can accept runs" status="Healthy" />
        <MetricCard label="Pending approvals" value={String(agentApprovals.filter((row) => row.status === "Pending").length)} detail="Inside agent workflow" status="Pending" />
        <MetricCard label="Kill switches armed" value={String(governedAgents.filter((row) => row.killSwitch === "Armed").length)} detail="New runs blocked" status={governedAgents.some((row) => row.killSwitch === "Armed") ? "Critical" : "Healthy"} />
      </div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card pad><h3>Agent registry</h3><div className="selector-list">{governedAgents.map((agent) => <button className={`selector-item ${agent.id === selected?.id ? "active" : ""}`} type="button" key={agent.id} onClick={() => setSelectedId(agent.id)}>{agent.name}<br /><small>{agent.owner}</small></button>)}</div></Card>
        {selected ? <Card pad><div className="row"><div><h3>{selected.name}</h3><p className="muted">Owner: {selected.owner} - budget {aed(selected.budgetAed)}</p></div><StatusBadge value={selected.killSwitch === "Armed" ? "Critical" : selected.status} /></div><div className="tabs">{tabs.map((tab) => <button className={`tab ${activeTab === tab ? "active" : ""}`} type="button" key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>
          {activeTab === "Overview" ? <div className="grid three" style={{ marginTop: 16 }}><Detail label="Teams that may invoke" value={invokingTeams.map((team) => team.name).join(", ") || "None"} /><Detail label="Human approval rule" value={selected.approvalRule} /><Detail label="External model rule" value={selected.externalModelRule} /><Detail label="Kill switch" value={selected.killSwitch === "Armed" ? "Kill switch armed" : "Kill switch not armed"} /><Detail label="Monthly token limit" value={String(selected.monthlyTokenLimit ?? "Not set")} /><Detail label="Monthly spend limit" value={aed(selected.monthlySpendLimitAed ?? selected.budgetAed)} /></div> : null}
          {activeTab === "Permissions" ? <div style={{ marginTop: 16 }}><h3>Agent resource boundary</h3><p className="muted">These are resources the agent itself can use. Team invocation access is managed separately.</p><div className="control-list">{activeModels.map((model) => <AccessRow key={model.id} label={model.name} detail={model.sensitivityFit} active={selected.allowedModels.includes(model.name)} onToggle={() => toggleList("allowedModels", model.name)} />)}{indexedKnowledge.map((kb) => <AccessRow key={kb.id} label={kb.name} detail={kb.sensitivity} active={selected.knowledgeBases.includes(kb.name)} onToggle={() => toggleList("knowledgeBases", kb.name)} />)}{["retrieval_search", "redline_summary", "clause_compare", "claim_summary_generator", "repo_reader"].map((tool) => <AccessRow key={tool} label={tool} detail="Tool/MCP permission" active={selected.tools.includes(tool)} onToggle={() => toggleList("tools", tool)} />)}</div><button className="button secondary" type="button" onClick={() => openAccessManager({ tab: "agents", filterResourceId: selected.id })}>Manage team invocation access</button></div> : null}
          {activeTab === "Runs" ? <div className="table-wrap" style={{ marginTop: 16 }}><table><thead><tr><th>Run</th><th>Task</th><th>Model</th><th>State</th></tr></thead><tbody>{runs.map((run) => <tr key={run.id}><td>{run.id}</td><td>{run.task}</td><td>{run.model}</td><td><StatusBadge value={run.state} /></td></tr>)}</tbody></table></div> : null}
          {activeTab === "Approvals" ? <div className="control-list" style={{ marginTop: 16 }}>{approvals.map((approval) => <div className="control-row" key={approval.id}><div><strong>{approval.requestedAction}</strong><small>{approval.payloadSummary} · expires in {approval.expiresIn}</small></div><StatusBadge value={approval.status} />{approval.status === "Pending" ? <div className="row"><button className="button secondary" type="button" onClick={() => decideAgentApproval(approval.id, "Rejected")}>Reject</button><button className="button" type="button" onClick={() => decideAgentApproval(approval.id, "Approved")}>Approve</button></div> : null}</div>)}</div> : null}
          {activeTab === "Usage" ? <div className="grid three" style={{ marginTop: 16 }}><Detail label="Spend used" value={aed(Math.round(selected.budgetAed * 0.42))} /><Detail label="Budget" value={aed(selected.budgetAed)} /><Detail label="Status" value={selected.killSwitch === "Armed" ? "Runs blocked" : "Within limits"} /></div> : null}
          <div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}><button className="button secondary" type="button" onClick={toggleKillSwitch}>{selected.killSwitch === "Armed" ? "Disarm kill switch" : "Arm kill switch"}</button></div>
        </Card> : null}
      </div>

      {createOpen ? <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(event) => { event.preventDefault(); submitCreate(new FormData(event.currentTarget)); }}><div className="modal-header"><div><p className="eyebrow">Governed Agent</p><h3>Create agent</h3><p className="muted">Create the identity first, then configure permissions and team invocation access.</p></div><button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Agent name</span><input className="field" name="name" defaultValue="Finance Analysis Agent" /></label><label className="field-group"><span className="metric-label">Owner</span><input className="field" name="owner" defaultValue="Finance Ops" /></label><label className="field-group wide"><span className="metric-label">Approval rule</span><input className="field" name="approval" defaultValue="Approval required before external action" /></label><label className="field-group"><span className="metric-label">Monthly budget AED</span><input className="field" name="budget" type="number" defaultValue="9000" /></label></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button" type="submit">Create agent</button></div></form></div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}

function AccessRow({ label, detail, active, onToggle }: { label: string; detail: string; active: boolean; onToggle: () => void }) {
  return <div className="control-row"><div><strong>{label}</strong><small>{detail}</small></div><button className={`switch-button ${active ? "on" : ""}`} type="button" onClick={onToggle}>{active ? "Allowed" : "Blocked"}</button></div>;
}
