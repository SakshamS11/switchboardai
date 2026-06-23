"use client";

import { useMemo, useState } from "react";
import { buildConflicts, buildSummary } from "@/components/access-manager";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { aed, formatNumber, percent } from "@/lib/utils";

const tabs = ["Overview", "Members", "Access", "Budgets & limits"] as const;

export default function TeamsPage() {
  const { teams, teamMembers, invitations, accessState, applications, modelCatalog, knowledgeBases, governedAgents, openAccessManager, inviteMember, revokeInvitation, updateTeamBudget, updateUserLimit } = useAppState();
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? "legal");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [teamQuery, setTeamQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("new.member@acme.ai");
  const [inviteRole, setInviteRole] = useState<"Member" | "Team Admin" | "Viewer">("Member");
  const [budgetMessage, setBudgetMessage] = useState("");
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0]!;
  const members = teamMembers.filter((member) => member.teamId === selectedTeam.id);
  const summary = buildSummary(selectedTeam.id, accessState, applications, modelCatalog, knowledgeBases, governedAgents);
  const conflicts = buildConflicts(selectedTeam.id, accessState, applications, modelCatalog, knowledgeBases, governedAgents);
  const selectedApps = applications.filter((app) => (accessState.workspaceGrants[selectedTeam.id] ?? []).includes(app.id));
  const filteredTeams = teams.filter((team) => `${team.name} ${team.owner}`.toLowerCase().includes(teamQuery.toLowerCase()));
  const grants = useMemo(() => ({
    models: (accessState.modelGrants[selectedTeam.id] ?? []).map((id) => modelCatalog.find((model) => model.id === id)?.name).filter(Boolean),
    knowledge: (accessState.knowledgeGrants[selectedTeam.id] ?? []).map((id) => knowledgeBases.find((kb) => kb.id === id)?.name).filter(Boolean),
    agents: (accessState.agentGrants[selectedTeam.id] ?? []).map((id) => governedAgents.find((agent) => agent.id === id)?.name).filter(Boolean)
  }), [accessState, governedAgents, knowledgeBases, modelCatalog, selectedTeam.id]);

  function submitInvite() {
    inviteMember({ email: inviteEmail, teamId: selectedTeam.id, role: inviteRole });
    setInviteOpen(false);
  }

  function saveBudget(form: FormData) {
    const result = updateTeamBudget(selectedTeam.id, Number(form.get("tokens")), Number(form.get("spend")), form.get("hardLimit") === "on");
    setBudgetMessage(result.message);
    if (result.ok) setBudgetOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Govern" title="Teams & Access" description="Create teams, invite users, assign AI workspaces, and control model, knowledge, agent, budget and evidence responsibility." action={<button className="button" type="button" onClick={() => setInviteOpen(true)}>Invite member</button>} />

      <section className="access-ribbon">
        <div><strong>Access control</strong><p>Manage which models, knowledge bases and governed agents each team can use.</p></div>
        <div className="row"><button className="button" type="button" onClick={() => openAccessManager({ teamId: selectedTeam.id, tab: "models", mode: "team" })}>Manage access</button><button className="button secondary" type="button" onClick={() => setInviteOpen(true)}>Invite member</button><button className="button secondary" type="button" onClick={() => setBudgetOpen(true)}>Budgets & limits</button></div>
      </section>

      <div className="grid kpis">
        <MetricCard label="Teams" value={String(teams.length)} detail="Governed groups" status="Healthy" />
        <MetricCard label="Members" value={String(teamMembers.length)} detail="Users with roles" status="Healthy" />
        <MetricCard label="Pending invitations" value={String(invitations.filter((invite) => invite.status === "Pending").length)} detail="Invitation records only" status="Pending" />
        <MetricCard label="Access conflicts" value={String(conflicts.length)} detail={`${selectedTeam.name} selected`} status={conflicts.length ? "Warning" : "Healthy"} />
      </div>

      <Card className="team-workspace">
        <aside className="team-list-panel">
          <div className="team-panel-heading">
            <h3>Teams</h3>
            <p className="muted">Select a team to review access, limits and ownership.</p>
          </div>
          <input className="field" value={teamQuery} onChange={(event) => setTeamQuery(event.target.value)} placeholder="Search teams..." aria-label="Search teams" />
          <div className="team-list">
            {filteredTeams.map((team) => (
              <button className={`team-list-item ${team.id === selectedTeam.id ? "active" : ""}`} type="button" key={team.id} onClick={() => setSelectedTeamId(team.id)}>
                <span><strong>{team.name}</strong><small>{team.owner} - {team.users} users</small></span>
                <StatusBadge value={team.risk} />
              </button>
            ))}
            {!filteredTeams.length ? <div className="empty-state">No teams match this search.</div> : null}
          </div>
        </aside>
        <section className="team-detail-panel">
          <div className="team-detail-header">
            <div>
              <h3>{selectedTeam.name}</h3>
              <p className="muted">Owner: {selectedTeam.owner}. Governance owner: {selectedTeam.governanceOwner ?? selectedTeam.owner}.</p>
            </div>
            <StatusBadge value={selectedTeam.risk} />
          </div>
          <p className="team-summary">{summary}</p>
          <div className="tabs team-tabs">{tabs.map((tab) => <button className={`tab ${activeTab === tab ? "active" : ""}`} type="button" key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</div>

          {activeTab === "Overview" ? <div className="team-overview-list"><Detail label="Workspaces" value={selectedApps.map((app) => app.name).join(", ") || "None"} /><Detail label="Model access" value={grants.models.join(", ") || "None"} /><Detail label="Knowledge access" value={grants.knowledge.join(", ") || "None"} /><Detail label="Governed agents" value={grants.agents.join(", ") || "None"} /><Detail label="Evidence owner" value={selectedTeam.governanceOwner ?? selectedTeam.owner} /></div> : null}

          {activeTab === "Members" ? <div className="table-wrap" style={{ marginTop: 16 }}><table><thead><tr><th>User</th><th>Role</th><th>Clearance</th><th>Limit</th><th>Usage</th><th>Action</th></tr></thead><tbody>{members.map((member) => <tr key={member.id}><td><strong>{member.name}</strong><br /><span className="muted">{member.email}</span></td><td>{member.role}</td><td>{member.clearance}</td><td>{formatNumber(member.tokenLimit)}</td><td><Progress value={percent(member.tokensUsed, member.tokenLimit)} /></td><td><button className="button secondary" type="button" onClick={() => {
            const next = Number(window.prompt("New monthly token sub-limit", String(member.tokenLimit)));
            if (!Number.isNaN(next)) setBudgetMessage(updateUserLimit(member.id, next).message);
          }}>Edit limit</button></td></tr>)}</tbody></table></div> : null}

          {activeTab === "Access" ? <div className="team-access-list"><AccessList title="Models" items={grants.models} onManage={() => openAccessManager({ teamId: selectedTeam.id, tab: "models" })} /><AccessList title="Knowledge bases" items={grants.knowledge} onManage={() => openAccessManager({ teamId: selectedTeam.id, tab: "knowledge" })} /><AccessList title="Governed agents" items={grants.agents} onManage={() => openAccessManager({ teamId: selectedTeam.id, tab: "agents" })} /></div> : null}

          {activeTab === "Budgets & limits" ? <div style={{ marginTop: 16 }}><div className="mini-bars"><div className="mini-bar"><span>Tokens</span><Progress value={percent(selectedTeam.tokensUsed, selectedTeam.tokenBudget)} /><span>{formatNumber(selectedTeam.tokensUsed)} / {formatNumber(selectedTeam.tokenBudget)}</span></div><div className="mini-bar"><span>Spend</span><Progress value={percent(selectedTeam.spendUsedAed, selectedTeam.spendBudgetAed)} /><span>{aed(selectedTeam.spendUsedAed)} / {aed(selectedTeam.spendBudgetAed)}</span></div></div><p className="muted">Hard limit blocks new requests until the limit resets or is increased.</p><button className="button" type="button" onClick={() => setBudgetOpen(true)}>Edit budgets</button></div> : null}

          {conflicts.length ? <div className="callout" style={{ marginTop: 16 }}>{conflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}</div> : null}
          {budgetMessage ? <div className="callout" style={{ marginTop: 16 }}>{budgetMessage}</div> : null}
        </section>
      </Card>

      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Invitation records</h3><p className="muted">Invitation records are stored in this browser session; email delivery needs backend integration.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Email</th><th>Team</th><th>Role</th><th>Status</th><th>Expires</th><th>Action</th></tr></thead><tbody>{invitations.map((invite) => <tr key={invite.id}><td>{invite.email}</td><td>{teams.find((team) => team.id === invite.teamId)?.name}</td><td>{invite.role}</td><td><StatusBadge value={invite.status} /></td><td>{invite.expiresIn}</td><td><button className="button secondary" type="button" onClick={() => revokeInvitation(invite.id)} disabled={invite.status === "Revoked"}>Revoke</button></td></tr>)}</tbody></table></div>
      </Card>

      {inviteOpen ? <div className="modal-backdrop" role="presentation"><section className="modal" role="dialog" aria-modal="true"><div className="modal-header"><div><p className="eyebrow">Invite member</p><h3>Add a user to {selectedTeam.name}</h3><p className="muted">Creates a local invitation record and inherited access summary.</p></div><button className="button secondary" type="button" onClick={() => setInviteOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Email</span><input className="field" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} /></label><label className="field-group"><span className="metric-label">Team</span><select className="field" value={selectedTeamId} onChange={(event) => setSelectedTeamId(event.target.value)}>{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select></label><label className="field-group"><span className="metric-label">Role</span><select className="field" value={inviteRole} onChange={(event) => setInviteRole(event.target.value as "Member" | "Team Admin" | "Viewer")}><option>Member</option><option>Team Admin</option><option>Viewer</option></select></label><Detail label="Inherited access" value={summary} /></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setInviteOpen(false)}>Cancel</button><button className="button" type="button" onClick={submitInvite}>Create invitation</button></div></section></div> : null}

      {budgetOpen ? <div className="modal-backdrop" role="presentation"><form className="modal" onSubmit={(event) => { event.preventDefault(); saveBudget(new FormData(event.currentTarget)); }}><div className="modal-header"><div><p className="eyebrow">Budgets & limits</p><h3>{selectedTeam.name}</h3><p className="muted">Hard limit blocks new requests when reached.</p></div><button className="button secondary" type="button" onClick={() => setBudgetOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Monthly token limit</span><input className="field" name="tokens" type="number" defaultValue={selectedTeam.tokenBudget} /></label><label className="field-group"><span className="metric-label">Monthly spend limit AED</span><input className="field" name="spend" type="number" defaultValue={selectedTeam.spendBudgetAed} /></label><label className="check-row"><input name="hardLimit" type="checkbox" defaultChecked={selectedTeam.hardLimit} /> Hard limit</label></div></div><div className="modal-footer"><button className="button secondary" type="button" onClick={() => setBudgetOpen(false)}>Cancel</button><button className="button" type="submit">Save limits</button></div></form></div> : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}

function AccessList({ title, items, onManage }: { title: string; items: (string | undefined)[]; onManage: () => void }) {
  return <div className="team-access-item"><div><h3>{title}</h3><p>{items.length ? items.join(", ") : "No grants"}</p></div><button className="button secondary" type="button" onClick={onManage}>Manage</button></div>;
}
