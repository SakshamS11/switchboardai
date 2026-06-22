"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, StatusBadge } from "@/components/ui";
import type { InfrastructureTarget, StackTemplate } from "@/lib/types";

export default function StacksPage() {
  const { servers, stackTemplates, stackDeployments, deployStack } = useAppState();
  const [tab, setTab] = useState<"Deployments" | "Stack catalogue">("Deployments");
  const [deployOpen, setDeployOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(stackTemplates.find((item) => !item.automatic)?.id ?? "");
  const [selectedServer, setSelectedServer] = useState(servers.find((server) => server.agent === "Online")?.id ?? "");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const server = params.get("server");
    if (server && servers.some((item) => item.id === server)) {
      setSelectedServer(server);
      setDeployOpen(true);
    }
  }, [servers]);

  const template = stackTemplates.find((item) => item.id === selectedTemplate);
  const server = servers.find((item) => item.id === selectedServer);
  const compatibility = useMemo(() => checkCompatibility(template, server), [server, template]);

  function submitDeployment() {
    const result = deployStack(selectedTemplate, selectedServer);
    setMessage(result.message);
    if (result.ok) {
      setTab("Deployments");
      window.setTimeout(() => setDeployOpen(false), 900);
    }
  }

  return (
    <div className="page stacks-page">
      <header className="overview-header">
        <div>
          <p className="eyebrow">INFRASTRUCTURE</p>
          <h2>Stacks</h2>
          <p className="muted">Deploy and operate approved AI runtime templates on connected servers.</p>
        </div>
        <button className="button" type="button" onClick={() => { setMessage(""); setDeployOpen(true); }}>Deploy stack</button>
      </header>

      <div className="tabs">
        {(["Deployments", "Stack catalogue"] as const).map((item) => <button key={item} className={`tab ${tab === item ? "active" : ""}`} type="button" onClick={() => setTab(item)}>{item}</button>)}
      </div>

      {tab === "Deployments" ? (
        <Card>
          <div className="card-header"><div><h3>Deployments</h3><p className="muted">Running and in-progress stack instances.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Deployment</th><th>Template</th><th>Server</th><th>Version</th><th>Services</th><th>Health</th><th>Updated</th><th>Action</th></tr></thead><tbody>
            {stackDeployments.map((deployment) => {
              const deploymentTemplate = stackTemplates.find((item) => item.id === deployment.templateId);
              const deploymentServer = servers.find((item) => item.id === deployment.serverId);
              return <tr key={deployment.id}><td><strong>{deployment.name}</strong><br /><StatusBadge value={deployment.status} /></td><td>{deploymentTemplate?.name ?? deployment.templateId}</td><td>{deploymentServer ? <Link className="table-action" href={`/dashboard/infrastructure/${deploymentServer.id}`}>{deploymentServer.name}</Link> : "Unknown"}</td><td>{deployment.version}</td><td>{deployment.services.join(", ")}</td><td><StatusBadge value={deployment.health} /></td><td>{deployment.updated}</td><td><button className="button secondary" type="button" onClick={() => { setSelectedTemplate(deployment.templateId); setSelectedServer(deployment.serverId); setDeployOpen(true); }}>{deployment.status === "Failed" ? "Retry deployment" : deployment.health === "Warning" ? "Upgrade available" : "View deployment"}</button></td></tr>;
            })}
          </tbody></table></div>
        </Card>
      ) : null}

      {tab === "Stack catalogue" ? (
        <section className="stack-catalogue">
          {stackTemplates.map((item) => (
            <Card pad key={item.id} className="stack-template-card">
              <div className="row"><h3>{item.name}</h3>{item.automatic ? <StatusBadge value="Automatic" /> : <StatusBadge value="Deployable" />}</div>
              <p className="muted">{item.bestUse}</p>
              <div className="detail-grid">
                <Detail label="Core services" value={item.services.join(", ")} />
                <Detail label="Minimum requirements" value={item.requirements} />
                <Detail label="Compatibility" value={item.compatibility.join(", ")} />
              </div>
              {item.automatic ? <div className="callout">Automatically provisioned when an AI Workspace is published.</div> : <button className="button" type="button" onClick={() => { setSelectedTemplate(item.id); setMessage(""); setDeployOpen(true); }}>Deploy stack</button>}
            </Card>
          ))}
        </section>
      ) : null}

      {deployOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="deploy-stack-title">
            <div className="modal-header"><div><p className="eyebrow">Deploy stack</p><h3 id="deploy-stack-title">Deploy approved runtime template</h3><p className="muted">Select a template and online server before confirming deployment.</p></div><button className="button secondary" type="button" onClick={() => setDeployOpen(false)}>Close</button></div>
            <div className="modal-body">
              <div className="form-grid">
                <label className="field-group"><span className="metric-label">Stack template</span><select className="field" value={selectedTemplate} onChange={(event) => setSelectedTemplate(event.target.value)}>{stackTemplates.filter((item) => !item.automatic).map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
                <label className="field-group"><span className="metric-label">Online server</span><select className="field" value={selectedServer} onChange={(event) => setSelectedServer(event.target.value)}>{servers.map((item) => <option value={item.id} key={item.id}>{item.name} - {item.agent}</option>)}</select></label>
              </div>
              <div className="detail-grid">
                <Detail label="Compatibility check" value={compatibility.ok ? "Compatible" : compatibility.reason} />
                <Detail label="Template requirement" value={template?.requirements ?? "Select a template"} />
                <Detail label="Server capacity" value={server ? `${server.gpu} · ${server.vramTotal}GB VRAM · ${server.agent}` : "Select a server"} />
              </div>
              {message ? <div className="callout" aria-live="polite">{message}</div> : null}
            </div>
            <div className="modal-footer"><button className="button secondary" type="button" onClick={() => setDeployOpen(false)}>Cancel</button><button className="button" type="button" disabled={!compatibility.ok} onClick={submitDeployment}>Confirm deployment</button>{message.includes("queued") ? <Link className="button secondary" href="/dashboard/model-catalog">Register a model</Link> : null}</div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function checkCompatibility(template: StackTemplate | undefined, server: InfrastructureTarget | undefined) {
  if (!template || !server) return { ok: false, reason: "Select a template and server." };
  if (server.agent !== "Online") return { ok: false, reason: "Server agent must be online." };
  if (template.minVramGb > server.vramTotal) return { ok: false, reason: `Requires ${template.minVramGb}GB VRAM; server has ${server.vramTotal}GB.` };
  if (!template.compatibility.includes(server.type)) return { ok: false, reason: "Template incompatible with server type." };
  return { ok: true, reason: "Compatible" };
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
