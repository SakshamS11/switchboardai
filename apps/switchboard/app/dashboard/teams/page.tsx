"use client";

import { useMemo, useState } from "react";
import { ActionButton } from "@/components/action-button";
import { Card, MetricCard, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { knowledgeBases, modelCatalog, teams } from "@/lib/mock-data";
import { aed, percent } from "@/lib/utils";

const initialModelAccess: Record<string, string[]> = {
  Legal: ["Qwen 32B Local", "Claude Sonnet"],
  Claims: ["Qwen 32B Local", "Falcon 40B Local"],
  Engineering: ["DeepSeek Coder Local", "Claude Sonnet", "GPT-4o"],
  "Customer Support": ["Falcon 40B Local", "GPT-4o"]
};

const initialKnowledgeAccess: Record<string, string[]> = {
  Legal: ["Legal Contracts"],
  Claims: ["Claims SOPs"],
  Engineering: ["Engineering Docs"],
  "Customer Support": ["Product FAQ"]
};

export default function TeamsPage() {
  const [modelAccess, setModelAccess] = useState(initialModelAccess);
  const [knowledgeAccess, setKnowledgeAccess] = useState(initialKnowledgeAccess);
  const [selectedTeam, setSelectedTeam] = useState(teams[0].name);
  const activeModels = useMemo(() => modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected"), []);
  const accessChanges = Object.values(modelAccess).flat().length + Object.values(knowledgeAccess).flat().length;

  function toggleAccess(kind: "model" | "knowledge", teamName: string, itemName: string) {
    const setter = kind === "model" ? setModelAccess : setKnowledgeAccess;
    setter((current) => {
      const values = current[teamName] ?? [];
      return {
        ...current,
        [teamName]: values.includes(itemName) ? values.filter((item) => item !== itemName) : [...values, itemName]
      };
    });
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Control" title="Teams & Access" description="Control which teams can use each AI application, model, knowledge base, and budget." action={<ActionButton action="Opened invite user flow" target="Teams & Access" type="Permission">Invite user</ActionButton>} />
      <div className="grid kpis">
        <MetricCard label="Teams" value={String(teams.length)} detail="With governed access" status="Healthy" />
        <MetricCard label="Users" value={String(teams.reduce((sum, team) => sum + team.users, 0))} detail="Assigned employees" status="Healthy" />
        <MetricCard label="At-risk teams" value={String(teams.filter((team) => team.risk !== "Healthy").length)} detail="Budget or capacity pressure" status="Warning" />
        <MetricCard label="Access grants" value={String(accessChanges)} detail="Models and knowledge bases" status="Healthy" />
      </div>

      <div className="grid two" style={{ marginTop: 18 }}>
        {teams.map((team) => (
          <Card pad key={team.id}>
            <div className="row"><h3>{team.name}</h3><StatusBadge value={team.risk} /></div>
            <p className="muted">Owner: {team.owner} - {team.users} users</p>
            <p><strong>Applications:</strong> {team.applications.join(", ")}</p>
            <div className="mini-bars">
              <div className="mini-bar"><span>Tokens</span><Progress value={percent(team.tokensUsed, team.tokenBudget)} /><span>{percent(team.tokensUsed, team.tokenBudget)}%</span></div>
              <div className="mini-bar"><span>Spend</span><Progress value={percent(team.spendUsedAed, team.spendBudgetAed)} /><span>{aed(team.spendUsedAed)}</span></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card pad>
          <h3>Team selector</h3>
          <p className="muted">Choose one team, then adjust its model and knowledge access.</p>
          <div className="selector-list">
            {teams.map((team) => <button className={`selector-item ${selectedTeam === team.name ? "active" : ""}`} type="button" key={team.id} onClick={() => setSelectedTeam(team.name)}>{team.name}<br /><small>{team.users} users - {team.owner}</small></button>)}
          </div>
        </Card>
        <Card pad>
          <div className="row"><div><h3>{selectedTeam} access</h3><p className="muted">Controls apply across assigned applications, agents, and API routes.</p></div><StatusBadge value={teams.find((team) => team.name === selectedTeam)?.risk ?? "Healthy"} /></div>
          <h3 style={{ marginTop: 18 }}>Allowed models</h3>
          <div className="control-list">{activeModels.map((model) => <AccessRow key={model.id} label={model.name} detail={`${model.hosting} - ${model.sensitivityFit}`} active={(modelAccess[selectedTeam] ?? []).includes(model.name)} onToggle={() => toggleAccess("model", selectedTeam, model.name)} />)}</div>
          <h3 style={{ marginTop: 18 }}>Knowledge access</h3>
          <div className="control-list">{knowledgeBases.map((kb) => <AccessRow key={kb.id} label={kb.name} detail={`${kb.source} - ${kb.sensitivity}`} active={(knowledgeAccess[selectedTeam] ?? []).includes(kb.name)} onToggle={() => toggleAccess("knowledge", selectedTeam, kb.name)} />)}</div>
          <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
            <ActionButton action={`Saved access policy for ${selectedTeam}`} target="Teams & Access" type="Permission">Save access changes</ActionButton>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AccessRow({ label, detail, active, onToggle }: { label: string; detail: string; active: boolean; onToggle: () => void }) {
  return <div className="control-row"><div><strong>{label}</strong><small>{detail}</small></div><button type="button" className={`toggle ${active ? "on" : ""}`} onClick={onToggle}>{active ? "Allowed" : "Blocked"}</button></div>;
}
