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

      <div className="grid two access-grid" style={{ marginTop: 18 }}>
        <AccessMatrix
          title="Model Access"
          description="Changes here control which models each team can use across assigned applications and agents."
          teams={teams.map((team) => team.name)}
          columns={activeModels.map((model) => model.name)}
          values={modelAccess}
          onToggle={(teamName, modelName) => toggleAccess("model", teamName, modelName)}
        />
        <AccessMatrix
          title="Knowledge Access"
          description="Users can retrieve only from knowledge bases allowed for their team and application."
          teams={teams.map((team) => team.name)}
          columns={knowledgeBases.map((kb) => kb.name)}
          values={knowledgeAccess}
          onToggle={(teamName, kbName) => toggleAccess("knowledge", teamName, kbName)}
        />
      </div>

      <Card pad style={{ marginTop: 18 }}>
        <div className="row">
          <div>
            <h3>Access policy changes</h3>
            <p className="muted">Updates are recorded against the team, model, knowledge source, and acting administrator.</p>
          </div>
          <ActionButton action="Saved team access policy changes" target="Teams & Access" type="Permission">Save access changes</ActionButton>
        </div>
      </Card>
    </div>
  );
}

function AccessMatrix({ title, description, teams, columns, values, onToggle }: { title: string; description: string; teams: string[]; columns: string[]; values: Record<string, string[]>; onToggle: (teamName: string, itemName: string) => void }) {
  return (
    <Card>
      <div className="card-header">
        <div>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
        </div>
      </div>
      <div className="table-wrap">
        <table className="access-table">
          <thead><tr><th>Team</th>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>
            {teams.map((teamName) => (
              <tr key={teamName}>
                <td><strong>{teamName}</strong></td>
                {columns.map((column) => {
                  const active = (values[teamName] ?? []).includes(column);
                  return <td key={column}><button type="button" className={`toggle ${active ? "on" : ""}`} onClick={() => onToggle(teamName, column)} aria-pressed={active}>{active ? "Allowed" : "Blocked"}</button></td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
