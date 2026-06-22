"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Card } from "@/components/ui";
import { organization } from "@/lib/mock-data";
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

export default function DashboardPage() {
  const { applications, servers, modelCatalog, routingPolicies, teams, isHydrated } = useAppState();
  const [range, setRange] = useState<Range>("7d");
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState("just now");

  const liveApps = applications.filter((app) => app.status === "Live").length;
  const deployingApps = applications.filter((app) => app.status === "Deploying").length;
  const onlineTargets = servers.filter((target) => target.agent === "Online").length;
  const offlineTargets = servers.filter((target) => target.agent === "Offline" || target.status === "Offline").length;
  const peakGpu = Math.max(...servers.map((target) => target.gpuLoad));
  const activityData = workspaceActivity[range];
  const activityTotal = activityData.reduce((sum, item) => sum + item.requests, 0);
  const previousTotal = activityData.reduce((sum, item) => sum + item.previous, 0);
  const activityChange = Math.round(((activityTotal - previousTotal) / previousTotal) * 100);
  const peakDay = activityData.reduce((max, item) => item.requests > max.requests ? item : max, activityData[0]!);
  const spendToDate = applications.reduce((sum, app) => sum + app.spendUsedAed, 0);
  const forecastSpend = spendTrend[spendTrend.length - 1]!.forecast;
  const monthlyBudget = spendTrend[0]!.budget;
  const budgetHeadroom = monthlyBudget - forecastSpend;
  const servicesHealthy = 18;
  const servicesTotal = 21;
  const degradedProvider = modelCatalog.find((model) => model.hosting === "External provider" && model.status === "Warning");
  const protectedPolicy = routingPolicies.find((policy) => policy.module === "Sovereignty Router" && policy.status !== "Failed");
  const teamRisks = teams.filter((team) => percent(team.spendUsedAed, team.spendBudgetAed) >= 70).slice(0, 2);

  const attention = useMemo(() => [
    {
      severity: "Critical",
      issue: "Legal Sandbox agent offline",
      resource: "Legal AI Assistant",
      impact: "Legal users cannot access their workspace.",
      owner: "Infrastructure",
      action: "Open incident",
      href: "/dashboard/operations?incident=legal-agent-offline"
    },
    {
      severity: "Warning",
      issue: "Claims GPU above threshold",
      resource: "Claims On-Prem Node",
      impact: "Queue wait and SLA risk may increase at peak.",
      owner: "Platform Ops",
      action: "Review capacity",
      href: "/dashboard/cost-capacity"
    },
    {
      severity: "Warning",
      issue: "OpenAI latency degraded",
      resource: "External-enabled workspaces",
      impact: "Critical requests should use approved fallback routes.",
      owner: "AI Platform",
      action: "Review routing",
      href: "/dashboard/safeguards"
    },
    {
      severity: "Attention",
      issue: "Marketing and Claims nearing limits",
      resource: "Team budgets",
      impact: "Budget controls may activate before month end.",
      owner: "Operations",
      action: "Review budget",
      href: "/dashboard/cost-capacity"
    }
  ], []);

  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => {
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setRefreshing(false);
    }, 650);
  }

  if (!isHydrated) return <OverviewSkeleton />;

  return (
    <div className="page overview-page">
      <header className="overview-header overview-header-compact">
        <div>
          <p className="eyebrow">COMMAND CENTER</p>
          <h2>AI Estate Health</h2>
          <p className="muted">Current infrastructure, workspace, cost and governance posture.</p>
        </div>
        <div className="overview-header-actions">
          <button className="button secondary overview-refresh" type="button" onClick={refresh} disabled={refreshing} aria-label={refreshing ? "Refreshing overview" : "Refresh overview"}>
            <RefreshCw className={refreshing ? "spin" : ""} size={15} aria-hidden="true" />
            <span>{refreshing ? "Refreshing" : "Refresh"}</span>
          </button>
          <Link className="text-link" href="/dashboard/documentation?topic=overview&from=/dashboard">View documentation -&gt;</Link>
        </div>
      </header>

      <section className="estate-status-ribbon" aria-label="Estate status">
        <div className="status-icon critical" aria-hidden="true"><AlertTriangle size={18} /></div>
        <div className="estate-status-copy">
          <h3>Attention required <span>Updated {lastRefreshed}</span></h3>
          <p>Legal Workspace is unavailable and Claims GPU is above threshold.</p>
        </div>
        <div className="status-strip-actions">
          <Link className="button" href="/dashboard/operations?incident=legal-agent-offline">Open incident</Link>
          <Link className="button secondary" href="/dashboard/operations">View monitoring</Link>
        </div>
      </section>

      <section className="overview-kpis-compact" aria-label="Primary estate KPIs">
        <OverviewKpi href="/dashboard/infrastructure" label="Servers online" value={`${onlineTargets} of ${servers.length}`} detail={`${offlineTargets} offline`} />
        <OverviewKpi href="/dashboard/applications" label="Live workspaces" value={`${liveApps} of ${applications.length}`} detail={`${deployingApps} deploying`} />
        <OverviewKpi href="/dashboard/cost-capacity" label="Forecast spend" value={aed(forecastSpend)} detail="Budget watch" />
        <OverviewKpi href="/dashboard/cost-capacity" label="Peak GPU utilisation" value={`${peakGpu}%`} detail="Above critical threshold" />
      </section>

      <section className="overview-command-row">
        <Card className="overview-panel-card">
          <div className="card-header">
            <div>
              <h3>Immediate attention</h3>
              <p className="muted">Exceptions that need an owner action.</p>
            </div>
          </div>
          <div className="attention-list">
            {attention.map((item) => (
              <div className="attention-row" key={item.issue}>
                <span className={`severity-dot ${item.severity.toLowerCase()}`}>{item.severity}</span>
                <div className="attention-issue"><strong>{item.issue}</strong><span>{item.resource}</span></div>
                <p>{item.impact}</p>
                <span className="attention-owner">{item.owner}</span>
                <Link className="button secondary compact-action" href={item.href}>{item.action}</Link>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overview-panel-card provider-governance-card">
          <div className="card-header">
            <div>
              <h3>Provider & governance</h3>
              <p className="muted">Context not already shown in KPIs.</p>
            </div>
          </div>
          <div className="governance-list">
            <ContextRow label="Services" value={`${servicesHealthy} of ${servicesTotal} healthy`} href="/dashboard/operations" action="View services" state="neutral" />
            <ContextRow label="External providers" value={degradedProvider ? `${degradedProvider.provider} latency degraded` : "All external providers connected"} href="/dashboard/safeguards" action="Review routing" state={degradedProvider ? "attention" : "healthy"} />
            <ContextRow label="Policy enforcement" value={protectedPolicy ? "Restricted routes protected" : "Policy review needed"} href="/dashboard/safeguards" action="View policies" state={protectedPolicy ? "governed" : "attention"} />
            <ContextRow label="Evidence readiness" value={`${organization.evidenceReadiness}% preparation coverage`} href="/dashboard/compliance" action="View readiness" state="neutral" />
          </div>
        </Card>
      </section>

      <section className="overview-trends-row">
        <Card pad className="overview-chart-card workspace-trend-card">
          <div className="chart-card-header">
            <div>
              <h3>Workspace activity</h3>
              <p className="muted">Requests increased {activityChange}%, driven primarily by Engineering Copilot.</p>
            </div>
            <div className="segmented-control fixed-segmented" aria-label="Workspace activity range">
              <button className={range === "7d" ? "active" : ""} type="button" onClick={() => setRange("7d")}>7d</button>
              <button className={range === "30d" ? "active" : ""} type="button" onClick={() => setRange("30d")}>30d</button>
            </div>
          </div>
          <div className="chart-inline-summary">
            <strong>{formatNumber(activityTotal)} requests</strong>
            <span>+{activityChange}% vs previous period</span>
            <span>Peak: {peakDay.date}</span>
          </div>
          <div className="overview-chart fixed-chart" role="img" aria-label={`Workspace requests total ${formatNumber(activityTotal)} for selected ${range} range.`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={activityData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <Tooltip formatter={(value: unknown, name: unknown) => [formatNumber(Number(value)), name === "previous" ? "Previous period" : "Requests"]} />
                <Legend verticalAlign="top" height={28} />
                <Line type="monotone" dataKey="requests" name="Requests" stroke="#5B3DFF" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="previous" name="Previous period" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card pad className="overview-chart-card cost-trend-card">
          <div className="chart-card-header">
            <div>
              <h3>Cost snapshot</h3>
              <p className="muted">Actual spend, forecast and remaining budget headroom.</p>
            </div>
          </div>
          <div className="chart-inline-summary">
            <strong>{aed(spendToDate)} actual</strong>
            <span>{aed(forecastSpend)} forecast</span>
            <span>{aed(budgetHeadroom)} headroom</span>
          </div>
          <div className="overview-chart fixed-chart" role="img" aria-label={`Spend forecast ${aed(forecastSpend)} against ${aed(monthlyBudget)} budget.`}>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={spendTrend} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `AED ${Math.round(Number(value) / 1000)}k`} />
                <Tooltip formatter={(value: unknown, name: unknown) => [value == null ? "n/a" : aed(Number(value)), name === "actual" ? "Actual" : name === "forecast" ? "Forecast" : "Budget"]} />
                <ReferenceLine y={monthlyBudget} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "Budget", position: "insideTopRight", fill: "#92400e", fontSize: 12 }} />
                <Legend verticalAlign="top" height={28} />
                <Line type="monotone" dataKey="actual" name="Actual" stroke="#5B3DFF" strokeWidth={2.5} dot={false} connectNulls={false} />
                <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#16C7E8" strokeWidth={2.5} strokeDasharray="6 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="cost-insights">
            <p><strong>Highest cost driver:</strong> GPT-4o.</p>
            <p><strong>Best opportunity:</strong> graduate repeatable support traffic to Falcon Local.</p>
            <p>{teamRisks.length ? `${teamRisks.length} teams nearing limits - ${teamRisks.map((team) => `${team.name} ${percent(team.spendUsedAed, team.spendBudgetAed)}%`).join(", ")}` : "No teams are near hard limits."}</p>
            <Link className="text-link" href="/dashboard/cost-capacity">View cost and capacity -&gt;</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="page overview-page" aria-busy="true">
      <div className="overview-skeleton header" />
      <div className="overview-skeleton ribbon" />
      <div className="overview-skeleton kpis" />
      <div className="overview-skeleton command" />
      <div className="overview-skeleton trends" />
    </div>
  );
}

function OverviewKpi({ href, label, value, detail }: { href: string; label: string; value: string; detail: string }) {
  return (
    <Link href={href} className="overview-kpi-card compact">
      <span className="metric-label">{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </Link>
  );
}

function ContextRow({ label, value, href, action, state }: { label: string; value: string; href: string; action: string; state: "healthy" | "attention" | "governed" | "neutral" }) {
  return (
    <div className="governance-row">
      <div>
        <span className={`state-dot ${state}`} aria-hidden="true" />
        <strong>{label}</strong>
        <p>{value}</p>
      </div>
      <Link className="button secondary compact-action" href={href}>{action}</Link>
    </div>
  );
}
