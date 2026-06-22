"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppState } from "@/components/app-state";
import { Card, StatusBadge } from "@/components/ui";
import { aed } from "@/lib/utils";

const latencySeries = [
  { time: "09:00", p50: 420, p95: 880 },
  { time: "10:00", p50: 460, p95: 940 },
  { time: "11:00", p50: 510, p95: 1240 },
  { time: "12:00", p50: 530, p95: 1380 },
  { time: "13:00", p50: 490, p95: 1160 }
];

const gpuSeries = [
  { time: "09:00", claims: 78, acme: 64, aws: 44 },
  { time: "10:00", claims: 86, acme: 69, aws: 49 },
  { time: "11:00", claims: 92, acme: 71, aws: 52 },
  { time: "12:00", claims: 94, acme: 72, aws: 54 },
  { time: "13:00", claims: 89, acme: 70, aws: 51 }
];

const severityRank = { Critical: 0, Warning: 1, Info: 2 };

export default function OperationsPage() {
  const { incidents, servers, applications, acknowledgeIncident, mitigateIncident, resolveIncident } = useAppState();
  const [selectedId, setSelectedId] = useState(incidents[0]?.id ?? "");
  const [range, setRange] = useState("24h");
  const [serverFilter, setServerFilter] = useState("All");
  const [providerFilter, setProviderFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("Timeline");
  const [resolveOpen, setResolveOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [rootCause, setRootCause] = useState("Agent connectivity");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incident = params.get("incident");
    if (incident && incidents.some((item) => item.id === incident)) setSelectedId(incident);
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents
      .filter((incident) => serverFilter === "All" || incident.serverId === serverFilter)
      .filter((incident) => providerFilter === "All" || incident.provider === providerFilter)
      .filter((incident) => severityFilter === "All" || incident.severity === severityFilter)
      .filter((incident) => statusFilter === "All" || incident.status === statusFilter)
      .sort((a, b) => {
        const resolvedDelta = Number(a.status === "Resolved") - Number(b.status === "Resolved");
        if (resolvedDelta) return resolvedDelta;
        return severityRank[a.severity] - severityRank[b.severity];
      });
  }, [incidents, providerFilter, serverFilter, severityFilter, statusFilter]);

  const selected = incidents.find((incident) => incident.id === selectedId) ?? filteredIncidents[0] ?? incidents[0];
  const activeIncidents = filteredIncidents.filter((incident) => incident.status !== "Resolved");
  const criticalIncidents = activeIncidents.filter((incident) => incident.severity === "Critical");
  const affectedWorkspaces = new Set(activeIncidents.map((incident) => incident.affected)).size;
  const serviceAvailability = Math.round(((servers.filter((server) => server.agent === "Online").length + applications.filter((app) => app.status === "Live").length) / (servers.length + applications.length)) * 100);
  const filtersActive = [serverFilter, providerFilter, severityFilter, statusFilter].some((value) => value !== "All") || range !== "24h";
  const selectedServer = selected?.serverId ? servers.find((server) => server.id === selected.serverId) : null;

  function selectIncident(id: string) {
    setSelectedId(id);
    window.history.replaceState(null, "", `/dashboard/operations?incident=${id}`);
  }

  function clearFilters() {
    setRange("24h");
    setServerFilter("All");
    setProviderFilter("All");
    setSeverityFilter("All");
    setStatusFilter("All");
  }

  function runMitigation() {
    if (!selected) return;
    if (!window.confirm(`Run mitigation for ${selected.title}? This frontend will simulate the recovery workflow and update shared state.`)) return;
    mitigateIncident(selected.id);
  }

  function submitResolution() {
    if (!selected || !summary.trim()) return;
    resolveIncident(selected.id, summary, rootCause);
    setResolveOpen(false);
    setSummary("");
  }

  return (
    <div className="page ops-page">
      <header className="overview-header">
        <div>
          <p className="eyebrow">COMMAND CENTER</p>
          <h2>Operational Health</h2>
          <p className="muted">Incidents, provider performance and service telemetry.</p>
        </div>
        <Link className="text-link" href="/dashboard/documentation?topic=monitoring&from=/dashboard/operations">View documentation -&gt;</Link>
      </header>

      <section className="estate-kpi-grid">
        <Metric label="Active incidents" value={String(activeIncidents.length)} detail="Unresolved operational signals" tone="Warning" />
        <Metric label="Critical incidents" value={String(criticalIncidents.length)} detail="Legal Sandbox offline" tone={criticalIncidents.length ? "Critical" : "Healthy"} />
        <Metric label="Affected workspaces" value={String(affectedWorkspaces)} detail="Workspace or service impact" tone="Warning" />
        <Metric label="Service availability" value={`${serviceAvailability}%`} detail="Servers and workspaces healthy" tone={serviceAvailability >= 95 ? "Healthy" : "Warning"} />
      </section>

      <section className="filter-toolbar" aria-label="Monitoring filters">
        <div className="segmented-control">
          {["24h", "7d", "30d"].map((item) => <button key={item} className={range === item ? "active" : ""} type="button" onClick={() => setRange(item)}>{item}</button>)}
        </div>
        <select className="field" value={serverFilter} onChange={(event) => setServerFilter(event.target.value)} aria-label="Server filter"><option value="All">All servers</option>{servers.map((server) => <option value={server.id} key={server.id}>{server.name}</option>)}</select>
        <select className="field" value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)} aria-label="Provider filter"><option>All</option><option>OpenAI</option></select>
        <select className="field" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} aria-label="Severity filter"><option>All</option><option>Critical</option><option>Warning</option><option>Info</option></select>
        <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Status filter"><option>All</option><option>Open</option><option>Acknowledged</option><option>Mitigating</option><option>Ready to resolve</option><option>Resolved</option></select>
        {filtersActive ? <button className="button secondary" type="button" onClick={clearFilters}>Clear filters</button> : null}
      </section>

      <section className="incident-layout">
        <Card>
          <div className="card-header"><div><h3>Incident queue</h3><p className="muted">{filteredIncidents.length} matching incidents</p></div></div>
          <div className="incident-queue">
            {filteredIncidents.map((incident) => (
              <button key={incident.id} type="button" className={`incident-row ${incident.id === selected?.id ? "active" : ""}`} onClick={() => selectIncident(incident.id)}>
                <span><StatusBadge value={incident.severity} /></span>
                <strong>{incident.title}</strong>
                <small>{incident.affected} - {incident.age} - {incident.status}</small>
              </button>
            ))}
            {!filteredIncidents.length ? <div className="empty-state">No incidents match these filters.</div> : null}
          </div>
        </Card>

        {selected ? (
          <Card className="incident-detail">
            <div className="card-header">
              <div>
                <div className="row" style={{ justifyContent: "flex-start" }}><StatusBadge value={selected.severity} /><StatusBadge value={selected.status} /></div>
                <h3>{selected.title}</h3>
                <p className="muted">{selected.businessImpact}</p>
              </div>
            </div>
            <div className="incident-detail-body">
              <div className="detail-grid">
                <Detail label="Affected services" value={selected.affectedServices.join(", ")} />
                <Detail label="Status, owner and opened" value={`${selected.status} - ${selected.owner} - ${selected.openedAt}`} />
                <Detail label="Technical evidence" value={selected.evidence} />
                <Detail label="Recommended action" value={selected.recommendedAction} />
              </div>
              <div className="incident-actions" aria-live="polite">
                <button className="button secondary" type="button" onClick={() => acknowledgeIncident(selected.id)} disabled={selected.status === "Resolved"}>Acknowledge</button>
                <button className="button" type="button" onClick={runMitigation} disabled={selected.status === "Resolved" || selected.status === "Mitigating"}>{selected.serverId ? "Restart agent" : "Run mitigation"}</button>
                <button className="button secondary" type="button" onClick={() => setResolveOpen(true)} disabled={selected.status !== "Ready to resolve"}>Resolve</button>
              </div>
              {selected.status === "Mitigating" ? <div className="callout">Mitigation running. Server state and incident timeline will update automatically.</div> : null}
              <div className="tabs">
                {["Timeline", "Telemetry", "Related resources", "Resolution"].map((tab) => <button key={tab} className={`tab ${activeTab === tab ? "active" : ""}`} type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}
              </div>
              {activeTab === "Timeline" ? <div className="timeline-list">{selected.timeline.map((event) => <div className="timeline-row" key={`${event.time}-${event.event}`}><strong>{event.time}</strong><span>{event.actor}</span><p>{event.event} - {event.outcome}</p></div>)}</div> : null}
              {activeTab === "Telemetry" ? <div className="detail-grid"><Detail label="Server state" value={selectedServer ? `${selectedServer.agent}, ${selectedServer.heartbeat}` : "Provider-level incident"} /><Detail label="Estimated cost exposure" value={selected.provider ? aed(4200) : "n/a"} /></div> : null}
              {activeTab === "Related resources" ? <div className="detail-grid"><Detail label="Server" value={selectedServer?.name ?? "External provider"} /><Detail label="Workspace" value={selected.affected} /></div> : null}
              {activeTab === "Resolution" ? <div className="detail-grid"><Detail label="Root cause" value={selected.rootCause ?? "Not resolved"} /><Detail label="Summary" value={selected.resolutionSummary ?? "Resolution summary required before closure."} /></div> : null}
            </div>
          </Card>
        ) : null}
      </section>

      <section className="overview-trend-grid">
        <Card pad className="chart-card">
          <div className="chart-card-header"><div><h3>Request latency</h3><p className="muted">P95 latency increased after provider degradation while local traffic remained within SLA.</p></div></div>
          <div className="overview-chart" role="img" aria-label="P50 and P95 latency with SLA threshold.">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={latencySeries}><CartesianGrid stroke="#eef2f7" vertical={false} /><XAxis dataKey="time" /><YAxis tickFormatter={(value) => `${value}ms`} /><Tooltip formatter={(value: unknown) => `${value} ms`} /><Legend /><ReferenceLine y={1200} stroke="#F59E0B" strokeDasharray="4 4" label="SLA" /><Line type="monotone" dataKey="p50" name="P50 latency" stroke="#5B3DFF" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="p95" name="P95 latency" stroke="#E11D48" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </Card>
        <Card pad className="chart-card">
          <div className="chart-card-header"><div><h3>GPU utilisation</h3><p className="muted">Claims GPU remained above the warning threshold for 34 minutes.</p></div></div>
          <div className="overview-chart" role="img" aria-label="GPU utilisation by server with warning and critical thresholds.">
            <ResponsiveContainer width="100%" height="100%"><LineChart data={gpuSeries}><CartesianGrid stroke="#eef2f7" vertical={false} /><XAxis dataKey="time" /><YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} /><Tooltip formatter={(value: unknown) => `${value}%`} /><Legend /><ReferenceLine y={85} stroke="#F59E0B" strokeDasharray="4 4" label="Warning" /><ReferenceLine y={95} stroke="#E11D48" strokeDasharray="4 4" label="Critical" /><Line type="monotone" dataKey="claims" name="Claims" stroke="#E11D48" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="acme" name="Acme Azure" stroke="#5B3DFF" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="aws" name="AWS Private" stroke="#16C7E8" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
          </div>
        </Card>
      </section>

      <Card>
        <div className="card-header"><div><h3>Provider and service health</h3><p className="muted">Operational states that affect service delivery.</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Resource</th><th>Type</th><th>State</th><th>Impact</th><th>Since</th><th>Action</th></tr></thead><tbody>
          <tr><td><strong>OpenAI</strong></td><td>Provider</td><td><StatusBadge value="Warning" /></td><td>GPT-4o latency elevated</td><td>48 sec</td><td><Link className="table-action" href="/dashboard/safeguards">Review routing</Link></td></tr>
          <tr><td><strong>Legal Sandbox</strong></td><td>Server</td><td><StatusBadge value={servers.find((server) => server.id === "legal-sandbox")?.agent ?? "Offline"} /></td><td>Legal workspace availability</td><td>42 min</td><td><Link className="table-action" href="/dashboard/infrastructure/legal-sandbox">Open server</Link></td></tr>
          <tr><td><strong>Local vLLM</strong></td><td>Runtime</td><td>Healthy</td><td>Local model routes available</td><td>Now</td><td><Link className="table-action" href="/dashboard/stacks">View deployment</Link></td></tr>
        </tbody></table></div>
      </Card>

      {resolveOpen && selected ? (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="resolve-title">
            <div className="modal-header"><div><p className="eyebrow">Incident resolution</p><h3 id="resolve-title">Resolve {selected.title}</h3><p className="muted">Resolution requires a summary and root-cause category.</p></div><button className="button secondary" type="button" onClick={() => setResolveOpen(false)}>Close</button></div>
            <div className="modal-body">
              <label className="field-group"><span className="metric-label">Resolution summary</span><input className="field" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe what recovered and how it was verified." /></label>
              <label className="field-group"><span className="metric-label">Root-cause category</span><select className="field" value={rootCause} onChange={(event) => setRootCause(event.target.value)}><option>Agent connectivity</option><option>Provider degradation</option><option>Capacity pressure</option><option>Configuration drift</option></select></label>
              <div className="callout">Confirm service recovered before resolving. If the server is still offline, add that context to the summary.</div>
            </div>
            <div className="modal-footer"><button className="button secondary" type="button" onClick={() => setResolveOpen(false)}>Cancel</button><button className="button" type="button" disabled={!summary.trim()} onClick={submitResolution}>Resolve incident</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return <Card pad><span className="metric-label">{label}</span><div className="metric-value">{value}</div><p className="muted">{detail}</p><span className={`kpi-status ${tone.toLowerCase()}`}>{tone}</span></Card>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><span className="metric-label">{label}</span><p><strong>{value}</strong></p></div>;
}
