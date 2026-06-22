import { ActionButton } from "@/components/action-button";
import { ButtonLink, Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { modelCatalog } from "@/lib/mock-data";
import { aed } from "@/lib/utils";

const providerHealth = [
  { provider: "OpenAI", state: "Warning", note: "Elevated latency on GPT-4o. Use approved fallback for critical work.", action: "Review routing" },
  { provider: "Anthropic", state: "Connected", note: "Available for approved internal workloads.", action: "Review policy" },
  { provider: "Local vLLM", state: "Running", note: "Qwen and Falcon routes are available on customer infrastructure.", action: "Open telemetry" }
];

const routingGuidance = [
  { workload: "Legal restricted", route: "Qwen 32B Local first", boundary: "No external fallback" },
  { workload: "Claims confidential", route: "Qwen 32B Local / Falcon Local", boundary: "Customer infrastructure" },
  { workload: "Engineering internal", route: "DeepSeek Coder Local, then Claude by policy", boundary: "Internal only" },
  { workload: "Support general", route: "Falcon Local, GPT-4o by approval", boundary: "Metadata tracked" }
];

export default function ModelCatalogPage() {
  return (
    <div className="page">
      <PageHeader eyebrow="Control" title="Models & Providers" description="Govern local and external models, provider health, data boundaries, cost, and fallback eligibility." action={<ActionButton action="Opened add model flow" target="Models & Providers" type="Model">Add model</ActionButton>} />
      <div className="grid kpis">
        <MetricCard label="Catalog models" value={String(modelCatalog.length)} detail="Local and external" status="Healthy" />
        <MetricCard label="Local models" value={String(modelCatalog.filter((m) => m.hosting === "Customer server").length)} detail="Customer infrastructure" status="Healthy" />
        <MetricCard label="Provider issue" value="OpenAI" detail="Fallback routes available" status="Warning" />
        <MetricCard label="Fallback-ready" value={String(modelCatalog.filter((m) => m.fallbackEligible).length)} detail="Eligible routes" status="Healthy" />
      </div>

      <div className="grid three" style={{ marginTop: 18 }}>
        {providerHealth.map((provider) => (
          <Card pad key={provider.provider}>
            <div className="row"><h3>{provider.provider}</h3><StatusBadge value={provider.state} /></div>
            <p className="muted">{provider.note}</p>
            <ButtonLink href="/dashboard/safeguards" secondary>{provider.action}</ButtonLink>
          </Card>
        ))}
      </div>

      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Governed model catalog</h3><p className="muted">Only Running or Connected models can be selected by applications.</p></div><ButtonLink href="/dashboard/safeguards" secondary>Review routing</ButtonLink></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Model</th><th>Hosting</th><th>Runtime</th><th>Data boundary</th><th>Sensitivity</th><th>Cost / 1M</th><th>Status</th></tr></thead>
            <tbody>{modelCatalog.map((model) => <tr key={model.id}><td><strong>{model.name}</strong><br /><span className="muted">{model.provider}</span></td><td>{model.hosting}</td><td>{model.runtime}</td><td>{model.target}</td><td>{model.sensitivityFit}</td><td>{model.inputCostAed ? `${aed(model.inputCostAed)} in / ${aed(model.outputCostAed)} out` : "Local capacity"}</td><td><StatusBadge value={model.status} /></td></tr>)}</tbody>
          </table>
        </div>
      </Card>

      <Card pad style={{ marginTop: 18 }}>
        <div className="row"><div><h3>Routing guidance</h3><p className="muted">Recommended route by workload sensitivity and cost posture.</p></div><ButtonLink href="/dashboard/safeguards" secondary>Open routing policies</ButtonLink></div>
        <div className="control-list" style={{ marginTop: 12 }}>
          {routingGuidance.map((item) => <div className="control-row" key={item.workload}><div><strong>{item.workload}</strong><small>{item.route}</small></div><StatusBadge value={item.boundary} /></div>)}
        </div>
      </Card>
    </div>
  );
}
