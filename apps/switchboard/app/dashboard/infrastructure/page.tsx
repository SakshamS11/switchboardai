"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, MetricCard, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets as seedTargets } from "@/lib/mock-data";

export default function InfrastructurePage() {
  const { simulateAction } = useAppState();
  const [targets, setTargets] = useState(seedTargets);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [serverName, setServerName] = useState("Finance GPU Node");
  const [serverType, setServerType] = useState("On-prem GPU");
  const [region, setRegion] = useState("Dubai Office");
  const [installCommand, setInstallCommand] = useState("");
  const online = targets.filter((target) => target.agent === "Online").length;
  const pressure = targets.filter((target) => target.gpuLoad >= 85).length;
  const command = useMemo(() => `curl -fsSL https://agent.switchboard.ai/install.sh | sudo bash -s -- --server "${serverName}" --region "${region}" --token sb_agent_••••`, [serverName, region]);

  function generateCommand() {
    setInstallCommand(command);
    simulateAction("Generated server agent install command", serverName, "Infrastructure");
  }

  function simulateConnection() {
    setTargets((current) => [...current, { id: `server-${Date.now()}`, name: serverName, type: serverType, region, status: "Healthy", agent: "Online", stack: "Unassigned", gpu: "Detected after agent connection", gpuLoad: 12, vramUsed: 2, vramTotal: 24, heartbeat: "just now" }]);
    simulateAction("Connected server agent", serverName, "Infrastructure");
    setRegisterOpen(false);
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Infrastructure" title="Servers" description="Customer-owned servers, agents, GPU capacity, health and stack readiness." action={<button className="button" type="button" onClick={() => setRegisterOpen(true)}>Add Server</button>} />
      <div className="grid kpis">
        <MetricCard label="Agent connectivity" value={`${online}/${targets.length}`} detail="Online agents" status={online === targets.length ? "Healthy" : "Warning"} />
        <MetricCard label="GPU pressure" value={String(pressure)} detail="Servers above safe range" status={pressure ? "Warning" : "Healthy"} />
        <MetricCard label="Agent command mode" value="Allowlisted" detail="Typed commands only" status="Healthy" />
        <MetricCard label="Heartbeat" value="30 sec" detail="Telemetry cadence" status="Healthy" />
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Server fleet</h3><p className="muted">AI content stays on customer-owned infrastructure unless routing policy permits an external provider.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Server</th><th>Type</th><th>Region</th><th>Agent</th><th>Stack</th><th>GPU</th><th>Load</th><th>VRAM</th><th>Health</th><th>Action</th></tr></thead><tbody>{targets.map((target) => <tr key={target.id}><td><strong>{target.name}</strong><br /><span className="muted">{target.heartbeat}</span></td><td>{target.type}</td><td>{target.region}</td><td><StatusBadge value={target.agent} /></td><td>{target.stack}</td><td>{target.gpu}</td><td><Progress value={target.gpuLoad} /></td><td>{target.vramTotal ? `${target.vramUsed}/${target.vramTotal} GB` : "n/a"}</td><td><StatusBadge value={target.status} /></td><td><button className="button secondary" type="button" onClick={() => simulateAction(`Opened ${target.name} server detail`, target.name, "Infrastructure")}>View</button></td></tr>)}</tbody></table></div>
      </Card>
      {registerOpen ? <div className="modal-backdrop"><section className="modal"><div className="modal-header"><div><p className="eyebrow">Add Server</p><h3>Register a customer-owned server</h3><p className="muted">Generate a one-time agent command, then simulate the agent connecting.</p></div><button className="button secondary" onClick={() => setRegisterOpen(false)}>Close</button></div><div className="modal-body"><div className="form-grid"><label className="field-group"><span className="metric-label">Server name</span><input className="field" value={serverName} onChange={(event) => setServerName(event.target.value)} /></label><label className="field-group"><span className="metric-label">Type</span><select className="field" value={serverType} onChange={(event) => setServerType(event.target.value)}><option>On-prem GPU</option><option>Azure VM</option><option>AWS EC2</option><option>Workstation</option></select></label><label className="field-group"><span className="metric-label">Region</span><input className="field" value={region} onChange={(event) => setRegion(event.target.value)} /></label></div>{installCommand ? <pre className="callout">{installCommand}</pre> : null}</div><div className="modal-footer"><button className="button secondary" type="button" onClick={generateCommand}>Generate install command</button><button className="button" type="button" disabled={!installCommand} onClick={simulateConnection}>Simulate agent connection</button></div></section></div> : null}
    </div>
  );
}
