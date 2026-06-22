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
  const { applications, simulateAction } = useAppState();
  const workspace = applications.find((item) => item.id === id);
  const [model, setModel] = useState(workspace?.allowedModels[0] ?? "");
  const [agent, setAgent] = useState(workspace?.agents[0] ?? "Workspace assistant");
  const [draft, setDraft] = useState("Summarise the policy for this customer request.");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: "Welcome. I can answer using only the models and knowledge approved for this workspace." }
  ]);

  const routeStatus = useMemo(() => {
    if (!workspace) return "Unavailable";
    return workspace.externalModelRule === "Blocked" ? "Local route only" : "Policy controlled route";
  }, [workspace]);

  if (!workspace) return <div className="page"><Card pad><h2>Workspace preview unavailable</h2><p className="muted">Return to AI Workspaces and select an active workspace.</p></Card></div>;

  function sendMessage() {
    if (!draft.trim()) return;
    const employeeText = draft.trim();
    setMessages((current) => [...current, { role: "employee", text: employeeText }]);
    setDraft("");
    setLoading(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: `Based on ${workspace.knowledgeBases[0] ?? "the approved knowledge base"}, the request should follow the workspace policy. Source: ${workspace.knowledgeBases[0] ?? "Approved source"} / Section 4.2. Route: ${routeStatus}.` }]);
      setLoading(false);
      simulateAction("Employee preview response generated", workspace.name, "Workspace");
    }, 800);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Employee Preview" title={workspace.name} description="Preview the governed employee workspace exactly as an employee would experience it." action={<ButtonLink href={`/dashboard/applications/${workspace.id}`} secondary>Back to management</ButtonLink>} />
      <section className="employee-preview-shell">
        <aside className="employee-sidebar">
          <h3>{organization.name}</h3>
          <p className="muted">Signed in with company SSO</p>
          <label className="field-group"><span className="metric-label">Approved model</span><select className="field" value={model} onChange={(event) => setModel(event.target.value)}>{workspace.allowedModels.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-group"><span className="metric-label">Governed agent</span><select className="field" value={agent} onChange={(event) => setAgent(event.target.value)}>{(workspace.agents.length ? workspace.agents : ["Workspace assistant"]).map((item) => <option key={item}>{item}</option>)}</select></label>
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
              <p className="muted">Knowledge: {workspace.knowledgeBases.join(", ") || "No source assigned"}</p>
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
