import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { infrastructureTargets } from "@/lib/mock-data";

const stacks = [
  { name: "Private AI Basic - Ollama", purpose: "Starter local model serving for smaller internal workloads.", scale: "Single small GPU server", services: "Ollama, Qdrant, Postgres", version: "v0.1", requirements: "8 vCPU, 32GB RAM, 16GB VRAM", status: "Deployable" },
  { name: "Private AI Production - vLLM", purpose: "Production local model serving for high-throughput workspaces.", scale: "GPU server or small GPU fleet", services: "vLLM, LiteLLM, Qdrant, Postgres", version: "v0.2", requirements: "16 vCPU, 64GB RAM, 24GB+ VRAM", status: "Running" },
  { name: "Private RAG Stack", purpose: "Private retrieval over approved team knowledge sources.", scale: "Team or department workload", services: "Qdrant, embeddings worker, gateway, Postgres", version: "v0.2", requirements: "8 vCPU, 32GB RAM", status: "Running" },
  { name: "Developer AI Stack", purpose: "Engineering coding assistant backed by local and approved external models.", scale: "Engineering teams", services: "Ollama, DeepSeek runtime, gateway", version: "v0.1", requirements: "GPU server, 16GB+ VRAM", status: "Running" },
  { name: "Secure Local-Only Stack", purpose: "Restricted data workflows with no external model fallback.", scale: "Legal, Claims, Finance", services: "vLLM, Qdrant, audit collector", version: "v0.2", requirements: "24GB+ VRAM", status: "Deployable" },
  { name: "Governed Chat Workspace", purpose: "Employee chat interface generated when an AI Workspace is published.", scale: "One instance per workspace", services: "AnythingLLM, Nginx, SSL", version: "Auto", requirements: "1 vCPU, 1GB RAM per workspace", status: "Automatic" }
];

export default function StacksPage() {
  const onlineServers = infrastructureTargets.filter((target) => target.agent === "Online");
  return (
    <div className="page">
      <PageHeader eyebrow="Infrastructure" title="Stacks" description="Deploy approved private AI stack templates to online servers." />
      <div className="grid kpis">
        <Card pad><span className="metric-label">Templates</span><div className="metric-value">{stacks.length}</div><p className="muted">Manual-defined stack catalog</p></Card>
        <Card pad><span className="metric-label">Online servers</span><div className="metric-value">{onlineServers.length}</div><p className="muted">Available deployment targets</p></Card>
        <Card pad><span className="metric-label">Running stacks</span><div className="metric-value">{stacks.filter((stack) => stack.status === "Running").length}</div><p className="muted">Current demo estate</p></Card>
        <Card pad><span className="metric-label">Automatic stack</span><div className="metric-value">1</div><p className="muted">Generated during workspace publish</p></Card>
      </div>
      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Stack catalog</h3><p className="muted">Governed Chat Workspace is generated automatically and is not manually deployable.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Stack</th><th>Purpose</th><th>Scale</th><th>Services</th><th>Version</th><th>Requirements</th><th>Status</th><th>Action</th></tr></thead><tbody>{stacks.map((stack) => <tr key={stack.name}><td><strong>{stack.name}</strong></td><td>{stack.purpose}</td><td>{stack.scale}</td><td>{stack.services}</td><td>{stack.version}</td><td>{stack.requirements}</td><td><StatusBadge value={stack.status} /></td><td><button className="button secondary" disabled={stack.status === "Automatic"}>{stack.status === "Automatic" ? "Auto generated" : "Deploy stack"}</button></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
