"use client";

import { useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { agents as seedAgents, knowledgeBases, modelCatalog, teams } from "@/lib/mock-data";
import { aed, slugify } from "@/lib/utils";

type AgentRow = {
  id: string;
  name: string;
  owner: string;
  allowedModels: string[];
  knowledgeBases: string[];
  tools: string[];
  approvalRule: string;
  externalModelRule: "Allowed" | "Restricted" | "Blocked";
  budgetAed: number;
  status: string;
  killSwitch: "Armed" | "Ready";
};

export default function AgentsPage() {
  const { simulateAction } = useAppState();
  const [rows, setRows] = useState<AgentRow[]>(seedAgents);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [agentName, setAgentName] = useState("Finance Analysis Agent");
  const [owner, setOwner] = useState("Finance Ops");
  const [approvalRule, setApprovalRule] = useState("Approval required before external action");
  const [budgetAed, setBudgetAed] = useState(9000);
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const activeModels = modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected");

  function toggleList(field: "allowedModels" | "knowledgeBases" | "tools", value: string) {
    setRows((current) => current.map((row) => {
      if (row.id !== selected.id) return row;
      const list = row[field];
      return { ...row, [field]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    }));
  }

  function setKillSwitch(next: "Armed" | "Ready") {
    setRows((current) => current.map((row) => row.id === selected.id ? { ...row, killSwitch: next } : row));
    simulateAction(next === "Armed" ? "Armed agent kill switch" : "Released agent kill switch", selected.name, "Agent");
  }

  function createAgent() {
    const row: AgentRow = {
      id: slugify(agentName),
      name: agentName,
      owner,
      allowedModels: [activeModels[0]?.name ?? "Falcon 40B Local"],
      knowledgeBases: [knowledgeBases[0]?.name ?? "Legal Contracts"],
      tools: ["retrieval_search"],
      approvalRule,
      externalModelRule: "Restricted",
      budgetAed,
      status: "Healthy",
      killSwitch: "Ready"
    };
    setRows((current) => [row, ...current]);
    setSelectedId(row.id);
    setCreateOpen(false);
    simulateAction("Created governed agent", row.name, "Agent");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Build" title="Governed Agents" description="Create AI workers with fixed model, knowledge, tool, approval, budget, and kill-switch boundaries." action={<button className="button" type="button" onClick={() => setCreateOpen(true)}>Create agent</button>} />
      <div className="grid kpis">
        <MetricCard label="Agents" value={String(rows.length)} detail="Configured workers" status="Healthy" />
        <MetricCard label="Approval rules" value={String(rows.filter((row) => row.approvalRule.includes("Approval")).length)} detail="Human oversight" status="Healthy" />
        <MetricCard label="External blocked" value={String(rows.filter((row) => row.externalModelRule === "Blocked").length)} detail="Local-only workers" status="Healthy" />
        <MetricCard label="Kill switches" value={String(rows.filter((row) => row.killSwitch === "Ready").length)} detail="Ready controls" status="Healthy" />
      </div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card pad>
          <h3>Agents</h3>
          <p className="muted">Select an agent to manage its permissions and safety controls.</p>
          <div className="selector-list">
            {rows.map((agent) => <button className={`selector-item ${agent.id === selected?.id ? "active" : ""}`} type="button" key={agent.id} onClick={() => setSelectedId(agent.id)}>{agent.name}<br /><small>{agent.owner}</small></button>)}
          </div>
        </Card>
        {selected ? (
          <Card pad>
            <div className="row"><div><h3>{selected.name}</h3><p className="muted">Owner: {selected.owner} - budget {aed(selected.budgetAed)}</p></div><StatusBadge value={selected.status} /></div>
            <div className="compact-card-grid" style={{ marginTop: 14 }}>
              <Card pad><span className="metric-label">Approval</span><p><strong>{selected.approvalRule}</strong></p></Card>
              <Card pad><span className="metric-label">External model rule</span><div className="metric-value">{selected.externalModelRule}</div></Card>
              <Card pad><span className="metric-label">Kill switch</span><div className="metric-value">{selected.killSwitch}</div></Card>
            </div>
            <h3 style={{ marginTop: 18 }}>Allowed models</h3>
            <div className="control-list">{activeModels.map((model) => <AccessRow key={model.id} label={model.name} detail={model.sensitivityFit} active={selected.allowedModels.includes(model.name)} onToggle={() => toggleList("allowedModels", model.name)} />)}</div>
            <h3 style={{ marginTop: 18 }}>Knowledge boundaries</h3>
            <div className="control-list">{knowledgeBases.map((kb) => <AccessRow key={kb.id} label={kb.name} detail={kb.sensitivity} active={selected.knowledgeBases.includes(kb.name)} onToggle={() => toggleList("knowledgeBases", kb.name)} />)}</div>
            <h3 style={{ marginTop: 18 }}>Tools</h3>
            <div className="control-list">{["retrieval_search", "redline_summary", "clause_compare", "claim_summary_generator", "repo_reader"].map((tool) => <AccessRow key={tool} label={tool} detail="Tool permission" active={selected.tools.includes(tool)} onToggle={() => toggleList("tools", tool)} />)}</div>
            <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
              <button className="button secondary" type="button" onClick={() => setKillSwitch(selected.killSwitch === "Ready" ? "Armed" : "Ready")}>{selected.killSwitch === "Ready" ? "Arm kill switch" : "Release kill switch"}</button>
              <button className="button" type="button" onClick={() => simulateAction("Saved agent policy", selected.name, "Agent")}>Save agent policy</button>
            </div>
          </Card>
        ) : null}
      </div>

      {createOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-agent-title">
            <div className="modal-header"><div><p className="eyebrow">Governed Agent</p><h3 id="create-agent-title">Create agent</h3><p className="muted">Agents inherit models, knowledge, tool access, approval rules, and budget limits.</p></div><button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="field-group"><span className="metric-label">Agent name</span><input className="field" value={agentName} onChange={(event) => setAgentName(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Owner</span><select className="field" value={owner} onChange={(event) => setOwner(event.target.value)}>{teams.map((team) => <option key={team.id}>{team.owner}</option>)}<option>Finance Ops</option></select></label>
                <label className="field-group wide"><span className="metric-label">Approval rule</span><input className="field" value={approvalRule} onChange={(event) => setApprovalRule(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Monthly budget AED</span><input className="field" type="number" value={budgetAed} onChange={(event) => setBudgetAed(Number(event.target.value))} /></label>
              </div>
            </div>
            <div className="modal-footer"><button className="button secondary" type="button" onClick={() => setCreateOpen(false)}>Cancel</button><button className="button" type="button" onClick={createAgent}>Create agent</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function AccessRow({ label, detail, active, onToggle }: { label: string; detail: string; active: boolean; onToggle: () => void }) {
  return <div className="control-row"><div><strong>{label}</strong><small>{detail}</small></div><button className={`toggle ${active ? "on" : ""}`} type="button" onClick={onToggle}>{active ? "Allowed" : "Blocked"}</button></div>;
}
