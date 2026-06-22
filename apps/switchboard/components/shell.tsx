"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { organization } from "@/lib/mock-data";
import { StatusBadge } from "./ui";

const nav = [
  { group: "Command Center", items: [{ href: "/dashboard", label: "Overview", icon: "OV" }, { href: "/dashboard/operations", label: "Monitoring", icon: "MO" }] },
  { group: "Infrastructure", items: [{ href: "/dashboard/infrastructure", label: "Servers", icon: "SR" }, { href: "/dashboard/stacks", label: "Stacks", icon: "ST" }] },
  { group: "AI Management", items: [{ href: "/dashboard/model-catalog", label: "Models & Providers", icon: "MP" }, { href: "/dashboard/safeguards", label: "Routing Policies", icon: "RP" }, { href: "/dashboard/applications", label: "AI Workspaces", icon: "AW" }, { href: "/dashboard/knowledge", label: "Knowledge Bases", icon: "KB" }, { href: "/dashboard/agents", label: "Governed Agents", icon: "GA" }] },
  { group: "Organisation", items: [{ href: "/dashboard/teams", label: "Teams", icon: "TM" }] },
  { group: "Governance", items: [{ href: "/dashboard/audit", label: "Audit Logs", icon: "AL" }, { href: "/dashboard/compliance", label: "Compliance Readiness", icon: "CR" }] },
  { group: "Optimisation", items: [{ href: "/dashboard/resource-planner", label: "Resource Planner", icon: "RP" }, { href: "/dashboard/cost-capacity", label: "Cost & Capacity", icon: "CC" }] },
  { group: "System", items: [{ href: "/dashboard/settings", label: "Settings", icon: "SE" }, { href: "/dashboard/documentation", label: "Documentation", icon: "DO" }] }
];

const commands = [
  { label: "Open Overview", href: "/dashboard" },
  { label: "Open Monitoring", href: "/dashboard/operations" },
  { label: "Open Servers", href: "/dashboard/infrastructure" },
  { label: "Create AI Workspace", href: "/dashboard/applications" },
  { label: "Open Models & Providers", href: "/dashboard/model-catalog" },
  { label: "Open Routing Policies", href: "/dashboard/safeguards" },
  { label: "Open Teams", href: "/dashboard/teams" },
  { label: "Open Audit Logs", href: "/dashboard/audit" },
  { label: "Open Documentation", href: "/dashboard/documentation" }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("switchboard-sidebar-collapsed") === "true");
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return commands.filter((command) => !needle || command.label.toLowerCase().includes(needle)).slice(0, 6);
  }, [query]);

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
            <span className="brand-copy"><h1>Switchboard AI</h1><p>AI workspace control plane</p></span>
          </Link>
          <button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? ">" : "<"}</button>
        </div>
        {nav.map((section) => (
          <nav className="nav-section" key={section.group} aria-label={section.group}>
            <div className="nav-label">{section.group}</div>
            {section.items.map((item) => {
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`} title={item.label}><span className="nav-icon">{item.icon}</span><span>{item.label}</span></Link>;
            })}
          </nav>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-left"><strong>{organization.name}</strong><span className="muted">Production</span><StatusBadge value={`AI Ops: ${organization.aiOpsStatus}`} /></div>
          <div className="command-shell">
            <label className="command" htmlFor="global-command">
              <input id="global-command" value={query} onFocus={() => setCommandOpen(true)} onChange={(event) => { setQuery(event.target.value); setCommandOpen(true); }} placeholder="Search or run command..." />
              <kbd>Ctrl K</kbd>
            </label>
            {commandOpen ? (
              <div className="command-menu">
                {matches.map((command) => <Link key={command.href} href={command.href} onClick={() => setCommandOpen(false)}>{command.label}</Link>)}
              </div>
            ) : null}
          </div>
          <div className="topbar-actions"><span title="Switchboard AI stores operational, usage, health, cost and policy metadata. It does not receive conversation content."><StatusBadge value="Operational metadata only" /></span><Link className="button secondary" href="/dashboard/operations">3 alerts</Link><Link className="button secondary" href="/dashboard/documentation">Documentation</Link></div>
        </header>
        {children}
      </main>
    </div>
  );
}
