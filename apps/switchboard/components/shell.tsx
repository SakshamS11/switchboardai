"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { organization } from "@/lib/mock-data";
import { StatusBadge } from "./ui";

const nav = [
  { group: "Command Center", items: [{ href: "/dashboard", label: "Overview" }, { href: "/dashboard/operations", label: "Incidents" }] },
  { group: "Build", items: [{ href: "/dashboard/applications", label: "AI Applications" }, { href: "/dashboard/knowledge", label: "Knowledge Bases" }, { href: "/dashboard/agents", label: "Governed Agents" }] },
  { group: "Control", items: [{ href: "/dashboard/model-catalog", label: "Models & Providers" }, { href: "/dashboard/safeguards", label: "Routing Policies" }, { href: "/dashboard/teams", label: "Teams & Access" }] },
  { group: "Operate", items: [{ href: "/dashboard/infrastructure", label: "Infrastructure" }, { href: "/dashboard/cost-capacity", label: "Cost & Capacity" }, { href: "/dashboard/audit", label: "Audit & Evidence" }] },
  { group: "System", items: [{ href: "/dashboard/settings", label: "Settings" }] }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("switchboard-sidebar-collapsed") === "true");
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("switchboard-sidebar-collapsed", String(next));
      return next;
    });
  }

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <Link href="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-copy"><h1>Switchboard AI</h1><p>AI application control plane</p></span>
          </Link>
          <button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? ">" : "<"}</button>
        </div>
        {nav.map((section) => (
          <nav className="nav-section" key={section.group} aria-label={section.group}>
            <div className="nav-label">{section.group}</div>
            {section.items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`} title={item.label}><span>{item.label}</span></Link>;
            })}
          </nav>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-left"><strong>{organization.name}</strong><span className="muted">Production</span><StatusBadge value={`AI Ops: ${organization.aiOpsStatus}`} /></div>
          <div className="command"><span>Search or run command...</span><kbd>Ctrl K</kbd></div>
          <div className="topbar-actions"><StatusBadge value="Metadata only" /><Link className="button secondary" href="/dashboard/operations">3 alerts</Link><Link className="button" href="/dashboard/applications">Create application</Link></div>
        </header>
        {children}
      </main>
    </div>
  );
}
