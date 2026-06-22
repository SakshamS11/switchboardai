import { ActionButton } from "@/components/action-button";
import { ButtonLink, Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { routingPolicies } from "@/lib/mock-data";

const modules = [
  { name: "Sovereignty Router", state: "Active", control: "Restricted data routes to customer-owned local models.", scope: "2 teams" },
  { name: "Cost Ladder", state: "Active", control: "General work uses the lowest approved model tier first.", scope: "3 applications" },
  { name: "Provider Degradation", state: "Warning", control: "Traffic reroutes when provider health declines.", scope: "4 applications" },
  { name: "Budget Circuit Breaker", state: "Active", control: "Premium routes stop or require approval at configured limits.", scope: "2 teams" },
  { name: "Prompt Firewall", state: "Active", control: "Sensitive prompts are inspected before routing.", scope: "5 policies" }
];

export default function SafeguardsPage() {
  return (
    <div className="page">
      <PageHeader eyebrow="Control" title="Routing Policies" description="Govern sensitive routes, provider fallback, model blocks, budget controls, and prompt inspection." action={<ActionButton action="Opened create routing policy flow" target="Routing Policies" type="Policy">Create policy</ActionButton>} />
      <div className="grid kpis">
        <MetricCard label="Policies" value={String(routingPolicies.length)} detail="Versioned controls" status="Healthy" />
        <MetricCard label="Sovereignty routers" value={String(routingPolicies.filter((p) => p.module === "Sovereignty Router").length)} detail="Fail closed for restricted data" status="Healthy" />
        <MetricCard label="Provider drift" value="OpenAI warning" detail="Fallback route armed" status="Warning" />
        <MetricCard label="Blocked external" value="Claims" detail="Local-only application" status="Healthy" />
      </div>

      <Card pad style={{ marginTop: 18 }} className="status-card">
        <div className="row"><div><h3>Provider degradation active</h3><p className="muted">External provider latency is elevated. Critical work should remain on approved fallback routes by sensitivity.</p></div><StatusBadge value="Warning" /></div>
        <div className="row" style={{ justifyContent: "flex-start", marginTop: 12 }}><ButtonLink href="/dashboard/operations" secondary>Open incident</ButtonLink><ButtonLink href="/dashboard/model-catalog" secondary>Review provider</ButtonLink></div>
      </Card>

      <div className="grid three" style={{ marginTop: 18 }}>
        {modules.map((module) => <Card pad key={module.name}><div className="row"><h3>{module.name}</h3><StatusBadge value={module.state} /></div><p className="muted">{module.control}</p><p><strong>{module.scope}</strong></p><ActionButton action={`Reviewed ${module.name} rules`} target="Routing Policies" type="Policy" secondary>Review rules</ActionButton></Card>)}
      </div>

      <Card style={{ marginTop: 18 }}>
        <div className="card-header"><div><h3>Active policy registry</h3><p className="muted">Every request entering the on-server gateway is evaluated against application policy.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Policy</th><th>Module</th><th>Scope</th><th>Primary</th><th>Fallback</th><th>Blocked</th><th>Version</th><th>Status</th></tr></thead><tbody>{routingPolicies.map((policy) => <tr key={policy.id}><td><strong>{policy.name}</strong><br /><span className="muted">{policy.sensitivity}</span></td><td>{policy.module}</td><td>{policy.scope}</td><td>{policy.primary}</td><td>{policy.fallback}</td><td>{policy.blocked}</td><td>{policy.version}</td><td><StatusBadge value={policy.status} /></td></tr>)}</tbody></table></div>
      </Card>
    </div>
  );
}
