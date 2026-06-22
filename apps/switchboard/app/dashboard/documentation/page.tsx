"use client";

import { useMemo, useState } from "react";
import { Card, PageHeader } from "@/components/ui";

const topics = [
  "Product Overview",
  "Getting Started",
  "Servers",
  "Monitoring",
  "Stacks",
  "Models & Providers",
  "Routing Policies",
  "AI Workspaces",
  "Knowledge Bases",
  "Governed Agents",
  "Teams",
  "Audit Logs",
  "Compliance Readiness",
  "Resource Planner",
  "Cost & Capacity",
  "Settings",
  "Employee Chat Guide",
  "Common Workflows",
  "Glossary"
];

const copy: Record<string, string> = {
  "Product Overview": "Switchboard AI controls where AI runs, who can use it, what data it can retrieve, what it costs, and how actions are audited.",
  "Getting Started": "Create the organisation, register a server, deploy a stack, register models, connect knowledge, define routing, then publish an AI Workspace.",
  "AI Workspaces": "AI Workspaces are governed employee AI experiences. Each workspace has teams, models, knowledge bases, agents, routing policy, budget and a chat subdomain.",
  "Employee Chat Guide": "Employees use the workspace URL. They see company branding, approved models, available knowledge bases, governed agents and remaining usage."
};

export default function DocumentationPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("Product Overview");
  const visibleTopics = useMemo(() => topics.filter((topic) => topic.toLowerCase().includes(query.toLowerCase())), [query]);

  function downloadManual() {
    const content = `Switchboard AI User Manual\nVersion: Final 5585\n\n${topics.map((topic) => `# ${topic}\n${copy[topic] ?? "Operational guidance for this product area."}`).join("\n\n")}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "switchboard-ai-user-manual-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="System" title="Documentation" description="Product guidance for Switchboard AI administrators and workspace owners." action={<button className="button" type="button" onClick={downloadManual}>Download Complete Manual</button>} />
      <div className="control-panel">
        <Card pad>
          <label className="field-group"><span className="metric-label">Search documentation</span><input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics..." /></label>
          <div className="selector-list" style={{ marginTop: 14 }}>
            {visibleTopics.map((topic) => <button key={topic} type="button" className={`selector-item ${selected === topic ? "active" : ""}`} onClick={() => setSelected(topic)}>{topic}</button>)}
          </div>
        </Card>
        <Card pad>
          <p className="eyebrow">Manual version: Final 5585</p>
          <h3>{selected}</h3>
          <p className="muted">{copy[selected] ?? "This section explains the controls, expected workflow, and governance boundaries for this Switchboard AI product area."}</p>
          <div className="callout" style={{ marginTop: 16 }}>Switchboard AI stores operational, usage, health, cost and policy metadata. It does not receive conversation content.</div>
        </Card>
      </div>
    </div>
  );
}
