"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { organization } from "@/lib/mock-data";
import { StatusBadge } from "./ui";

const nav = [
  { group: "Command Center", items: [{ href: "/dashboard", label: "Estate Overview" }, { href: "/dashboard/operations", label: "Health & Operations" }] },
  { group: "Build", items: [{ href: "/dashboard/applications", label: "AI Applications" }, { href: "/dashboard/knowledge", label: "Knowledge Bases" }, { href: "/dashboard/agents", label: "Governed Agents" }] },
  { group: "Control", items: [{ href: "/dashboard/model-catalog", label: "Model Catalog" }, { href: "/dashboard/safeguards", label: "Safeguards & Routing" }, { href: "/dashboard/teams", label: "Teams & Access" }] },
  { group: "Operate", items: [{ href: "/dashboard/infrastructure", label: "Infrastructure" }, { href: "/dashboard/cost-capacity", label: "Cost & Capacity" }, { href: "/dashboard/audit", label: "Audit & Evidence" }] },
  { group: "System", items: [{ href: "/dashboard/settings", label: "Settings" }] }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span><h1>Switchboard AI</h1><p>AI application control plane</p></span>
        </Link>
        {nav.map((section) => (
          <nav className="nav-section" key={section.group} aria-label={section.group}>
            <div className="nav-label">{section.group}</div>
            {section.items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`}>{item.label}</Link>;
            })}
          </nav>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="row" style={{ gap: 10 }}><strong>{organization.name}</strong><span className="muted">Production</span><StatusBadge value={organization.aiOpsStatus} /></div>
          <div className="command"><span>Search applications, models, policies...</span><kbd>Ctrl K</kbd></div>
          <div className="row" style={{ gap: 10 }}><StatusBadge value="Demo" /><span className="muted">Metadata only</span></div>
        </header>
        {children}
      </main>
    </div>
  );
}
