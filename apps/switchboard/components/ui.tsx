import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

export function StatusBadge({ value }: { value: string }) {
  const key = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return <span className={`badge ${key}`}>{value}</span>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  const documentationHref = `/dashboard/documentation?topic=${encodeURIComponent(title)}`;
  return (
    <div className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      <div className="page-actions">
        <Link className="button secondary" href={documentationHref}>View Documentation</Link>
        {action}
      </div>
    </div>
  );
}

export function Card({ children, pad = false, className = "", style }: { children: ReactNode; pad?: boolean; className?: string; style?: CSSProperties }) {
  return <section className={`card ${pad ? "pad" : ""} ${className}`} style={style}>{children}</section>;
}

export function MetricCard({ label, value, detail, status }: { label: string; value: string; detail: string; status?: string }) {
  return (
    <Card pad>
      <div className="row">
        <span className="metric-label">{label}</span>
        {status ? <StatusBadge value={status} /> : null}
      </div>
      <div className="metric-value">{value}</div>
      <p className="muted">{detail}</p>
    </Card>
  );
}

export function Progress({ value }: { value: number }) {
  const tone = value >= 90 ? "critical" : value >= 75 ? "warning" : "";
  return <div className={`progress ${tone}`} aria-label={`${value}%`}><span style={{ width: `${Math.min(100, value)}%` }} /></div>;
}

export function ButtonLink({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link className={`button ${secondary ? "secondary" : ""}`} href={href}>{children}</Link>;
}
