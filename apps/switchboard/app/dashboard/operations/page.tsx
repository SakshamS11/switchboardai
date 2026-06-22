"use client";

import Link from "next/link";
import { Card, MetricCard, PageHeader, StatusBadge } from "@/components/ui";
import { operations } from "@/lib/mock-data";

export default function OperationsPage() {
  return <div className="page"><PageHeader eyebrow="Command Center" title="Health & Operations" description="Active incidents, operational signals, provider drift, and immediate response workflows." /><div className="grid kpis"><MetricCard label="Open issues" value={String(operations.length)} detail="Active operational signals" status="Warning" /><MetricCard label="Critical" value="1" detail="Legal Sandbox offline" status="Critical" /><MetricCard label="Fallback routes" value="Armed" detail="Provider degradation policy" status="Healthy" /><MetricCard label="Last update" value="48 sec" detail="Monitoring refresh" status="Healthy" /></div><Card style={{ marginTop: 18 }}><div className="card-header"><div><h3>Incident queue</h3><p className="muted">Immediate response belongs here. Planning items belong in Cost & Capacity.</p></div></div>{operations.map((item) => <Link key={item.title} className="split-row" href={item.href}><div><div className="row" style={{ justifyContent: "flex-start" }}><StatusBadge value={item.severity} /><strong>{item.title}</strong></div><p className="muted">{item.affected} - {item.action}</p></div><span>{item.owner}</span></Link>)}</Card><Card pad style={{ marginTop: 18 }}><h3>Provider health</h3><p className="muted">OpenAI shows elevated latency. Claude fallback is connected. Local Qwen route is safe for sensitive work.</p></Card></div>;
}
