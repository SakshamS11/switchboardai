"use client";

import { use, useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { organization } from "@/lib/mock-data";
import { formatNumber, percent } from "@/lib/utils";

type Message = {
  role: "employee" | "assistant";
  text: string;
};

export default function WorkspacePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { applications, simulateAction, teams, teamMembers, accessState, modelCatalog, knowledgeBases, governedAgents } = useAppState();
  const workspace = applications.find((item) => item.id === id);
  const [draft, setDraft] = useState("Summarise the policy for this customer request.");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Welcome. I can answer using only the models and knowledge approved for this workspace." }
  ]);

  const team = teams.find((item) => item.name === workspace?.team);
  const mockUser = teamMembers.find((member) => member.teamId === team?.id) ?? teamMembers[0];
  const effectiveModels = useMemo(() => {
    if (!workspace || !team) return [];
    const granted = accessState.modelGrants[team.id] ?? [];
    return workspace.allowedModels.map((name) => modelCatalog.find((model) => model.name === name)).filter((model) => model && granted.includes(model.id) && (model.status === "Running" || model.status === "Connected"));
  }, [accessState.modelGrants, modelCatalog, team, workspace]);
  const effectiveKnowledge = useMemo(() => {
    if (!workspace || !team || !mockUser) return [];
    const granted = accessState.knowledgeGrants[team.id] ?? [];
    const rank = ["General", "Internal", "Confidential", "Restricted"];
    return workspace.knowledgeBases.map((name) => knowledgeBases.find((kb) => kb.name === name)).filter((kb) => kb && granted.includes(kb.id) && kb.status === "Indexed" && rank.indexOf(mockUser.clearance) >= rank.indexOf(kb.sensitivity));
  }, [accessState.knowledgeGrants, knowledgeBases, mockUser, team, workspace]);
  const effectiveAgents = useMemo(() => {
    if (!workspace || !team) return [];
    const granted = accessState.agentGrants[team.id] ?? [];
    return workspace.agents.map((name) => governedAgents.find((agent) => agent.name === name)).filter((agent) => agent && granted.includes(agent.id) && agent.status === "Active" && agent.killSwitch !== "Armed");
  }, [accessState.agentGrants, governedAgents, team, workspace]);
  const [model, setModel] = useState("");
  const [agent, setAgent] = useState("Workspace assistant");

  const routeStatus = useMemo(() => {
    if (!workspace) return "Unavailable";
    return workspace.externalModelRule === "Blocked" ? "Local route only" : "Policy controlled route";
  }, [workspace]);

  if (!workspace) return <div className="page"><Card pad><h2>Workspace preview unavailable</h2><p className="muted">Return to AI Workspaces and select an active workspace.</p></Card></div>;
  const workspaceName = workspace.name;
  const primaryKnowledgeBase = effectiveKnowledge[0]?.name ?? "approved workspace knowledge";
  const activeModel = model || effectiveModels[0]?.name || "No approved model";
  const activeAgent = agent || effectiveAgents[0]?.name || "Workspace assistant";

  function sendMessage() {
    if (!draft.trim()) return;
    const employeeText = draft.trim();
    setMessages((current) => [...current, { role: "employee", text: employeeText }]);
    setDraft("");
    setLoading(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: `Based on ${primaryKnowledgeBase}, the request should follow the workspace policy. Source: ${primaryKnowledgeBase} / Section 4.2. Model: ${activeModel}. Agent: ${activeAgent}. Route: ${routeStatus}.` }]);
      setLoading(false);
      simulateAction("Employee preview response generated", workspaceName, "Workspace");
    }, 800);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Employee Preview" title={workspace.name} description="Preview the governed employee workspace exactly as an employee would experience it." action={<ButtonLink href={`/dashboard/applications/${workspace.id}`} secondary>Back to management</ButtonLink>} />
      <section className="employee-preview-shell">
        <aside className="employee-sidebar">
          <h3>{organization.name}</h3>
          <p className="muted">Signed in as {mockUser?.email ?? "employee@acme.ai"} · {team?.name ?? workspace.team}</p>
          <label className="field-group"><span className="metric-label">Approved model</span><select className="field" value={activeModel} onChange={(event) => setModel(event.target.value)}>{effectiveModels.length ? effectiveModels.map((item) => <option key={item!.id}>{item!.name}</option>) : <option>No approved model</option>}</select></label>
          <label className="field-group"><span className="metric-label">Governed agent</span><select className="field" value={activeAgent} onChange={(event) => setAgent(event.target.value)}>{effectiveAgents.length ? effectiveAgents.map((item) => <option key={item!.id}>{item!.name}</option>) : <option>Workspace assistant</option>}</select></label>
          <div>
            <div className="row"><span className="metric-label">Monthly allowance</span><strong>{percent(workspace.tokensUsed, workspace.tokenBudget)}%</strong></div>
            <Progress value={percent(workspace.tokensUsed, workspace.tokenBudget)} />
            <p className="muted">{formatNumber(workspace.tokenBudget - workspace.tokensUsed)} tokens remaining</p>
          </div>
          <StatusBadge value={routeStatus} />
        </aside>
        <Card className="employee-chat">
          <div className="card-header">
            <div>
              <h3>{workspace.name}</h3>
              <p className="muted">Knowledge: {effectiveKnowledge.map((kb) => kb!.name).join(", ") || "No authorised source"}</p>
            </div>
            <StatusBadge value={workspace.status} />
          </div>
          <div className="conversation" aria-live="polite">
            {messages.map((message, index) => <div className={`message ${message.role}`} key={`${message.role}-${index}`}><strong>{message.role === "employee" ? "You" : "Switchboard"}</strong><p>{message.text}</p></div>)}
            {loading ? <div className="message assistant"><strong>Switchboard</strong><p>Checking approved knowledge and route policy...</p></div> : null}
          </div>
          <div className="composer">
            <input className="field" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") sendMessage(); }} placeholder="Ask using approved workspace knowledge..." />
            <button className="button" type="button" onClick={sendMessage} disabled={loading}>{loading ? "Sending" : "Send"}</button>
          </div>
        </Card>
      </section>
    </div>
  );
}
