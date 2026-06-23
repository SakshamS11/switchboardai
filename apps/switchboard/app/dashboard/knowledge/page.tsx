"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import type { Sensitivity } from "@/lib/types";

const rank: Sensitivity[] = ["General", "Internal", "Confidential", "Restricted"];

export default function KnowledgePage() {
  const { knowledgeBases, applications, teams, teamMembers, accessState, openAccessManager, addKnowledgeBase } = useAppState();
  const [selectedId, setSelectedId] = useState(knowledgeBases[0]?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const selected = knowledgeBases.find((row) => row.id === selectedId) ?? knowledgeBases[0];
  const restricted = knowledgeBases.filter((row) => row.sensitivity === "Restricted" || row.sensitivity === "Confidential").length;
  const allowedTeams = selected ? teams.filter((team) => (accessState.knowledgeGrants[team.id] ?? []).includes(selected.id)) : [];
  const assignedWorkspaces = selected ? applications.filter((app) => app.knowledgeBases.includes(selected.name)) : [];
  const effectiveUsers = selected ? teamMembers.filter((member) => allowedTeams.some((team) => team.id === member.teamId) && rank.indexOf(member.clearance) >= rank.indexOf(selected.sensitivity)) : [];
  const conflicts = useMemo(() => {
    if (!selected) return [];
    const output: string[] = [];
    for (const app of assignedWorkspaces) {
      const team = teams.find((item) => item.name === app.team);
      if (team && !(accessState.knowledgeGrants[team.id] ?? []).includes(selected.id)) output.push(`${app.name} attaches ${selected.name}, but ${team.name} is blocked.`);
    }
    if (selected.status !== "Indexed") output.push(`${selected.name} is ${selected.status}; retrieval is blocked until Indexed.`);
    return output;
  }, [accessState.knowledgeGrants, assignedWorkspaces, selected, teams]);

  function submitSource(form: FormData) {
    const kb = addKnowledgeBase({ name: String(form.get("name") || "New Knowledge Base"), source: String(form.get("source") || "Upload") as "Upload" | "SharePoint" | "Google Drive" | "S3", sensitivity: String(form.get("sensitivity") || "Internal") as Sensitivity });
    setSelectedId(kb.id);
    setAddOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Build" title="Knowledge Bases" description="Connect document sources and enforce which teams can retrieve each source." action={<button className="button" type="button" onClick={() => setAddOpen(true)}>Add source</button>} />
      <div className="grid kpis">
        <MetricCard label="Knowledge bases" value={String(knowledgeBases.length)} detail="Connected sources" status="Healthy" />
        <MetricCard label="Documents indexed" value={String(knowledgeBases.reduce((sum, row) => sum + row.documents, 0))} detail="Across sources" status="Healthy" />
        <MetricCard label="Sensitive sources" value={String(restricted)} detail="Team access required" status="Warning" />
        <MetricCard label="Access conflicts" value={String(conflicts.length)} detail={selected?.name ?? "Selected source"} status={conflicts.length ? "Warning" : "Healthy"} />
      </div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card pad>
          <h3>Source registry</h3>
          <div className="selector-list">{knowledgeBases.map((row) => <button key={row.id} type="button" className={`selector-item ${row.id === selected?.id ? "active" : ""}`} onClick={() => setSelectedId(row.id)}>{row.name}<br /><small>{row.source} - {row.documents} docs</small></button>)}</div>
        </Card>
        {selected ? <Card pad><div className="row"><div><h3>{selected.name}</h3><p className="muted">{selected.source} - last sync {selected.lastSync}</p></div><StatusBadge value={selected.status} /></div><div className="grid three" style={{ marginTop: 16 }}><Detail label="Sensitivity" value={selected.sensitivity} /><Detail label="Assigned workspaces" value={assignedWorkspaces.map((app) => app.name).join(", ") || "None"} /><Detail label="Allowed teams" value={allowedTeams.map((team) => team.name).join(", ") || "None"} /><Detail label="Effective users" value={String(effectiveUsers.length)} /><Detail label="Retrieval check" value="Workspace attached + team granted + user clearance" /><Detail label="Vector index" value={selected.status} /></div><div className="callout" style={{ marginTop: 16 }}>{conflicts.length ? conflicts.map((conflict) => <p key={conflict}>{conflict}</p>) : <p>Authorised users can retrieve this source only through assigned workspaces.</p>}<button className="button secondary" type="button" onClick={() => openAccessManager({ tab: "knowledge", filterResourceId: selected.id })}>Manage access</button></div></Card> : null}
      </div>

      {addOpen ? <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(event) => { event.preventDefault(); submitSource(new FormData(event.currentTarget)); }}><div className="modal-header"><div><p className="eyebrow">Knowledge Source</p><h3>Connect source</h3><p className="muted">Access is granted from the shared team access model after indexing.</p></div><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Source name</span><input className="field" name="name" defaultValue="Finance Policies" /></label><label className="field-group"><span className="metric-label">Source type</span><select className="field" name="source"><option>SharePoint</option><option>Google Drive</option><option>S3</option><option>Upload</option></select></label><label className="field-group"><span className="metric-label">Sensitivity</span><select className="field" name="sensitivity"><option>General</option><option>Internal</option><option>Confidential</option><option>Restricted</option></select></label><Detail label="Index status" value="Queued for vector index" /></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Cancel</button><button className="button" type="submit">Connect source</button></div></form></div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
