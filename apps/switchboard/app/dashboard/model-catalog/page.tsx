"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { aed } from "@/lib/utils";
import type { ModelRecord } from "@/lib/types";

const filters = ["All", "Local", "External", "Provider issue", "Running/Connected"] as const;

export default function ModelCatalogPage() {
  const { modelCatalog, applications, teams, accessState, governedAgents, routingPolicies, servers, addModel, refreshProviderHealth, openAccessManager } = useAppState();
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selectedId, setSelectedId] = useState(modelCatalog[0]?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [kind, setKind] = useState<"local" | "external">("local");
  const [message, setMessage] = useState("");
  const selected = modelCatalog.find((model) => model.id === selectedId) ?? modelCatalog[0];
  const rows = useMemo(() => modelCatalog.filter((model) => {
    if (filter === "Local") return model.hosting === "Customer server";
    if (filter === "External") return model.hosting === "External provider";
    if (filter === "Provider issue") return model.status === "Warning" || model.status === "Failed";
    if (filter === "Running/Connected") return model.status === "Running" || model.status === "Connected";
    return true;
  }), [filter, modelCatalog]);
  const authorisedTeams = selected ? teams.filter((team) => (accessState.modelGrants[team.id] ?? []).includes(selected.id)) : [];
  const assignedWorkspaces = selected ? applications.filter((app) => app.allowedModels.includes(selected.name)) : [];
  const assignedAgents = selected ? governedAgents.filter((agent) => agent.allowedModels.includes(selected.name)) : [];
  const assignedPolicies = selected ? routingPolicies.filter((policy) => policy.primary === selected.name || policy.fallback.includes(selected.name)) : [];

  function submitAdd(form: FormData) {
    const common = {
      name: String(form.get("identifier") || "New Model"),
      provider: String(form.get("provider") || (kind === "local" ? "Local runtime" : "External provider")),
      runtime: (kind === "local" ? String(form.get("runtime") || "vLLM") : "External API") as ModelRecord["runtime"],
      hosting: (kind === "local" ? "Customer server" : "External provider") as ModelRecord["hosting"],
      sensitivityFit: String(form.get("sensitivity") || "Internal") as ModelRecord["sensitivityFit"],
      target: kind === "local" ? String(form.get("server") || "Unassigned server") : `Secret ref: ${String(form.get("secret") || "provider-prod")}`,
      inputCostAed: Number(form.get("inputCost") || 0),
      outputCostAed: Number(form.get("outputCost") || 0),
      contextWindow: String(form.get("context") || "32k"),
      fallbackEligible: form.get("fallback") === "on",
      status: "Testing" as ModelRecord["status"]
    };
    const model = addModel(common);
    setSelectedId(model.id);
    setMessage("Model added as Testing. A real provider connection check requires backend integration.");
    setAddOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Control" title="Models & Providers" description="Govern local and external models, provider health, data boundaries, cost and fallback eligibility." action={<button className="button" type="button" onClick={() => setAddOpen(true)}>Add model</button>} />
      <div className="grid kpis">
        <MetricCard label="Catalog models" value={String(modelCatalog.length)} detail="Local and external" status="Healthy" />
        <MetricCard label="Local models" value={String(modelCatalog.filter((m) => m.hosting === "Customer server").length)} detail="Customer infrastructure" status="Healthy" />
        <MetricCard label="Provider issue" value={String(modelCatalog.filter((m) => m.status === "Warning" || m.status === "Failed").length)} detail="Needs routing review" status="Warning" />
        <MetricCard label="Fallback-ready" value={String(modelCatalog.filter((m) => m.fallbackEligible).length)} detail="Eligible routes" status="Healthy" />
      </div>

      <Card pad style={{ marginTop: 18 }}><div className="row"><div><h3>Provider health</h3><p className="muted">Last checked just now. Refresh updates provider health in this browser session.</p></div><button className="button secondary" type="button" onClick={refreshProviderHealth}>Refresh Provider Health</button></div></Card>

      <div className="tabs" style={{ marginTop: 18 }}>{filters.map((item) => <button className={`tab ${filter === item ? "active" : ""}`} type="button" key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card>
          <div className="card-header"><div><h3>Governed model catalog</h3><p className="muted">Only Running or Connected models can be granted to teams.</p></div><ButtonLink href="/dashboard/safeguards" secondary>Review routing</ButtonLink></div>
          <div className="table-wrap"><table><thead><tr><th>Model</th><th>Hosting</th><th>Runtime</th><th>Target</th><th>Sensitivity</th><th>Status</th><th>Action</th></tr></thead><tbody>{rows.map((model) => <tr className="clickable-row" key={model.id} onClick={() => setSelectedId(model.id)}><td><strong>{model.name}</strong><br /><span className="muted">{model.provider}</span></td><td>{model.hosting}</td><td>{model.runtime}</td><td>{model.target}</td><td>{model.sensitivityFit}</td><td><StatusBadge value={model.status} /></td><td><button className="button secondary" type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(model.id); }}>Open</button></td></tr>)}</tbody></table></div>
        </Card>

        {selected ? <Card pad><div className="row"><div><h3>{selected.name}</h3><p className="muted">{selected.provider} - {selected.hosting}</p></div><StatusBadge value={selected.status} /></div><div className="detail-grid" style={{ marginTop: 16 }}><Detail label="Authorised teams" value={authorisedTeams.map((team) => team.name).join(", ") || "None"} /><Detail label="Assigned workspaces" value={assignedWorkspaces.map((app) => app.name).join(", ") || "None"} /><Detail label="Routing policies" value={assignedPolicies.map((policy) => policy.name).join(", ") || "None"} /><Detail label="Agents" value={assignedAgents.map((agent) => agent.name).join(", ") || "None"} /><Detail label="Cost" value={selected.inputCostAed ? `${aed(selected.inputCostAed)} in / ${aed(selected.outputCostAed)} out` : "Local capacity"} /><Detail label="Graduation analysis" value={selected.hosting === "External provider" ? "Candidate workloads can be shadow-tested on local models." : "Owned capacity route."} /></div><button className="button" type="button" onClick={() => openAccessManager({ tab: "models", filterResourceId: selected.id })}>Manage access</button></Card> : null}
      </div>

      {message ? <div className="callout" style={{ marginTop: 18 }}>{message}</div> : null}

      {addOpen ? <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(event) => { event.preventDefault(); submitAdd(new FormData(event.currentTarget)); }}><div className="modal-header"><div><p className="eyebrow">Register model</p><h3>Add governed model</h3><p className="muted">Secrets stay server-side. Only secret references and routing metadata are stored here.</p></div><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Close</button></div><div className="modal-body"><div className="segmented"><button className={kind === "local" ? "active" : ""} type="button" onClick={() => setKind("local")}>Local model</button><button className={kind === "external" ? "active" : ""} type="button" onClick={() => setKind("external")}>External model</button></div><div className="form-grid" style={{ marginTop: 16 }}>{kind === "local" ? <><label className="field-group"><span className="metric-label">Runtime</span><select className="field" name="runtime"><option>Ollama</option><option>vLLM</option><option>External API</option></select></label><label className="field-group"><span className="metric-label">Deployment server</span><select className="field" name="server">{servers.map((server) => <option key={server.id}>{server.name}</option>)}</select></label><label className="field-group"><span className="metric-label">VRAM requirement</span><input className="field" name="vram" defaultValue="24GB" /></label></> : <><label className="field-group"><span className="metric-label">Provider</span><input className="field" name="provider" defaultValue="OpenAI" /></label><label className="field-group"><span className="metric-label">Secret reference</span><input className="field" name="secret" defaultValue="openai-prod" /></label><label className="field-group"><span className="metric-label">Input cost / 1M tokens</span><input className="field" name="inputCost" type="number" defaultValue="18" /></label><label className="field-group"><span className="metric-label">Output cost / 1M tokens</span><input className="field" name="outputCost" type="number" defaultValue="54" /></label></>}<label className="field-group"><span className="metric-label">Model identifier</span><input className="field" name="identifier" defaultValue={kind === "local" ? "Llama 3 Local" : "GPT-5 mini"} /></label><label className="field-group"><span className="metric-label">Sensitivity fit</span><select className="field" name="sensitivity"><option>General</option><option>Internal</option><option>Confidential</option><option>Restricted</option></select></label><label className="field-group"><span className="metric-label">Context window</span><input className="field" name="context" defaultValue="32k" /></label><label className="check-row"><input name="fallback" type="checkbox" defaultChecked /> Fallback eligible</label></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setMessage("Connection check requires backend provider credentials. No provider call was made.")}>Test connection</button><button className="button" type="submit">Add to governed catalog</button></div></form></div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
