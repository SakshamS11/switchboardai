"use client";

import { useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { modelCatalog, teams } from "@/lib/mock-data";
import { aed, percent } from "@/lib/utils";

export default function ResourcePlannerPage() {
  const { simulateAction } = useAppState();
  const [team, setTeam] = useState(teams[1].name);
  const selectedTeam = teams.find((item) => item.name === team) ?? teams[1];
  const [budget, setBudget] = useState(selectedTeam.spendBudgetAed);
  const [gpu, setGpu] = useState(60);
  const [concurrency, setConcurrency] = useState(25);

  const savings = Math.max(0, Math.round(selectedTeam.spendUsedAed * 0.18));

  function applyPlan() {
    simulateAction(`Applied resource plan for ${selectedTeam.name}`, "Resource Planner", "Planning");
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Optimisation" title="Resource Planner" description="Plan capacity, budget, model mix and governance impact before applying changes." action={<button className="button" type="button" onClick={applyPlan}>Apply plan</button>} />
      <div className="grid kpis">
        <Card pad><span className="metric-label">Potential savings</span><div className="metric-value">{aed(savings)}</div><p className="muted">Based on current team pattern</p></Card>
        <Card pad><span className="metric-label">Capacity pressure</span><div className="metric-value">Claims</div><p className="muted">GPU and VRAM near limits</p></Card>
        <Card pad><span className="metric-label">Budget risk</span><div className="metric-value">{teams.filter((item) => percent(item.spendUsedAed, item.spendBudgetAed) >= 70).length}</div><p className="muted">Teams near watch</p></Card>
        <Card pad><span className="metric-label">Governance impact</span><div className="metric-value">Medium</div><p className="muted">Approval and routing controls</p></Card>
      </div>
      <div className="grid two" style={{ marginTop: 18 }}>
        <Card pad>
          <h3>Simulator</h3>
          <div className="form-grid" style={{ marginTop: 14 }}>
            <label className="field-group"><span className="metric-label">Team</span><select className="field" value={team} onChange={(event) => { const next = teams.find((item) => item.name === event.target.value); setTeam(event.target.value); if (next) setBudget(next.spendBudgetAed); }}>{teams.map((item) => <option key={item.id}>{item.name}</option>)}</select></label>
            <label className="field-group"><span className="metric-label">Monthly budget AED</span><input className="field" type="number" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></label>
            <label className="field-group"><span className="metric-label">GPU allocation %</span><input className="field" type="number" value={gpu} onChange={(event) => setGpu(Number(event.target.value))} /></label>
            <label className="field-group"><span className="metric-label">Concurrency</span><input className="field" type="number" value={concurrency} onChange={(event) => setConcurrency(Number(event.target.value))} /></label>
          </div>
          <div className="callout" style={{ marginTop: 14 }}>Projected effect: {aed(savings)} monthly savings, lower queue risk, and improved policy fit if local routes remain available.</div>
        </Card>
        <Card pad>
          <h3>Planning signals</h3>
          <div className="control-list" style={{ marginTop: 14 }}>
            <div className="control-row"><div><strong>Current spend</strong><small>{aed(selectedTeam.spendUsedAed)} of {aed(selectedTeam.spendBudgetAed)}</small></div><Progress value={percent(selectedTeam.spendUsedAed, selectedTeam.spendBudgetAed)} /></div>
            <div className="control-row"><div><strong>Allowed local models</strong><small>{modelCatalog.filter((model) => model.hosting === "Customer server").map((model) => model.name).join(", ")}</small></div><StatusBadge value="Healthy" /></div>
            <div className="control-row"><div><strong>Fallback policy</strong><small>External fallback should follow sensitivity and budget policy.</small></div><StatusBadge value="Warning" /></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
