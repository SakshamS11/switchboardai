"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import type { Sensitivity } from "@/lib/types";

const rank: Sensitivity[] = ["General", "Internal", "Confidential", "Restricted"];

export default function KnowledgePage() {
  const { knowledgeBases, applications, teams, teamMembers, accessState, openAccessManager, addKnowledgeBase, saveAccessState } = useAppState();
  const [selectedId, setSelectedId] = useState(knowledgeBases[0]?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const selected = knowledgeBases.find((row) => row.id === selectedId) ?? knowledgeBases[0];
  const restricted = knowledgeBases.filter((row) => row.sensitivity === "Restricted" || row.sensitivity === "Confidential").length;
  const allowedTeams = selected ? teams.filter((team) => (accessState.knowledgeGrants[team.id] ?? []).includes(selected.id)) : [];
  const assignedWorkspaces = selected ? applications.filter((app) => app.knowledgeBases.includes(selected.name)) : [];
  const effectiveUsers = selected ? teamMembers.filter((member) => allowedTeams.some((team) => team.id === member.teamId) && rank.indexOf(member.clearance) >= rank.indexOf(selected.sensitivity)) : [];
  const filteredSources = knowledgeBases.filter((row) => `${row.name} ${row.source} ${row.sensitivity}`.toLowerCase().includes(query.toLowerCase()));
  const teamRows = selected ? teams.map((team) => {
    const granted = (accessState.knowledgeGrants[team.id] ?? []).includes(selected.id);
    const members = teamMembers.filter((member) => member.teamId === team.id);
    const clearedUsers = members.filter((member) => rank.indexOf(member.clearance) >= rank.indexOf(selected.sensitivity));
    const teamWorkspaces = applications.filter((app) => app.team === team.name && app.knowledgeBases.includes(selected.name));
    return { team, granted, users: members.length, clearedUsers: clearedUsers.length, workspaces: teamWorkspaces };
  }) : [];
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
    setMessage(`${kb.name} connected. Grant team access when indexing completes.`);
    setAddOpen(false);
  }

  function toggleTeamAccess(teamId: string) {
    if (!selected) return;
    const current = accessState.knowledgeGrants[teamId] ?? [];
    const granted = current.includes(selected.id);
    const nextTeamGrants = granted ? current.filter((id) => id !== selected.id) : [...current, selected.id];
    saveAccessState({
      ...accessState,
      knowledgeGrants: {
        ...accessState.knowledgeGrants,
        [teamId]: nextTeamGrants
      }
    }, `${granted ? "Revoked" : "Granted"} knowledge access`);
    const teamName = teams.find((team) => team.id === teamId)?.name ?? "Team";
    setMessage(`${teamName} ${granted ? "can no longer retrieve" : "can now retrieve"} ${selected.name}.`);
  }

  return (
    <div className="page knowledge-page">
      <PageHeader eyebrow="Build" title="Knowledge Bases" description="Connect document sources and enforce which teams can retrieve each source." action={<button className="button" type="button" onClick={() => setAddOpen(true)}>Add source</button>} />
      <div className="grid kpis">
        <MetricCard label="Knowledge bases" value={String(knowledgeBases.length)} detail="Connected sources" status="Healthy" />
        <MetricCard label="Documents indexed" value={String(knowledgeBases.reduce((sum, row) => sum + row.documents, 0))} detail="Across sources" status="Healthy" />
        <MetricCard label="Sensitive sources" value={String(restricted)} detail="Team access required" status="Warning" />
        <MetricCard label="Access conflicts" value={String(conflicts.length)} detail={selected?.name ?? "Selected source"} status={conflicts.length ? "Warning" : "Healthy"} />
      </div>

      <div className="knowledge-layout">
        <Card pad className="knowledge-source-panel">
          <div className="row">
            <div>
              <h3>Source registry</h3>
              <p className="muted">Select a source to review indexing and team access.</p>
            </div>
          </div>
          <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources..." aria-label="Search knowledge sources" />
          <div className="source-card-list">
            {filteredSources.map((row) => (
              <button key={row.id} type="button" className={`source-card ${row.id === selected?.id ? "active" : ""}`} onClick={() => setSelectedId(row.id)}>
                <span>
                  <strong>{row.name}</strong>
                  <small>{row.source} - {row.documents.toLocaleString()} docs</small>
                </span>
                <StatusBadge value={row.status} />
              </button>
            ))}
            {!filteredSources.length ? <div className="empty-state">No sources match this search.</div> : null}
          </div>
        </Card>

        {selected ? (
          <Card pad className="knowledge-detail-card">
            <div className="knowledge-detail-header">
              <div>
                <h3>{selected.name}</h3>
                <p className="muted">{selected.source} - last sync {selected.lastSync}</p>
              </div>
              <div className="row"><StatusBadge value={selected.sensitivity} /><StatusBadge value={selected.status} /></div>
            </div>

            <div className="knowledge-summary-grid">
              <Detail label="Documents" value={selected.documents.toLocaleString()} />
              <Detail label="Allowed teams" value={String(allowedTeams.length)} />
              <Detail label="Effective users" value={String(effectiveUsers.length)} />
              <Detail label="Assigned workspaces" value={assignedWorkspaces.length ? assignedWorkspaces.map((app) => app.name).join(", ") : "None"} />
            </div>

            <section className="knowledge-access-panel">
              <div className="card-header flush">
                <div>
                  <h3>Team retrieval access</h3>
                  <p className="muted">Toggle which teams may retrieve this source through assigned AI workspaces.</p>
                </div>
                <button className="button secondary compact-access-button" type="button" onClick={() => openAccessManager({ tab: "knowledge", filterResourceId: selected.id })}>Full matrix</button>
              </div>
              <div className="knowledge-access-list">
                {teamRows.map(({ team, granted, users, clearedUsers, workspaces }) => (
                  <div className="knowledge-access-row" key={team.id}>
                    <div className="knowledge-team-meta">
                      <strong>{team.name}</strong>
                      <span>{clearedUsers} of {users} users meet {selected.sensitivity} clearance</span>
                    </div>
                    <div className="knowledge-workspace-meta">
                      <span>{workspaces.length ? workspaces.map((app) => app.name).join(", ") : "No attached workspace"}</span>
                    </div>
                    <button className={`switch-button ${granted ? "on" : ""}`} type="button" onClick={() => toggleTeamAccess(team.id)} aria-pressed={granted}>
                      {granted ? "Allowed" : "Blocked"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {message ? <div className="callout" role="status">{message}</div> : null}
            {conflicts.length ? <div className="callout warning-callout">{conflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}</div> : <div className="callout">Users must have workspace assignment, team access, and enough clearance before retrieval is allowed.</div>}
          </Card>
        ) : null}
      </div>

      {addOpen ? <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(event) => { event.preventDefault(); submitSource(new FormData(event.currentTarget)); }}><div className="modal-header"><div><p className="eyebrow">Knowledge Source</p><h3>Connect source</h3><p className="muted">Access is granted from the shared team access model after indexing.</p></div><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Source name</span><input className="field" name="name" defaultValue="Finance Policies" /></label><label className="field-group"><span className="metric-label">Source type</span><select className="field" name="source"><option>SharePoint</option><option>Google Drive</option><option>S3</option><option>Upload</option></select></label><label className="field-group"><span className="metric-label">Sensitivity</span><select className="field" name="sensitivity"><option>General</option><option>Internal</option><option>Confidential</option><option>Restricted</option></select></label><Detail label="Index status" value="Queued for vector index" /></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Cancel</button><button className="button" type="submit">Connect source</button></div></form></div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
