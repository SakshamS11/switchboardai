"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import type { RoutingPolicy, Sensitivity } from "@/lib/types";

const modules: RoutingPolicy["module"][] = ["Sovereignty Router", "Cost Ladder", "Provider Degradation", "Budget Circuit Breaker", "Prompt Firewall"];

export default function SafeguardsPage() {
  const { routingPolicies, applications, teams, modelCatalog, createRoutingPolicy, updateRoutingPolicy } = useAppState();
  const [selectedId, setSelectedId] = useState(routingPolicies[0]?.id ?? "");
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState("");
  const selected = routingPolicies.find((policy) => policy.id === selectedId) ?? routingPolicies[0];
  const affectedApps = selected ? applications.filter((app) => selected.scope.includes(app.name) || selected.scope.includes("External-enabled")) : [];
  const affectedTeams = affectedApps.map((app) => teams.find((team) => team.name === app.team)).filter(Boolean);
  const localModels = modelCatalog.filter((model) => model.hosting === "Customer server" && model.status === "Running");
  const activeModels = modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected");

  const moduleCards = useMemo(() => modules.map((module) => {
    const policies = routingPolicies.filter((policy) => policy.module === module);
    return { module, count: policies.length, state: policies.some((policy) => policy.status === "Warning") ? "Warning" : "Active", control: explainModule(module) };
  }), [routingPolicies]);

  function submitPolicy(form: FormData) {
    const module = String(form.get("module")) as RoutingPolicy["module"];
    const input = {
      name: String(form.get("name") || "New policy"),
      module,
      scope: String(form.get("scope") || "Selected workspace"),
      sensitivity: String(form.get("sensitivity") || "Internal") as Sensitivity,
      primary: String(form.get("primary") || ""),
      fallback: String(form.get("fallback") || "None"),
      blocked: String(form.get("blocked") || "External models"),
      outcome: ""
    };
    const result = selected && editorOpen && form.get("mode") === "edit" ? updateRoutingPolicy(selected.id, input, "Edited routing policy as new version") : createRoutingPolicy(input);
    setMessage(result.message);
    if (result.ok) setEditorOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Control" title="Routing Policies" description="Govern sensitive routes, provider fallback, budget controls, model blocks and prompt inspection." action={<button className="button" type="button" onClick={() => setEditorOpen(true)}>Create policy</button>} />
      <div className="grid kpis">
        <MetricCard label="Policies" value={String(routingPolicies.length)} detail="Versioned controls" status="Healthy" />
        <MetricCard label="Sovereignty routers" value={String(routingPolicies.filter((p) => p.module === "Sovereignty Router").length)} detail="Fail closed for restricted data" status="Healthy" />
        <MetricCard label="Provider drift" value="OpenAI warning" detail="Fallback route armed" status="Warning" />
        <MetricCard label="Active policies" value={String(routingPolicies.filter((p) => p.active !== false).length)} detail="Evaluated by gateway" status="Healthy" />
      </div>

      <Card pad style={{ marginTop: 18 }} className="status-card"><div className="row"><div><h3>Provider degradation active</h3><p className="muted">External provider latency is elevated. Critical work should remain on approved fallback routes by sensitivity.</p></div><StatusBadge value="Warning" /></div><div className="row" style={{ justifyContent: "flex-start", marginTop: 12 }}><ButtonLink href="/dashboard/operations" secondary>Open incident</ButtonLink><ButtonLink href="/dashboard/model-catalog" secondary>Review provider</ButtonLink></div></Card>

      <div className="grid three" style={{ marginTop: 18 }}>{moduleCards.map((module) => <Card pad key={module.module}><div className="row"><h3>{module.module}</h3><StatusBadge value={module.state} /></div><p className="muted">{module.control}</p><p><strong>{module.count} policies</strong></p><button className="button secondary" type="button" onClick={() => { setSelectedId(routingPolicies.find((policy) => policy.module === module.module)?.id ?? selectedId); setEditorOpen(true); }}>Review rules</button></Card>)}</div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card>
          <div className="card-header"><div><h3>Active policy registry</h3><p className="muted">Every request entering the gateway is evaluated against workspace and team policy.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Policy</th><th>Module</th><th>Scope</th><th>Primary</th><th>Fallback</th><th>Blocked</th><th>Version</th><th>Status</th><th>Action</th></tr></thead><tbody>{routingPolicies.map((policy) => <tr key={policy.id} className="clickable-row" onClick={() => setSelectedId(policy.id)}><td><strong>{policy.name}</strong><br /><span className="muted">{policy.sensitivity}</span></td><td>{policy.module}</td><td>{policy.scope}</td><td>{policy.primary}</td><td>{policy.fallback}</td><td>{policy.blocked}</td><td>{policy.version}</td><td><StatusBadge value={policy.active === false ? "Disabled" : policy.status} /></td><td><button className="button secondary" type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(policy.id); setEditorOpen(true); }}>Open</button></td></tr>)}</tbody></table></div>
        </Card>
        {selected ? <Card pad><div className="row"><div><h3>{selected.name}</h3><p className="muted">{selected.module} · {selected.version}</p></div><StatusBadge value={selected.active === false ? "Disabled" : selected.status} /></div><div className="detail-grid" style={{ marginTop: 16 }}><Detail label="Effective outcome" value={selected.outcome ?? `${selected.scope} uses ${selected.primary}. Fallback: ${selected.fallback}. Blocked: ${selected.blocked}.`} /><Detail label="Affected teams" value={affectedTeams.map((team) => team?.name).filter(Boolean).join(", ") || "Scope-based"} /><Detail label="Affected workspaces" value={affectedApps.map((app) => app.name).join(", ") || selected.scope} /><Detail label="Sovereignty validation" value={selected.module === "Sovereignty Router" ? "Primary local, external fallback prohibited, fail closed." : "Not a sovereignty policy."} /></div><div className="row" style={{ justifyContent: "flex-end", marginTop: 16 }}><button className="button secondary" type="button" onClick={() => updateRoutingPolicy(selected.id, { active: selected.active === false }, selected.active === false ? "Activated routing policy" : "Deactivated routing policy")}>{selected.active === false ? "Activate" : "Deactivate"}</button><button className="button" type="button" onClick={() => setEditorOpen(true)}>Edit as new version</button></div></Card> : null}
      </div>
      {message ? <div className="callout" style={{ marginTop: 18 }}>{message}</div> : null}

      {editorOpen ? <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(event) => { event.preventDefault(); submitPolicy(new FormData(event.currentTarget)); }}><input type="hidden" name="mode" value={selected ? "edit" : "create"} /><div className="modal-header"><div><p className="eyebrow">Routing policy</p><h3>{selected ? "Edit as new version" : "Create policy"}</h3><p className="muted">Sovereignty Router saves are blocked unless they fail closed on an active local model.</p></div><button className="button secondary" type="button" onClick={() => setEditorOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Policy name</span><input className="field" name="name" defaultValue={selected?.name ?? "New Sovereignty Router"} /></label><label className="field-group"><span className="metric-label">Policy type</span><select className="field" name="module" defaultValue={selected?.module ?? "Sovereignty Router"}>{modules.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field-group"><span className="metric-label">Scope</span><input className="field" name="scope" defaultValue={selected?.scope ?? applications[0]?.name} /></label><label className="field-group"><span className="metric-label">Sensitivity</span><select className="field" name="sensitivity" defaultValue={selected?.sensitivity ?? "Restricted"}><option>General</option><option>Internal</option><option>Confidential</option><option>Restricted</option></select></label><label className="field-group"><span className="metric-label">Primary model</span><select className="field" name="primary" defaultValue={selected?.primary ?? localModels[0]?.name}>{activeModels.map((model) => <option key={model.id}>{model.name}</option>)}</select></label><label className="field-group"><span className="metric-label">Fallback policy</span><input className="field" name="fallback" defaultValue={selected?.fallback ?? "Fail closed"} /></label><label className="field-group wide"><span className="metric-label">Blocked models</span><input className="field" name="blocked" defaultValue={selected?.blocked ?? "All external models"} /></label></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button" type="submit">Save routing policy</button></div></form></div> : null}
    </div>
  );
}

function explainModule(module: RoutingPolicy["module"]) {
  if (module === "Sovereignty Router") return "Sensitive data routes to local models and fails closed.";
  if (module === "Cost Ladder") return "General work uses the lowest approved model tier first.";
  if (module === "Provider Degradation") return "Traffic reroutes when provider health declines.";
  if (module === "Budget Circuit Breaker") return "Premium routes stop or require approval at configured limits.";
  return "Sensitive prompts are inspected before routing.";
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
