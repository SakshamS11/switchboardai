import { ActionButton } from "@/components/action-button";
import { Card, MetricCard, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets } from "@/lib/mock-data";

const deploymentBlocks = [
  { name: "AnythingLLM application runtime", fit: "One instance per AI Application", infra: "1 vCPU / 1 GB RAM", state: "Ready" },
  { name: "Model gateway", fit: "Policy, routing, budget, and audit enforcement", infra: "Customer server", state: "Ready" },
  { name: "Vector index", fit: "Knowledge retrieval boundary", infra: "Qdrant on customer infrastructure", state: "Ready" },
  { name: "Nginx and SSL", fit: "Employee subdomain exposure", infra: "Per application URL", state: "Ready" }
];

export default function InfrastructurePage() {
  const online = infrastructureTargets.filter((target) => target.agent === "Online").length;
  const pressure = infrastructureTargets.filter((target) => target.gpuLoad >= 85).length;
  return (
    <div className="page">
      <PageHeader eyebrow="Operate" title="Infrastructure" description="Customer-owned servers, agents, AI stacks, GPU capacity, and deployment readiness." action={<ActionButton action="Opened server registration flow" target="Infrastructure" type="Infrastructure">Register server</ActionButton>} />
      <div className="grid kpis">
        <MetricCard label="Agent connectivity" value={`${online}/${infrastructureTargets.length}`} detail="Online agents" status={online === infrastructureTargets.length ? "Healthy" : "Warning"} />
        <MetricCard label="GPU pressure" value={String(pressure)} detail="Targets above safe range" status={pressure ? "Warning" : "Healthy"} />
        <MetricCard label="Safe mode" value="Allowlisted" detail="Typed agent commands only" status="Healthy" />
        <MetricCard label="Heartbeat" value="30 sec" detail="Agent telemetry cadence" status="Healthy" />
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Infrastructure targets</h3><p className="muted">AI content stays on these customer-owned systems.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Server</th><th>Region</th><th>Agent</th><th>Stack</th><th>GPU</th><th>Load</th><th>VRAM</th><th>Health</th><th>Action</th></tr></thead><tbody>{infrastructureTargets.map((target) => <tr key={target.id}><td><strong>{target.name}</strong><br /><span className="muted">{target.type}</span></td><td>{target.region}</td><td><StatusBadge value={target.agent} /></td><td>{target.stack}</td><td>{target.gpu}</td><td><Progress value={target.gpuLoad} /></td><td>{target.vramTotal ? `${target.vramUsed}/${target.vramTotal} GB` : "n/a"}</td><td><StatusBadge value={target.status} /></td><td><ActionButton action={`Opened ${target.name} details`} target="Infrastructure" type="Infrastructure" secondary>View</ActionButton></td></tr>)}</tbody></table></div>
      </Card>
      <div className="grid four" style={{ marginTop: 18 }}>
        {deploymentBlocks.map((block) => <Card pad key={block.name}><div className="row"><h3>{block.name}</h3><StatusBadge value={block.state} /></div><p className="muted">{block.fit}</p><p><strong>{block.infra}</strong></p></Card>)}
      </div>
    </div>
  );
}
