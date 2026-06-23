"use client";

import Link from "next/link";
import { use, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppState } from "@/components/app-state";
import { Card, StatusBadge } from "@/components/ui";

const telemetry = [
  { time: "09:00", CPU: 38, RAM: 54, GPU: 68, VRAM: 61 },
  { time: "10:00", CPU: 42, RAM: 58, GPU: 73, VRAM: 66 },
  { time: "11:00", CPU: 46, RAM: 61, GPU: 82, VRAM: 78 },
  { time: "12:00", CPU: 48, RAM: 64, GPU: 92, VRAM: 88 },
  { time: "13:00", CPU: 41, RAM: 59, GPU: 86, VRAM: 81 }
];

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { servers, incidents, applications, stackDeployments, restartServerAgent, recordAudit } = useAppState();
  const [metric, setMetric] = useState<"CPU" | "RAM" | "GPU" | "VRAM">("GPU");
  const [actionMessage, setActionMessage] = useState("");
  const server = servers.find((item) => item.id === id);
  if (!server) return <div className="page"><Card pad><h2>Server not found</h2><p className="muted">Return to Servers and select an active server.</p><Link className="button secondary" href="/dashboard/infrastructure">Back to servers</Link></Card></div>;
  const relatedIncidents = incidents.filter((incident) => incident.serverId === server.id && incident.status !== "Resolved");
  const relatedApps = applications.filter((app) => app.targetServerId === server.id);
  const deployments = stackDeployments.filter((deployment) => deployment.serverId === server.id);
  const services = deployments[0]?.services ?? ["Agent"];

  function restart() {
    if (!server) return;
    if (window.confirm(`Restart the agent on ${server.name}? Telemetry may pause briefly.`)) {
      setActionMessage(`Restart requested for ${server.name}. Agent state will update when the local workflow completes.`);
      restartServerAgent(server.id);
    }
  }

  function fetchLogs() {
    if (!server) return;
    setActionMessage(`Log request queued for ${server.name}. Backend log streaming is required for live log output.`);
    recordAudit("Fetched server logs", server.name, "Infrastructure");
  }

  return (
    <div className="page server-detail-page">
      <header className="overview-header">
        <div>
          <p className="eyebrow">SERVER DETAIL</p>
          <h2>{server.name}</h2>
          <p className="muted">{server.type} - {server.region} - last heartbeat {server.heartbeat}</p>
        </div>
        <div className="overview-header-actions"><StatusBadge value={server.status} /><Link className="button secondary" href="/dashboard/infrastructure">Back to servers</Link></div>
      </header>

      <section className="estate-kpi-grid">
        <Metric label="Agent state" value={server.agent} detail={server.heartbeat} />
        <Metric label="Active stack" value={server.stack} detail="Current runtime" />
        <Metric label="GPU utilisation" value={`${server.gpuLoad}%`} detail={server.gpu} />
        <Metric label="Related incidents" value={String(relatedIncidents.length)} detail="Unresolved incident links" />
      </section>

      <section className="overview-trend-grid">
        <Card pad className="chart-card">
          <div className="chart-card-header">
            <div><h3>Telemetry</h3><p className="muted">Selectable CPU, RAM, GPU and VRAM trend.</p></div>
            <select className="field compact-field" value={metric} onChange={(event) => setMetric(event.target.value as typeof metric)}><option>CPU</option><option>RAM</option><option>GPU</option><option>VRAM</option></select>
          </div>
          <div className="overview-chart" role="img" aria-label={`${metric} telemetry trend for ${server.name}.`}>
            <ResponsiveContainer width="100%" height="100%"><LineChart data={telemetry}><CartesianGrid stroke="#eef2f7" vertical={false} /><XAxis dataKey="time" /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} /><Tooltip formatter={(value: unknown) => `${value}%`} /><Line type="monotone" dataKey={metric} stroke="#5B3DFF" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <div className="card-header"><div><h3>Actions</h3><p className="muted">Disruptive actions require confirmation.</p></div></div>
          <div className="exception-list">
            <Link className="exception-row" href={`/dashboard/stacks?server=${server.id}`}><div><strong>Deploy stack</strong><span>Select an approved runtime template.</span></div><span className="table-action">Open</span></Link>
            <button className="exception-row button-row" type="button" onClick={restart}><div><strong>Restart agent</strong><span>Temporarily pauses telemetry.</span></div><span className="table-action">Restart</span></button>
            <button className="exception-row button-row" type="button" onClick={fetchLogs}><div><strong>Get logs</strong><span>Records a log retrieval request.</span></div><span className="table-action">Fetch</span></button>
            <button className="exception-row button-row" type="button" onClick={() => window.confirm(`Roll back latest deployment on ${server.name}?`) && recordAudit("Rolled back deployment", server.name, "Deployment")}><div><strong>Roll back deployment</strong><span>Available for previous stack versions.</span></div><span className="table-action">Roll back</span></button>
          </div>
          {actionMessage ? <div className="callout" role="status" style={{ marginTop: 14 }}>{actionMessage}</div> : null}
        </Card>
      </section>

      <section className="overview-driver-grid">
        <Card>
          <div className="card-header"><div><h3>Services</h3><p className="muted">Runtime services reported by the active stack.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Service</th><th>Port</th><th>State</th><th>Version</th><th>Last checked</th></tr></thead><tbody>{services.map((service, index) => <tr key={service}><td><strong>{service}</strong></td><td>{8000 + index}</td><td><StatusBadge value={server.agent === "Online" ? "Running" : "Offline"} /></td><td>v0.{index + 1}</td><td>{server.heartbeat}</td></tr>)}</tbody></table></div>
        </Card>
        <Card>
          <div className="card-header"><div><h3>Related resources</h3><p className="muted">Incidents, deployments and workspaces connected to this server.</p></div></div>
          <div className="exception-list">
            {relatedIncidents.map((incident) => <Link className="exception-row" href={`/dashboard/operations?incident=${incident.id}`} key={incident.id}><div><strong>{incident.title}</strong><span>{incident.status}</span></div><StatusBadge value={incident.severity} /></Link>)}
            {deployments.map((deployment) => <Link className="exception-row" href="/dashboard/stacks" key={deployment.id}><div><strong>{deployment.name}</strong><span>{deployment.status} - {deployment.updated}</span></div><StatusBadge value={deployment.health} /></Link>)}
            {relatedApps.map((app) => <Link className="exception-row" href={`/dashboard/applications/${app.id}`} key={app.id}><div><strong>{app.name}</strong><span>{app.status}</span></div><StatusBadge value={app.status} /></Link>)}
          </div>
        </Card>
      </section>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card pad><span className="metric-label">{label}</span><div className="metric-value">{value}</div><p className="muted">{detail}</p></Card>;
}
