"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { knowledgeBases, teams } from "@/lib/mock-data";
import { slugify } from "@/lib/utils";

type KnowledgeRow = {
  id: string;
  name: string;
  source: string;
  documents: number;
  status: string;
  sensitivity: string;
  assignedApps: string[];
  assignedTeams: string[];
  lastSync: string;
};

export default function KnowledgePage() {
  const { simulateAction } = useAppState();
  const [rows, setRows] = useState<KnowledgeRow[]>(knowledgeBases);
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [sourceName, setSourceName] = useState("Finance Policies");
  const [sourceType, setSourceType] = useState("SharePoint");
  const [sensitivity, setSensitivity] = useState("Confidential");
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const restricted = rows.filter((row) => row.sensitivity === "Restricted" || row.sensitivity === "Confidential").length;

  function toggleTeam(teamName: string) {
    setRows((current) => current.map((row) => {
      if (row.id !== selected.id) return row;
      const exists = row.assignedTeams.includes(teamName);
      return { ...row, assignedTeams: exists ? row.assignedTeams.filter((team) => team !== teamName) : [...row.assignedTeams, teamName] };
    }));
  }

  function addSource() {
    const row: KnowledgeRow = {
      id: slugify(sourceName),
      name: sourceName,
      source: sourceType,
      documents: 0,
      status: "Syncing",
      sensitivity,
      assignedApps: [],
      assignedTeams: [],
      lastSync: "Queued"
    };
    setRows((current) => [row, ...current]);
    setSelectedId(row.id);
    setAddOpen(false);
    simulateAction("Connected knowledge source", row.name, "Knowledge");
  }

  const assignedCount = useMemo(() => rows.reduce((sum, row) => sum + row.assignedTeams.length, 0), [rows]);

  return (
    <div className="page">
      <PageHeader eyebrow="Build" title="Knowledge Bases" description="Connect document sources and control which teams can retrieve from each source." action={<button className="button" type="button" onClick={() => setAddOpen(true)}>Add source</button>} />
      <div className="grid kpis">
        <MetricCard label="Knowledge bases" value={String(rows.length)} detail="Connected sources" status="Healthy" />
        <MetricCard label="Documents indexed" value={String(rows.reduce((sum, row) => sum + row.documents, 0))} detail="Across sources" status="Healthy" />
        <MetricCard label="Sensitive sources" value={String(restricted)} detail="Team access required" status="Warning" />
        <MetricCard label="Team grants" value={String(assignedCount)} detail="Retrieval boundaries" status="Healthy" />
      </div>

      <div className="control-panel" style={{ marginTop: 18 }}>
        <Card pad>
          <h3>Sources</h3>
          <p className="muted">Select a source to manage sync, sensitivity, and team access.</p>
          <div className="selector-list">
            {rows.map((row) => <button key={row.id} type="button" className={`selector-item ${row.id === selected?.id ? "active" : ""}`} onClick={() => setSelectedId(row.id)}>{row.name}<br /><small>{row.source} - {row.documents} docs</small></button>)}
          </div>
        </Card>
        {selected ? (
          <Card pad>
            <div className="row"><div><h3>{selected.name}</h3><p className="muted">{selected.source} - last sync {selected.lastSync}</p></div><StatusBadge value={selected.status} /></div>
            <div className="compact-card-grid" style={{ marginTop: 14 }}>
              <Card pad><span className="metric-label">Sensitivity</span><div className="metric-value">{selected.sensitivity}</div></Card>
              <Card pad><span className="metric-label">Assigned teams</span><div className="metric-value">{selected.assignedTeams.length}</div></Card>
              <Card pad><span className="metric-label">Assigned apps</span><div className="metric-value">{selected.assignedApps.length}</div></Card>
            </div>
            <h3 style={{ marginTop: 18 }}>Team retrieval access</h3>
            <div className="control-list">
              {teams.map((team) => {
                const allowed = selected.assignedTeams.includes(team.name);
                return <div className="control-row" key={team.id}><div><strong>{team.name}</strong><small>{team.users} users inherit this boundary</small></div><button className={`toggle ${allowed ? "on" : ""}`} type="button" onClick={() => toggleTeam(team.name)}>{allowed ? "Allowed" : "Blocked"}</button></div>;
              })}
            </div>
            <div className="row" style={{ marginTop: 16, justifyContent: "flex-end" }}>
              <button className="button" type="button" onClick={() => simulateAction("Saved knowledge access policy", selected.name, "Knowledge")}>Save access policy</button>
            </div>
          </Card>
        ) : null}
      </div>

      {addOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="add-source-title">
            <div className="modal-header"><div><p className="eyebrow">Knowledge Source</p><h3 id="add-source-title">Connect source</h3><p className="muted">The source is indexed on customer infrastructure and assigned by team.</p></div><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="field-group"><span className="metric-label">Source name</span><input className="field" value={sourceName} onChange={(event) => setSourceName(event.target.value)} /></label>
                <label className="field-group"><span className="metric-label">Source type</span><select className="field" value={sourceType} onChange={(event) => setSourceType(event.target.value)}><option>SharePoint</option><option>Google Drive</option><option>S3</option><option>Upload</option></select></label>
                <label className="field-group"><span className="metric-label">Sensitivity</span><select className="field" value={sensitivity} onChange={(event) => setSensitivity(event.target.value)}><option>General</option><option>Internal</option><option>Confidential</option><option>Restricted</option></select></label>
                <div><span className="metric-label">Index status</span><p><strong>Queued for vector index</strong></p></div>
              </div>
            </div>
            <div className="modal-footer"><button className="button secondary" type="button" onClick={() => setAddOpen(false)}>Cancel</button><button className="button" type="button" onClick={addSource}>Connect source</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
