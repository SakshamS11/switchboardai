"use client";

import { use } from "react";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, StatusBadge } from "@/components/ui";

export default function WorkspacePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { applications } = useAppState();
  const workspace = applications.find((item) => item.id === id);
  if (!workspace) return <div className="page"><Card pad><h2>Workspace preview unavailable</h2><p className="muted">Return to AI Workspaces and select an active workspace.</p></Card></div>;
  return (
    <div className="page">
      <PageHeader eyebrow="Employee Preview" title={workspace.name} description="Preview of the governed employee chat experience. Employees see company branding and approved resources only." action={<ButtonLink href={`/dashboard/applications/${workspace.id}`} secondary>Back to management</ButtonLink>} />
      <section className="application-hero" style={{ marginBottom: 18 }}>
        <div className="row"><div><p className="eyebrow" style={{ color: "var(--brand-accent)" }}>Acme Corp AI Workspace</p><h2 style={{ margin: 0 }}>{workspace.url.replace("https://", "")}</h2><p>Approved models, knowledge bases and governed agents are controlled by Switchboard AI policy.</p></div><StatusBadge value={workspace.status} /></div>
      </section>
      <div className="grid three">
        <Card pad><h3>Approved models</h3><p className="muted">{workspace.allowedModels.join(", ")}</p></Card>
        <Card pad><h3>Knowledge bases</h3><p className="muted">{workspace.knowledgeBases.join(", ")}</p></Card>
        <Card pad><h3>Governed agents</h3><p className="muted">{workspace.agents.join(", ") || "None assigned"}</p></Card>
      </div>
      <Card pad style={{ marginTop: 18 }}>
        <div className="row"><h3>Conversation</h3><StatusBadge value="Policy controlled" /></div>
        <div className="callout" style={{ marginTop: 14 }}>Sample answer: The relevant policy is in the approved knowledge base. Citation: {workspace.knowledgeBases[0] ?? "Approved source"} / Section 4.2. External routing remains governed by the active workspace policy.</div>
      </Card>
    </div>
  );
}
