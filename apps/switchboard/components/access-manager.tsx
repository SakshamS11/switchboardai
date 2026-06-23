"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, StatusBadge } from "@/components/ui";
import type { AccessState } from "@/lib/types";

const tabs = [
  { id: "models", label: "Models" },
  { id: "knowledge", label: "Knowledge bases" },
  { id: "agents", label: "Governed agents" }
] as const;

type AccessTab = (typeof tabs)[number]["id"];

export function AccessManager() {
  const { accessDrawer, closeAccessManager, teams, applications, modelCatalog, knowledgeBases, governedAgents, accessState, saveAccessState } = useAppState();
  const [draft, setDraft] = useState<AccessState>(accessState);
  const [query, setQuery] = useState("");
  const [enabledOnly, setEnabledOnly] = useState(false);
  const [mode, setMode] = useState<"team" | "matrix">(accessDrawer.mode);
  const [tab, setTab] = useState<AccessTab>(accessDrawer.tab);
  const [teamId, setTeamId] = useState(accessDrawer.teamId);

  useEffect(() => {
    if (!accessDrawer.open) return;
    setDraft(accessState);
    setMode(accessDrawer.mode);
    setTab(accessDrawer.tab);
    setTeamId(accessDrawer.teamId);
    setQuery("");
  }, [accessDrawer, accessState]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && accessDrawer.open) closeAccessManager();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [accessDrawer.open, closeAccessManager]);

  const resources = useMemo(() => getResources(tab, modelCatalog, knowledgeBases, governedAgents), [governedAgents, knowledgeBases, modelCatalog, tab]);
  const filteredResources = resources.filter((resource) => {
    const matchesQuery = !query || `${resource.name} ${resource.meta} ${resource.detail}`.toLowerCase().includes(query.toLowerCase());
    const matchesResource = !accessDrawer.filterResourceId || resource.id === accessDrawer.filterResourceId;
    const matchesEnabled = !enabledOnly || isAllowed(draft, tab, teamId, resource.id);
    return matchesQuery && matchesResource && matchesEnabled;
  });
  const selectedTeam = teams.find((team) => team.id === teamId) ?? teams[0];
  const changeCount = countChanges(accessState, draft);
  const summary = selectedTeam ? buildSummary(selectedTeam.id, draft, applications, modelCatalog, knowledgeBases, governedAgents) : "";
  const conflicts = selectedTeam ? buildConflicts(selectedTeam.id, draft, applications, modelCatalog, knowledgeBases, governedAgents) : [];

  function toggle(team: string, resourceId: string) {
    const key = keyFor(tab);
    setDraft((current) => {
      const values = current[key][team] ?? [];
      const nextValues = values.includes(resourceId) ? values.filter((item) => item !== resourceId) : [...values, resourceId];
      return { ...current, [key]: { ...current[key], [team]: nextValues } };
    });
  }

  function save() {
    const removed = removedLiveWorkspaceAccess(accessState, draft, applications, teams, modelCatalog, knowledgeBases, governedAgents);
    if (removed.length && !window.confirm(`${removed[0]}. Employees may lose access in live workspaces or active sessions. Save anyway?`)) return;
    saveAccessState(draft, `Saved ${tab} access changes`);
    closeAccessManager();
  }

  if (!accessDrawer.open) return null;

  return (
    <div className="drawer-backdrop" role="presentation">
      <aside className="access-drawer" role="dialog" aria-modal="true" aria-labelledby="access-title">
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Access control</p>
            <h2 id="access-title">Manage team access</h2>
            <p className="muted">{selectedTeam?.name ?? "Select a team"} access is staged until you save.</p>
          </div>
          <button className="button secondary" type="button" onClick={closeAccessManager}>Close</button>
        </header>

        <div className="drawer-controls">
          <label className="field-group"><span className="metric-label">Team</span><select className="field" value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select></label>
          <div className="segmented" role="tablist" aria-label="Access view"><button className={mode === "team" ? "active" : ""} type="button" onClick={() => setMode("team")}>By team</button><button className={mode === "matrix" ? "active" : ""} type="button" onClick={() => setMode("matrix")}>Matrix view</button></div>
          <label className="field-group drawer-search"><span className="metric-label">Search</span><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a model, knowledge base or agent" /></label>
          <label className="check-row"><input type="checkbox" checked={enabledOnly} onChange={(event) => setEnabledOnly(event.target.checked)} /> Show enabled only</label>
        </div>

        <div className="tabs">{tabs.map((item) => <button key={item.id} className={`tab ${tab === item.id ? "active" : ""}`} type="button" onClick={() => setTab(item.id)}>{item.label}</button>)}</div>

        <Card pad className="effective-summary">
          <div className="row"><div><h3>Effective access summary</h3><p className="muted">{summary}</p></div><StatusBadge value={conflicts.length ? "Warning" : "Healthy"} /></div>
          {conflicts.length ? <div className="conflict-list">{conflicts.map((conflict) => <span key={conflict}>{conflict}</span>)}</div> : <p className="muted">No access conflicts for this team.</p>}
        </Card>

        {mode === "team" ? (
          <div className="access-list">
            {filteredResources.map((resource) => {
              const allowed = isAllowed(draft, tab, teamId, resource.id);
              return (
                <div className="access-row" key={resource.id}>
                  <div>
                    <strong>{resource.name}</strong>
                    <small>{resource.meta} - {resource.detail}</small>
                    {!resource.available ? <small className="risk-text">Unavailable resources cannot be granted until active.</small> : null}
                  </div>
                  <StatusBadge value={resource.status} />
                  <button className={`switch-button ${allowed ? "on" : ""}`} type="button" disabled={!resource.available && !allowed} onClick={() => toggle(teamId, resource.id)}>{allowed ? "Allowed" : "Blocked"}</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="matrix-wrap">
            <table className="access-matrix">
              <thead><tr><th>Resource</th>{teams.map((team) => <th key={team.id}>{team.name}</th>)}</tr></thead>
              <tbody>{filteredResources.map((resource) => <tr key={resource.id}><td><strong>{resource.name}</strong><br /><span>{resource.status}</span></td>{teams.map((team) => {
                const allowed = isAllowed(draft, tab, team.id, resource.id);
                return <td key={team.id}><button className={`switch-button compact ${allowed ? "on" : ""}`} disabled={!resource.available && !allowed} type="button" onClick={() => toggle(team.id, resource.id)}>{allowed ? "Allowed" : "Blocked"}</button></td>;
              })}</tr>)}</tbody>
            </table>
          </div>
        )}

        <footer className="drawer-footer">
          <div><strong>{changeCount} unsaved changes</strong><p className="muted">Saving updates workspaces, preview access and resource detail pages.</p></div>
          <div className="row"><button className="button secondary" type="button" onClick={() => setDraft(accessState)} disabled={!changeCount}>Discard</button><button className="button" type="button" onClick={save} disabled={!changeCount}>Save access</button></div>
        </footer>
      </aside>
    </div>
  );
}

function keyFor(tab: AccessTab): keyof AccessState {
  if (tab === "models") return "modelGrants";
  if (tab === "knowledge") return "knowledgeGrants";
  return "agentGrants";
}

function isAllowed(state: AccessState, tab: AccessTab, teamId: string, id: string) {
  return (state[keyFor(tab)][teamId] ?? []).includes(id);
}

function getResources(tab: AccessTab, models: ReturnType<typeof useAppState>["modelCatalog"], knowledge: ReturnType<typeof useAppState>["knowledgeBases"], agents: ReturnType<typeof useAppState>["governedAgents"]) {
  if (tab === "models") return models.map((model) => ({ id: model.id, name: model.name, meta: `${model.hosting} / ${model.runtime}`, detail: model.sensitivityFit, status: model.status, available: model.status === "Running" || model.status === "Connected" }));
  if (tab === "knowledge") return knowledge.map((kb) => ({ id: kb.id, name: kb.name, meta: `${kb.source} / ${kb.documents} docs`, detail: kb.sensitivity, status: kb.status, available: kb.status === "Indexed" }));
  return agents.map((agent) => ({ id: agent.id, name: agent.name, meta: agent.owner, detail: agent.externalModelRule, status: agent.killSwitch === "Armed" ? "Critical" : agent.status, available: agent.status === "Active" && agent.killSwitch !== "Armed" }));
}

function countChanges(saved: AccessState, draft: AccessState) {
  return JSON.stringify(saved) === JSON.stringify(draft) ? 0 : 1;
}

export function buildSummary(teamId: string, state: AccessState, apps: ReturnType<typeof useAppState>["applications"], models: ReturnType<typeof useAppState>["modelCatalog"], knowledge: ReturnType<typeof useAppState>["knowledgeBases"], agents: ReturnType<typeof useAppState>["governedAgents"]) {
  const teamApps = state.workspaceGrants[teamId] ?? [];
  const modelCount = (state.modelGrants[teamId] ?? []).filter((id) => models.some((model) => model.id === id)).length;
  const knowledgeCount = (state.knowledgeGrants[teamId] ?? []).filter((id) => knowledge.some((kb) => kb.id === id)).length;
  const agentCount = (state.agentGrants[teamId] ?? []).filter((id) => agents.some((agent) => agent.id === id)).length;
  const workspaceCount = teamApps.filter((id) => apps.some((app) => app.id === id)).length;
  const external = (state.modelGrants[teamId] ?? []).map((id) => models.find((model) => model.id === id)).filter((model) => model?.hosting === "External provider").map((model) => model?.name).filter(Boolean).join(", ");
  return `This team has access to ${modelCount} models, ${knowledgeCount} knowledge bases, ${agentCount} governed agents and ${workspaceCount} workspaces. ${external ? `External model access is permitted through ${external}.` : "External model access is not currently granted."}`;
}

export function buildConflicts(teamId: string, state: AccessState, apps: ReturnType<typeof useAppState>["applications"], models: ReturnType<typeof useAppState>["modelCatalog"], knowledge: ReturnType<typeof useAppState>["knowledgeBases"], agents: ReturnType<typeof useAppState>["governedAgents"]) {
  const conflicts: string[] = [];
  const grantedModels = state.modelGrants[teamId] ?? [];
  const grantedKnowledge = state.knowledgeGrants[teamId] ?? [];
  const grantedAgents = state.agentGrants[teamId] ?? [];
  const teamWorkspaces = apps.filter((app) => (state.workspaceGrants[teamId] ?? []).includes(app.id));
  for (const modelId of grantedModels) {
    const model = models.find((item) => item.id === modelId);
    if (model && model.status !== "Running" && model.status !== "Connected") conflicts.push(`${model.name} is granted but not active.`);
  }
  for (const kbId of grantedKnowledge) {
    const kb = knowledge.find((item) => item.id === kbId);
    if (kb && kb.status !== "Indexed") conflicts.push(`${kb.name} is granted but not Indexed.`);
  }
  for (const agentId of grantedAgents) {
    const agent = agents.find((item) => item.id === agentId);
    if (agent && (agent.status !== "Active" || agent.killSwitch === "Armed")) conflicts.push(`${agent.name} cannot be invoked while paused or kill switch armed.`);
  }
  for (const app of teamWorkspaces) {
    const appModelIds = app.allowedModels.map((name) => models.find((model) => model.name === name)?.id).filter(Boolean);
    const appKnowledgeIds = app.knowledgeBases.map((name) => knowledge.find((kb) => kb.name === name)?.id).filter(Boolean);
    const appAgentIds = app.agents.map((name) => agents.find((agent) => agent.name === name)?.id).filter(Boolean);
    if (appModelIds.some((id) => id && !grantedModels.includes(id))) conflicts.push(`${app.name} includes a model not granted to this team.`);
    if (appKnowledgeIds.some((id) => id && !grantedKnowledge.includes(id))) conflicts.push(`${app.name} includes knowledge not granted to this team.`);
    if (appAgentIds.some((id) => id && !grantedAgents.includes(id))) conflicts.push(`${app.name} includes an agent not granted to this team.`);
    if (app.externalModelRule === "Blocked" && grantedModels.some((id) => models.find((model) => model.id === id)?.hosting === "External provider")) conflicts.push(`${app.name} blocks external routing while team has external model access.`);
  }
  return [...new Set(conflicts)];
}

function removedLiveWorkspaceAccess(saved: AccessState, draft: AccessState, apps: ReturnType<typeof useAppState>["applications"], teams: ReturnType<typeof useAppState>["teams"], models: ReturnType<typeof useAppState>["modelCatalog"], knowledge: ReturnType<typeof useAppState>["knowledgeBases"], agents: ReturnType<typeof useAppState>["governedAgents"]) {
  const messages: string[] = [];
  for (const team of teams) {
    const liveApps = apps.filter((app) => app.status === "Live" && (saved.workspaceGrants[team.id] ?? []).includes(app.id));
    for (const app of liveApps) {
      const removedModels = (saved.modelGrants[team.id] ?? []).filter((id) => !(draft.modelGrants[team.id] ?? []).includes(id) && app.allowedModels.includes(models.find((model) => model.id === id)?.name ?? ""));
      const removedKnowledge = (saved.knowledgeGrants[team.id] ?? []).filter((id) => !(draft.knowledgeGrants[team.id] ?? []).includes(id) && app.knowledgeBases.includes(knowledge.find((kb) => kb.id === id)?.name ?? ""));
      const removedAgents = (saved.agentGrants[team.id] ?? []).filter((id) => !(draft.agentGrants[team.id] ?? []).includes(id) && app.agents.includes(agents.find((agent) => agent.id === id)?.name ?? ""));
      if (removedModels.length || removedKnowledge.length || removedAgents.length) messages.push(`${team.name} employees may lose access inside ${app.name}`);
    }
  }
  return messages;
}
