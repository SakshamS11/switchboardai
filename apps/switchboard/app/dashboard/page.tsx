"use client";

import Link from "next/link";
import { useAppState } from "@/components/app-state";
import { ButtonLink, Card, PageHeader, Progress, StatusBadge } from "@/components/ui";
import { infrastructureTargets, modelCatalog, operations, teams } from "@/lib/mock-data";
import { aed, formatNumber, percent } from "@/lib/utils";

const modelSpend = [
  { name: "GPT-4o", cost: 34800, share: 38 },
  { name: "Claude Sonnet", cost: 22600, share: 25 },
  { name: "Qwen 32B Local", cost: 0, share: 18 },
  { name: "Falcon Local", cost: 0, share: 12 },
  { name: "DeepSeek Local", cost: 0, share: 7 }
];

const recommendedChanges = [
  { change: "Restore Legal Sandbox agent", area: "Legal AI Assistant", impact: "Returns the application to service", href: "/dashboard/operations", tone: "Critical" },
  { change: "Reclaim Finance GPU reserve", area: "Claims capacity", impact: "Reduces queue wait during peaks", href: "/dashboard/cost-capacity", tone: "Warning" },
  { change: "Confirm OpenAI fallback policy", area: "Provider routing", impact: "Keeps critical work moving", href: "/dashboard/safeguards", tone: "Warning" },
  { change: "Enable support cache ladder", area: "Cost control", impact: "Cuts repeated FAQ spend", href: "/dashboard/cost-capacity", tone: "Healthy" }
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
  const activeUsers = applications.reduce((sum, app) => sum + app.activeUsers, 0);
  const onlineTargets = infrastructureTargets.filter((target) => target.agent === "Online").length;
  const peakGpu = Math.max(...infrastructureTargets.map((target) => target.gpuLoad));
  const avgLatency = Math.round(applications.reduce((sum, app) => sum + app.avgLatencyMs, 0) / applications.length);
  const totalBudget = teams.reduce((sum, team) => sum + team.spendBudgetAed, 0);
  const totalSpend = teams.reduce((sum, team) => sum + team.spendUsedAed, 0);
  const teamsAtBudgetRisk = teams.filter((team) => percent(team.spendUsedAed, team.spendBudgetAed) >= 70).length;

  return (
    <div className="page overview-page">
      <PageHeader
        eyebrow="Command Center"
        title="AI operations command center"
        description="One view for application health, infrastructure pressure, provider risk, spend forecast, and team budget action."
        action={<ButtonLink href="/dashboard/applications">Create AI Application</ButtonLink>}
      />

      <section className="overview-hero">
        <div className="hero-main">
          <div className="hero-status-row">
            <StatusBadge value="Warning" />
            <span>AI Ops Status</span>
          </div>
          <h3>Operational, with 3 items needing action.</h3>
          <p>Legal Sandbox is offline, Claims GPU is above safe range, and the external provider fallback should stay active until latency normalizes.</p>
          <div className="hero-actions">
            <ButtonLink href="/dashboard/operations">Open incidents</ButtonLink>
            <ButtonLink href="/dashboard/safeguards" secondary>Review routing</ButtonLink>
          </div>
        </div>
        <div className="hero-stat-grid">
          <HeroStat label="Infrastructure" value={`${onlineTargets}/${infrastructureTargets.length}`} detail="agents online" />
          <HeroStat label="Applications" value={`${liveApps}/${applications.length}`} detail="live" />
          <HeroStat label="Requests" value={formatNumber(monthlyRequests)} detail="this month" />
          <HeroStat label="Cost" value={aed(projectedSpend)} detail="current period" />
          <HeroStat label="Budget risk" value={`${teamsAtBudgetRisk} teams`} detail={`${percent(totalSpend, totalBudget)}% used`} />
          <HeroStat label="GPU peak" value={`${peakGpu}%`} detail="Claims pressure" />
        </div>
      </section>

      <section className="overview-command-grid">
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
              <p className="muted">The work that should be handled first.</p>
            </div>
            <ButtonLink href="/dashboard/operations" secondary>View all</ButtonLink>
          </div>
          <div className="overview-list">
            {operations.map((item) => (
              <Link className="issue-row" href={item.href} key={item.title}>
                <StatusBadge value={item.severity} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.action}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="overview-panel">
          <div className="card-header">
            <div>
              <h3>Recommended changes</h3>
              <p className="muted">Focused adjustments with clear impact.</p>
            </div>
          </div>
          <div className="overview-list">
            {recommendedChanges.map((item) => (
              <Link className="change-row" href={item.href} key={item.change}>
                <div>
                  <div className="row" style={{ justifyContent: "flex-start" }}>
                    <StatusBadge value={item.tone} />
                    <strong>{item.change}</strong>
                  </div>
                  <span>{item.area} - {item.impact}</span>
                </div>
                <span className="review-link">Review</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="compact-kpi-strip">
        <CompactKpi label="Active users" value={formatNumber(activeUsers)} detail="+12% vs last period" status="Healthy" />
        <CompactKpi label="Avg latency" value={`${avgLatency} ms`} detail="limit 1,200 ms" status="Healthy" />
        <CompactKpi label="Monthly requests" value={formatNumber(monthlyRequests)} detail="governed URLs" status="Healthy" />
        <CompactKpi label="Projected spend" value={aed(projectedSpend)} detail="budget watch" status="Warning" />
        <CompactKpi label="Models available" value={String(modelCatalog.filter((model) => model.status === "Running" || model.status === "Connected").length)} detail="catalog ready" status="Healthy" />
        <CompactKpi label="Savings opportunity" value={aed(42000)} detail="cache and local routing" status="Healthy" />
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
            <h3>Application availability</h3>
            <ButtonLink href="/dashboard/applications" secondary>Manage</ButtonLink>
          </div>
          <div className="stack compact-stack">
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
      </section>

      <section className="tip-strip">
        <div>
          <strong>Your AI spend can become owned capacity over time.</strong>
          <span>Support and claims traffic show the strongest local-model graduation fit.</span>
        </div>
        <ButtonLink href="/dashboard/cost-capacity" secondary>Review cost and capacity</ButtonLink>
      </section>
    </div>
  );
}

function HeroStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="hero-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

function CompactKpi({ label, value, detail, status }: { label: string; value: string; detail: string; status: string }) {
  return (
    <Card pad className="compact-kpi">
      <div className="row">
        <span className="metric-label">{label}</span>
        <StatusBadge value={status} />
      </div>
      <div className="metric-value">{value}</div>
      <p className="muted">{detail}</p>
    </Card>
  );
}
