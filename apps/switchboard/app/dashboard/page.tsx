"use client";

import Link from "next/link";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets, operations, teams } from "@/lib/mock-data";
import { aed, formatNumber, percent } from "@/lib/utils";

const modelSpend = [
  { name: "GPT-4o", cost: 34800, share: 38 },
  { name: "Claude Sonnet", cost: 22600, share: 25 },
  { name: "Qwen 32B Local", cost: 0, share: 18 },
  { name: "Falcon Local", cost: 0, share: 12 },
  { name: "DeepSeek Local", cost: 0, share: 7 }
];

const spendForecast = [
  { label: "W1", actual: 26000, forecast: 26000 },
  { label: "W2", actual: 56000, forecast: 56000 },
  { label: "W3", actual: 79000, forecast: 94000 },
  { label: "W4", actual: 106000, forecast: 137600 },
  { label: "EOM", actual: 0, forecast: 184000 }
];

export default function DashboardPage() {
  const { applications, simulateAction } = useAppState();
  const liveApps = applications.filter((app) => app.status === "Live").length;
  const monthlyRequests = applications.reduce((sum, app) => sum + app.monthlyRequests, 0);
  const projectedSpend = applications.reduce((sum, app) => sum + app.spendUsedAed, 0);
  const onlineTargets = infrastructureTargets.filter((target) => target.agent === "Online").length;
  const peakGpu = Math.max(...infrastructureTargets.map((target) => target.gpuLoad));
  const teamsAtBudgetRisk = teams.filter((team) => percent(team.spendUsedAed, team.spendBudgetAed) >= 70).length;

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow="Command Center"
        title="AI operations command center"
        description="Live health, spend, capacity, routing, and team usage for governed AI workspaces."
      />

      <section className="overview-status-strip">
        <div>
          <span className="metric-label">AI Ops Status</span>
          <h3>Warning: 3 items need attention</h3>
          <p>Legal Sandbox is offline, Claims GPU is at 92%, external fallback is active, and {teamsAtBudgetRisk} teams are near budget watch.</p>
        </div>
        <div className="status-strip-actions">
          <ButtonLink href="/dashboard/operations">Open incidents</ButtonLink>
          <ButtonLink href="/dashboard/safeguards" secondary>Review routing</ButtonLink>
        </div>
      </section>

      <section className="overview-kpi-grid">
        <SharpKpi label="AI workspaces" value={`${liveApps}/${applications.length}`} detail="live employee workspace URLs" status="Warning" />
        <SharpKpi label="Infrastructure" value={`${onlineTargets}/${infrastructureTargets.length}`} detail="agent-connected servers" status="Warning" />
        <SharpKpi label="Active issues" value={String(operations.length)} detail="1 critical, 2 warnings" status="Critical" />
        <SharpKpi label="Monthly requests" value={formatNumber(monthlyRequests)} detail="through governed chat URLs" status="Healthy" />
        <SharpKpi label="Projected spend" value={aed(projectedSpend)} detail="current period usage" status="Warning" />
        <SharpKpi label="GPU peak" value={`${peakGpu}%`} detail="Claims node pressure" status="Critical" />
      </section>

      <section className="overview-command-grid core-grid">
        <Card className="overview-panel">
          <div className="card-header">
            <div>
              <h3>Infrastructure health</h3>
              <p className="muted">Agent, GPU, and application host status.</p>
            </div>
            <ButtonLink href="/dashboard/infrastructure" secondary>View fleet</ButtonLink>
          </div>
          <div className="overview-list">
            {infrastructureTargets.map((target) => (
              <Link className="health-row" href="/dashboard/infrastructure" key={target.id}>
                <div>
                  <strong>{target.name}</strong>
                  <span>{target.gpu === "Not detected" ? target.heartbeat : `${target.gpuLoad}% GPU - ${target.vramUsed}/${target.vramTotal}GB VRAM`}</span>
                </div>
                <StatusBadge value={target.status} />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="overview-panel action-panel">
          <div className="card-header">
            <div>
              <h3>Immediate attention</h3>
              <p className="muted">Current incidents and operational actions.</p>
            </div>
            <ButtonLink href="/dashboard/operations" secondary>View all</ButtonLink>
          </div>
          <div className="overview-list">
            {operations.map((item) => (
              <Link className="issue-row" href={item.href} key={item.title}>
                <StatusBadge value={item.severity} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.affected} - {item.action}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="overview-panel">
          <div className="card-header">
            <div>
              <h3>Application availability</h3>
              <p className="muted">Employee chat URLs and deployment state.</p>
            </div>
            <ButtonLink href="/dashboard/applications" secondary>Manage</ButtonLink>
          </div>
          <div className="stack compact-stack overview-card-body">
            {applications.map((app) => (
              <div className="app-row" key={app.id}>
                <div>
                  <Link href={`/dashboard/applications/${app.id}`}><strong>{app.name}</strong></Link>
                  <span>{app.url.replace("https://", "")}</span>
                </div>
                <StatusBadge value={app.status} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="overview-support-grid finance-grid">
        <Card pad>
          <div className="row">
            <div>
              <h3>Spend forecast</h3>
              <p className="muted">Actual spend with forecasted month-end run rate.</p>
            </div>
            <ButtonLink href="/dashboard/cost-capacity" secondary>Open forecast</ButtonLink>
          </div>
          <div className="forecast-chart" aria-label="Spend forecast chart">
            {spendForecast.map((point) => (
              <div className="forecast-column" key={point.label}>
                <div className="forecast-bars">
                  {point.actual ? <span className="actual-bar" style={{ height: `${Math.max(14, point.actual / 1800)}px` }} /> : null}
                  <span className="forecast-bar" style={{ height: `${Math.max(18, point.forecast / 1800)}px` }} />
                </div>
                <small>{point.label}</small>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <span><i className="legend-dot actual" /> Actual</span>
            <span><i className="legend-dot forecast" /> Forecast</span>
            <strong>Forecast: {aed(184000)}</strong>
          </div>
        </Card>

        <Card pad>
          <div className="row">
            <div>
              <h3>Team usage</h3>
              <p className="muted">Token usage against each team budget.</p>
            </div>
            <ButtonLink href="/dashboard/teams" secondary>Manage access</ButtonLink>
          </div>
          <div className="team-column-chart" aria-label="Team usage column chart">
            {teams.map((team) => {
              const usage = percent(team.tokensUsed, team.tokenBudget);
              return (
                <div className="team-column" key={team.id}>
                  <div className="column-track"><span className={usage >= 75 ? "warning" : ""} style={{ height: `${Math.max(10, usage)}%` }} /></div>
                  <strong>{usage}%</strong>
                  <small>{team.name}</small>
                </div>
              );
            })}
          </div>
        </Card>

        <Card pad>
          <div className="row">
            <div>
              <h3>Budget owner alerts</h3>
              <p className="muted">Notify owners before spend crosses policy.</p>
            </div>
            <StatusBadge value="Warning" />
          </div>
          <div className="budget-risk-card">
            {teams.map((team) => {
              const spendUsage = percent(team.spendUsedAed, team.spendBudgetAed);
              return (
                <div className="budget-row" key={team.id}>
                  <div>
                    <strong>{team.name}</strong>
                    <span>{team.owner} - {aed(team.spendUsedAed)} of {aed(team.spendBudgetAed)}</span>
                    <Progress value={spendUsage} />
                  </div>
                  <button
                    className="button secondary"
                    type="button"
                    onClick={() => simulateAction(`Notified ${team.owner} about ${team.name} budget usage`, team.name, "Cost")}
                  >
                    Notify owner
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="overview-support-grid two-plus-one">
        <Card pad>
          <div className="row">
            <h3>Cost by model</h3>
            <ButtonLink href="/dashboard/model-catalog" secondary>Open catalog</ButtonLink>
          </div>
          <div className="model-spend-list">
            {modelSpend.map((model) => (
              <div className="spend-row" key={model.name}>
                <div className="row">
                  <strong>{model.name}</strong>
                  <span>{model.cost ? aed(model.cost) : "Owned"}</span>
                </div>
                <Progress value={model.share} />
              </div>
            ))}
          </div>
        </Card>

        <Card pad>
          <div className="row">
            <h3>Routing posture</h3>
            <ButtonLink href="/dashboard/safeguards" secondary>Policies</ButtonLink>
          </div>
          <div className="model-spend-list">
            <div className="spend-row">
              <div className="row"><strong>Legal restricted knowledge</strong><StatusBadge value="Warning" /></div>
              <p className="muted">Local-first routing active; Legal Sandbox must reconnect before Live.</p>
            </div>
            <div className="spend-row">
              <div className="row"><strong>Claims external routing</strong><StatusBadge value="Healthy" /></div>
              <p className="muted">External providers are blocked for confidential claims workflows.</p>
            </div>
            <div className="spend-row">
              <div className="row"><strong>Support cost ladder</strong><StatusBadge value="Healthy" /></div>
              <p className="muted">FAQ traffic can move to local models and cache.</p>
            </div>
          </div>
        </Card>
      </section>

      <section className="tip-strip">
        <div>
          <strong>Owned AI capacity signal</strong>
          <span>Support and claims traffic show the strongest local-model graduation fit.</span>
        </div>
        <ButtonLink href="/dashboard/cost-capacity" secondary>Review cost and capacity</ButtonLink>
      </section>
    </div>
  );
}

function SharpKpi({ label, value, detail, status }: { label: string; value: string; detail: string; status: string }) {
  return (
    <Card pad className="sharp-kpi">
      <div className="row">
        <span className="metric-label">{label}</span>
        <StatusBadge value={status} />
      </div>
      <div className="metric-value">{value}</div>
      <p className="muted">{detail}</p>
    </Card>
  );
}
