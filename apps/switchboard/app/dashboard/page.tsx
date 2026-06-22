"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { useAppState } from "@/components/app-state";
import { Card, StatusBadge } from "@/components/ui";
import { infrastructureTargets, modelCatalog, operations, organization, routingPolicies, teams } from "@/lib/mock-data";
import { aed, formatNumber, percent } from "@/lib/utils";

type Range = "7d" | "30d";

const workspaceActivity = {
  "7d": [
    { date: "17 Jun", requests: 11200, previous: 10100 },
    { date: "18 Jun", requests: 11950, previous: 10580 },
    { date: "19 Jun", requests: 12480, previous: 11040 },
    { date: "20 Jun", requests: 13120, previous: 11860 },
    { date: "21 Jun", requests: 12880, previous: 11640 },
    { date: "22 Jun", requests: 14350, previous: 12620 },
    { date: "23 Jun", requests: 15140, previous: 13280 }
  ],
  "30d": [
    { date: "25 May", requests: 62000, previous: 58000 },
    { date: "1 Jun", requests: 71100, previous: 62600 },
    { date: "8 Jun", requests: 83400, previous: 71800 },
    { date: "15 Jun", requests: 90500, previous: 82100 },
    { date: "22 Jun", requests: 101200, previous: 90400 },
    { date: "23 Jun", requests: 128420, previous: 114000 }
  ]
};

const spendTrend = [
  { date: "1 Jun", actual: 18000, forecast: 18000, budget: 210000 },
  { date: "8 Jun", actual: 42000, forecast: 44500, budget: 210000 },
  { date: "15 Jun", actual: 72000, forecast: 80500, budget: 210000 },
  { date: "22 Jun", actual: 106000, forecast: 137600, budget: 210000 },
  { date: "30 Jun", actual: null, forecast: 184000, budget: 210000 }
];

const paidCostDrivers = [
  { model: "GPT-4o", spend: 34800, share: 61, requests: 32400, change: "+18%", opportunity: "Move repeatable support drafting to local route" },
  { model: "Claude Sonnet", spend: 22600, share: 39, requests: 19400, change: "+9%", opportunity: "Reserve for legal and engineering review" },
  { model: "Qwen 32B Local", spend: null, share: null, requests: 28600, change: "+14%", opportunity: "Owned capacity for restricted work" },
  { model: "Falcon Local", spend: null, share: null, requests: 21200, change: "+7%", opportunity: "Support FAQ traffic can graduate here" },
  { model: "DeepSeek Local", spend: null, share: null, requests: 16800, change: "+11%", opportunity: "Routine code drafting candidate" }
];

export default function DashboardPage() {
  const { applications } = useAppState();
  const [range, setRange] = useState<Range>("7d");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("just now");

  const liveApps = applications.filter((app) => app.status === "Live").length;
  const onlineTargets = infrastructureTargets.filter((target) => target.agent === "Online").length;
  const peakGpu = Math.max(...infrastructureTargets.map((target) => target.gpuLoad));
  const spendToDate = applications.reduce((sum, app) => sum + app.spendUsedAed, 0);
  const forecastSpend = spendTrend[spendTrend.length - 1].forecast;
  const monthlyBudget = spendTrend[0].budget;
  const activityData = workspaceActivity[range];
  const activityTotal = activityData.reduce((sum, item) => sum + item.requests, 0);
  const previousTotal = activityData.reduce((sum, item) => sum + item.previous, 0);
  const activityChange = Math.round(((activityTotal - previousTotal) / previousTotal) * 100);
  const peakDay = activityData.reduce((max, item) => item.requests > max.requests ? item : max, activityData[0]);
  const budgetRiskTeam = teams.find((team) => percent(team.spendUsedAed, team.spendBudgetAed) >= 70);
  const degradedProvider = modelCatalog.find((model) => model.hosting === "External provider" && model.status === "Warning");
  const policyWarning = routingPolicies.find((policy) => policy.status === "Warning");

  const issues = [
    ...operations.map((item) => ({
      severity: item.severity,
      issue: item.title,
      resource: item.affected,
      impact: item.title.includes("Legal") ? "Legal workspace unavailable" : item.title.includes("GPU") ? "Queue and SLA risk during peak load" : "Critical requests may slow down",
      owner: item.owner,
      action: item.title.includes("GPU") ? "Review capacity" : item.title.includes("OpenAI") ? "Review routing" : "Open incident",
      href: item.href
    })),
    ...(budgetRiskTeam ? [{
      severity: "Warning",
      issue: `${budgetRiskTeam.name} budget pressure`,
      resource: budgetRiskTeam.name,
      impact: "Budget circuit breaker may activate before month end",
      owner: budgetRiskTeam.owner,
      action: "Review usage",
      href: "/dashboard/cost-capacity"
    }] : [])
  ].slice(0, 5);

  const estateHealth = [
    { category: "Infrastructure", status: onlineTargets === infrastructureTargets.length ? "Healthy" : "Warning", context: `${onlineTargets}/${infrastructureTargets.length} servers online`, href: "/dashboard/infrastructure" },
    { category: "Workspaces", status: liveApps === applications.length ? "Healthy" : "Warning", context: `${liveApps}/${applications.length} workspace URLs live`, href: "/dashboard/applications" },
    { category: "Providers", status: degradedProvider ? "Warning" : "Healthy", context: degradedProvider ? `${degradedProvider.provider} latency degraded` : "All external providers connected", href: "/dashboard/model-catalog" },
    { category: "Policy enforcement", status: policyWarning ? "Warning" : "Healthy", context: policyWarning ? `${policyWarning.name} needs review` : "Restricted routes enforced", href: "/dashboard/safeguards" },
    { category: "Evidence readiness", status: organization.evidenceReadiness >= 80 ? "Healthy" : "Warning", context: `${organization.evidenceReadiness}% readiness support`, href: "/dashboard/compliance" }
  ];

  const exceptions = [
    { issue: "GPU above safe threshold", resource: "Claims On-Prem Node", consequence: "Peak queue wait may increase", href: "/dashboard/cost-capacity", action: "Review capacity" },
    { issue: "Server offline", resource: "Legal Sandbox", consequence: "Legal workspace cannot complete deployment", href: "/dashboard/infrastructure", action: "Open server" },
    { issue: "External fallback active", resource: "GPT-4o routes", consequence: "Latency-sensitive work should use approved fallback", href: "/dashboard/safeguards", action: "Review policy" },
    { issue: "No sovereignty violations", resource: "Restricted workflows", consequence: "Blocked-by-policy routes are behaving as designed", href: "/dashboard/audit", action: "View audit" }
  ];

  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setRefreshing(false);
    }, 650);
  }

  return (
    <div className="page overview-page">
      <header className="overview-header">
        <div>
          <p className="eyebrow">COMMAND CENTER</p>
          <h2>AI Estate Health</h2>
          <p className="muted">Current infrastructure, workspace, cost and governance posture.</p>
        </div>
        <div className="overview-header-actions">
          <button className="button secondary" type="button" onClick={refresh} disabled={refreshing}>
            <RefreshCw size={15} aria-hidden="true" />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
          <Link className="text-link" href="/dashboard/documentation?topic=overview&from=/dashboard">View documentation -&gt;</Link>
        </div>
      </header>

      <section className="estate-status-strip" aria-label="Estate status">
        <div className="status-icon critical" aria-hidden="true"><AlertTriangle size={18} /></div>
        <div>
          <h3>Attention required</h3>
          <p>Legal Workspace is unavailable and Claims GPU utilisation has crossed the safe threshold.</p>
        </div>
        <span className="muted">Last refreshed {lastRefreshed}</span>
        <div className="status-strip-actions">
          <Link className="button" href="/dashboard/infrastructure">Review critical issue</Link>
          <Link className="button secondary" href="/dashboard/operations">Open Monitoring</Link>
        </div>
      </section>

      <section className="estate-kpi-grid" aria-label="Primary estate KPIs">
        <OverviewKpi href="/dashboard/infrastructure" label="Servers online" value={`${onlineTargets} of ${infrastructureTargets.length}`} detail="Legal Sandbox offline" status="Warning" />
        <OverviewKpi href="/dashboard/applications" label="Live workspaces" value={`${liveApps} of ${applications.length}`} detail="Legal AI Assistant deploying" status="Warning" />
        <OverviewKpi href="/dashboard/cost-capacity" label="Forecast spend" value={aed(forecastSpend)} detail={`${aed(monthlyBudget - forecastSpend)} headroom`} status={forecastSpend > monthlyBudget ? "Critical" : "Warning"} />
        <OverviewKpi href="/dashboard/cost-capacity" label="Peak GPU utilisation" value={`${peakGpu}%`} detail="Claims node above threshold" status="Critical" />
      </section>

      <section className="overview-priority-grid">
        <Card className="overview-priority-card">
          <div className="card-header">
            <div>
              <h3>Immediate attention</h3>
              <p className="muted">Actionable exceptions only.</p>
            </div>
          </div>
          <div className="priority-table-wrap">
            <table className="priority-table">
              <thead><tr><th>Severity</th><th>Issue</th><th>Affected resource</th><th>Business impact</th><th>Owner</th><th>Action</th></tr></thead>
              <tbody>
                {issues.map((item) => (
                  <tr key={`${item.issue}-${item.resource}`}>
                    <td><StatusBadge value={item.severity} /></td>
                    <td><strong>{item.issue}</strong></td>
                    <td>{item.resource}</td>
                    <td>{item.impact}</td>
                    <td>{item.owner}</td>
                    <td><Link className="table-action" href={item.href}>{item.action}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="estate-health-card">
          <div className="card-header">
            <div>
              <h3>Estate health</h3>
              <p className="muted">Summaries and exceptions.</p>
            </div>
          </div>
          <div className="estate-health-list">
            {estateHealth.map((item) => (
              <Link className="estate-health-row" href={item.href} key={item.category}>
                <div>
                  <strong>{item.category}</strong>
                  <span>{item.context}</span>
                </div>
                <StatusBadge value={item.status} />
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="overview-trend-grid">
        <Card pad className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Workspace Activity</h3>
              <p className="muted">Requests increased {activityChange}%, driven primarily by Engineering Copilot.</p>
            </div>
            <div className="segmented-control" aria-label="Workspace activity range">
              <button className={range === "7d" ? "active" : ""} type="button" onClick={() => setRange("7d")}>7 days</button>
              <button className={range === "30d" ? "active" : ""} type="button" onClick={() => setRange("30d")}>30 days</button>
            </div>
          </div>
          <div className="chart-summary-row">
            <MetricMini label="Total requests" value={formatNumber(activityTotal)} />
            <MetricMini label="Change" value={`+${activityChange}%`} />
            <MetricMini label="Peak day" value={peakDay.date} />
          </div>
          <div className="overview-chart" role="img" aria-label={`Workspace requests total ${formatNumber(activityTotal)} for selected ${range} range.`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <Tooltip formatter={(value: unknown, name: unknown) => [formatNumber(Number(value)), name === "previous" ? "Previous period" : "Requests"]} />
                <Legend />
                <Line type="monotone" dataKey="requests" name="Requests" stroke="#5B3DFF" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="previous" name="Previous period" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card pad className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Spend Forecast</h3>
              <p className="muted">Forecast remains within budget, but paid-model spend rose 18% over the previous seven days.</p>
            </div>
          </div>
          <div className="chart-summary-row four">
            <MetricMini label="Spend to date" value={aed(spendToDate)} />
            <MetricMini label="Forecast" value={aed(forecastSpend)} />
            <MetricMini label="Budget" value={aed(monthlyBudget)} />
            <MetricMini label="Headroom" value={aed(monthlyBudget - forecastSpend)} />
          </div>
          <div className="overview-chart" role="img" aria-label={`Spend forecast ${aed(forecastSpend)} against ${aed(monthlyBudget)} budget.`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spendTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `AED ${Math.round(Number(value) / 1000)}k`} />
                <Tooltip formatter={(value: unknown, name: unknown) => [value == null ? "n/a" : aed(Number(value)), name === "actual" ? "Actual" : name === "forecast" ? "Forecast" : "Budget"]} />
                <ReferenceLine y={monthlyBudget} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "Budget", position: "insideTopRight", fill: "#92400e", fontSize: 12 }} />
                <Legend />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#5B3DFF" strokeWidth={2.5} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#16C7E8" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section className="overview-driver-grid">
        <Card className="overview-priority-card">
          <div className="card-header">
            <div>
              <h3>Cost drivers</h3>
              <p className="muted">Paid-provider spend separated from owned local capacity.</p>
            </div>
            <Link className="text-link" href="/dashboard/model-catalog">Open catalog -&gt;</Link>
          </div>
          <div className="priority-table-wrap">
            <table className="driver-table">
              <thead><tr><th>Model</th><th>Paid spend</th><th>Share</th><th>Requests</th><th>Change</th><th>Opportunity</th></tr></thead>
              <tbody>
                {paidCostDrivers.map((item) => (
                  <tr key={item.model}>
                    <td><strong>{item.model}</strong></td>
                    <td>{item.spend == null ? "Owned capacity" : aed(item.spend)}</td>
                    <td>{item.share == null ? "-" : `${item.share}%`}</td>
                    <td>{formatNumber(item.requests)}</td>
                    <td>{item.change}</td>
                    <td>{item.opportunity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="estate-health-card">
          <div className="card-header">
            <div>
              <h3>Capacity and policy exceptions</h3>
              <p className="muted">Only states that require awareness or action.</p>
            </div>
          </div>
          <div className="exception-list">
            {exceptions.map((item) => (
              <div className="exception-row" key={`${item.issue}-${item.resource}`}>
                <div>
                  <strong>{item.issue}</strong>
                  <span>{item.resource} - {item.consequence}</span>
                </div>
                <Link className="table-action" href={item.href}>{item.action}</Link>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function OverviewKpi({ href, label, value, detail, status }: { href: string; label: string; value: string; detail: string; status: string }) {
  return (
    <Link href={href} className="overview-kpi-card">
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
      <span className={`kpi-status ${status.toLowerCase()}`}>{status}</span>
    </Link>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return <div className="metric-mini"><span>{label}</span><strong>{value}</strong></div>;
}
