"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppState } from "@/components/app-state";
import { Card, StatusBadge } from "@/components/ui";

export default function InfrastructurePage() {
  const { servers, incidents, addServer, restartServerAgent, recordAudit } = useAppState();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [serverName, setServerName] = useState("Finance GPU Node");
  const [serverType, setServerType] = useState("On-prem GPU");
  const [region, setRegion] = useState("Dubai Office");
  const [environment, setEnvironment] = useState("Production");
  const [commandGenerated, setCommandGenerated] = useState(false);
  const [connectionState, setConnectionState] = useState("Not checked");
  const [createdServerId, setCreatedServerId] = useState("");
  const [query, setQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");
  const [stackFilter, setStackFilter] = useState("All");
  const [agentFilter, setAgentFilter] = useState("All");
  const [actionMessage, setActionMessage] = useState("");

  const online = servers.filter((server) => server.agent === "Online").length;
  const attention = servers.filter((server) => deriveHealth(server).status !== "Healthy").length;
  const availableGpu = servers.reduce((sum, server) => sum + Math.max(0, server.vramTotal - server.vramUsed), 0);
  const installCommand = useMemo(() => `curl -fsSL https://agent.switchboard.ai/install.sh | sudo bash -s -- --server "${serverName}" --region "${region}" --environment "${environment}" --token sb_agent_********`, [environment, region, serverName]);

  const filteredServers = servers
    .filter((server) => !query || `${server.name} ${server.type} ${server.region} ${server.stack}`.toLowerCase().includes(query.toLowerCase()))
    .filter((server) => healthFilter === "All" || deriveHealth(server).status === healthFilter)
    .filter((server) => regionFilter === "All" || server.region === regionFilter)
    .filter((server) => stackFilter === "All" || server.stack === stackFilter)
    .filter((server) => agentFilter === "All" || server.agent === agentFilter);

  const regions = Array.from(new Set(servers.map((server) => server.region)));
  const stacks = Array.from(new Set(servers.map((server) => server.stack)));

  function generateCommand() {
    setCommandGenerated(true);
    setConnectionState("Waiting for agent");
  }

  function copyCommand() {
    navigator.clipboard?.writeText(installCommand);
    setConnectionState("Command copied. Waiting for agent heartbeat.");
    setActionMessage("Install command copied. Run it on the server, then check connection.");
    recordAudit("Copied server install command", serverName, "Infrastructure");
  }

  function fetchLogs(serverNameValue: string) {
    setActionMessage(`Log request queued for ${serverNameValue}. Results would stream here once backend log collection is connected.`);
    recordAudit("Fetched server logs", serverNameValue, "Infrastructure");
  }

  function confirmRestart(serverId: string, serverNameValue: string) {
    if (!window.confirm(`Restart the Switchboard agent on ${serverNameValue}? This updates local state and records an audit event for this browser session.`)) return;
    setActionMessage(`Restart requested for ${serverNameValue}. Agent state will update when the local workflow completes.`);
    restartServerAgent(serverId);
  }

  function checkConnection() {
    if (!serverName.trim() || !region.trim()) return;
    setConnectionState("Agent connected");
    const server = addServer({ name: serverName, type: serverType, region, environment });
    setCreatedServerId(server.id);
    setStep(3);
  }

  function closeModal() {
    setRegisterOpen(false);
    setStep(1);
    setCommandGenerated(false);
    setConnectionState("Not checked");
    setCreatedServerId("");
  }

  return (
    <div className="page fleet-page">
      <header className="overview-header">
        <div>
          <p className="eyebrow">INFRASTRUCTURE</p>
          <h2>Servers</h2>
          <p className="muted">Customer-owned infrastructure, agent connectivity and available AI capacity.</p>
        </div>
        <button className="button" type="button" onClick={() => setRegisterOpen(true)}>Add server</button>
      </header>

      <section className="estate-kpi-grid three">
        <Metric label="Servers online" value={`${online} of ${servers.length}`} detail="Agent-connected infrastructure" />
        <Metric label="Requiring attention" value={String(attention)} detail="Offline, stale or capacity constrained" />
        <Metric label="Available GPU capacity" value={`${availableGpu} GB`} detail="Unreserved VRAM across fleet" />
      </section>

      <section className="filter-toolbar">
        <input className="field" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search servers..." aria-label="Search servers" />
        <select className="field" value={healthFilter} onChange={(event) => setHealthFilter(event.target.value)} aria-label="Health filter"><option>All</option><option>Healthy</option><option>Warning</option><option>Offline</option></select>
        <select className="field" value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Region filter"><option>All</option>{regions.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="field" value={stackFilter} onChange={(event) => setStackFilter(event.target.value)} aria-label="Stack filter"><option>All</option>{stacks.map((item) => <option key={item}>{item}</option>)}</select>
        <select className="field" value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} aria-label="Agent state filter"><option>All</option><option>Online</option><option>Restarting</option><option>Offline</option><option>Waiting for agent</option><option>Failed</option></select>
      </section>

      {actionMessage ? <div className="callout" role="status">{actionMessage}</div> : null}

      <Card>
        <div className="card-header"><div><h3>Server fleet</h3><p className="muted">Rows open detail pages. Capacity combines GPU model, VRAM and current load.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Server</th><th>Runtime / stack</th><th>Capacity</th><th>Agent</th><th>Health</th><th>Last seen</th><th>Actions</th></tr></thead><tbody>
          {filteredServers.map((server) => {
            const health = deriveHealth(server);
            const relatedIncidents = incidents.filter((incident) => incident.serverId === server.id && incident.status !== "Resolved").length;
            return (
              <tr key={server.id} className="clickable-row">
                <td><Link href={`/dashboard/infrastructure/${server.id}`}><strong>{server.name}</strong><br /><span className="muted">{server.type} - {server.region}</span></Link></td>
                <td>{server.stack}</td>
                <td>{server.gpu} - {server.vramTotal ? `${server.vramUsed}/${server.vramTotal} GB VRAM` : "No GPU"} - {server.gpuLoad}% load</td>
                <td><StatusBadge value={server.agent} /></td>
                <td><StatusBadge value={health.status} /> <span className="muted">{health.reason}{relatedIncidents ? `; ${relatedIncidents} incident` : ""}</span></td>
                <td>{server.heartbeat}</td>
                <td><details className="row-menu"><summary>Actions</summary><div><Link href={`/dashboard/infrastructure/${server.id}`}>Open details</Link><Link href={`/dashboard/stacks?server=${server.id}`}>Deploy stack</Link><button type="button" onClick={() => fetchLogs(server.name)}>Get logs</button><button type="button" onClick={() => confirmRestart(server.id, server.name)}>Restart agent</button></div></details></td>
              </tr>
            );
          })}
        </tbody></table></div>
      </Card>

      {registerOpen ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal server-modal" role="dialog" aria-modal="true" aria-labelledby="add-server-title">
            <div className="modal-header"><div><p className="eyebrow">Add server</p><h3 id="add-server-title">Register customer-owned infrastructure</h3><p className="muted">Step {step} of 3</p></div><button className="button secondary" type="button" onClick={closeModal}>Close</button></div>
            <div className="modal-body">
              {step === 1 ? <div className="form-grid">
                <label className="field-group"><span className="metric-label">Server name</span><input className="field" value={serverName} onChange={(event) => setServerName(event.target.value)} required /></label>
                <label className="field-group"><span className="metric-label">Infrastructure type</span><select className="field" value={serverType} onChange={(event) => setServerType(event.target.value)}><option>On-prem GPU</option><option>Azure VM</option><option>AWS EC2</option><option>Workstation</option></select></label>
                <label className="field-group"><span className="metric-label">Region</span><input className="field" value={region} onChange={(event) => setRegion(event.target.value)} required /></label>
                <label className="field-group"><span className="metric-label">Environment label</span><select className="field" value={environment} onChange={(event) => setEnvironment(event.target.value)}><option>Production</option><option>Pilot</option><option>Development</option></select></label>
              </div> : null}
              {step === 2 ? <div className="stack">
                <div className="callout">Token expires in 15 minutes. Minimum requirements: Ubuntu 22.04, Docker, outbound HTTPS, and optional NVIDIA drivers.</div>
                {commandGenerated ? <pre className="code-block">{installCommand}</pre> : <div className="empty-state">Generate a one-time command for this server.</div>}
                <div className="row"><StatusBadge value={connectionState} /></div>
              </div> : null}
              {step === 3 ? <div className="stack" aria-live="polite">
                <StatusBadge value="Connected" />
                <div className="detail-grid"><Detail label="Agent version" value="1.4.0" /><Detail label="Operating system" value="Ubuntu 22.04 LTS" /><Detail label="GPU" value={serverType.includes("GPU") ? "Detected GPU, 24GB VRAM" : "Not detected"} /><Detail label="Heartbeat" value="just now" /><Detail label="Health" value="Healthy" /></div>
                <div className="callout">Server connected. Deploy an AI stack to begin serving local models.</div>
              </div> : null}
            </div>
            <div className="modal-footer">
              {step > 1 ? <button className="button secondary" type="button" onClick={() => setStep(step - 1)}>Back</button> : null}
              {step === 1 ? <button className="button" type="button" disabled={!serverName.trim() || !region.trim()} onClick={() => setStep(2)}>Continue</button> : null}
              {step === 2 ? <><button className="button secondary" type="button" onClick={generateCommand}>Generate command</button><button className="button secondary" type="button" disabled={!commandGenerated} onClick={copyCommand}>Copy command</button><button className="button" type="button" disabled={!commandGenerated} onClick={checkConnection}>Check connection</button></> : null}
              {step === 3 ? <><button className="button secondary" type="button" onClick={closeModal}>Done</button><Link className="button" href={`/dashboard/stacks?server=${createdServerId}`} onClick={closeModal}>Deploy an AI stack</Link></> : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function deriveHealth(server: { agent: string; heartbeat: string; gpuLoad: number; status: string }) {
  if (server.agent === "Offline") return { status: "Offline", reason: "Agent offline" };
  if (server.agent === "Restarting" || server.agent === "Waiting for agent") return { status: "Warning", reason: server.agent };
  if (server.gpuLoad >= 85) return { status: "Warning", reason: "GPU pressure" };
  return { status: "Healthy", reason: "No active blocker" };
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Card pad><span className="metric-label">{label}</span><div className="metric-value">{value}</div><p className="muted">{detail}</p></Card>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
