"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  Bell,
  Bot,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  Database,
  FileClock,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  Layers,
  Network,
  Route,
  Search,
  Server,
  Settings,
  ShieldCheck,
  Users,
  WalletCards
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { organization } from "@/lib/mock-data";
import { StatusBadge } from "./ui";

const nav = [
  { group: "Command Center", items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/dashboard/operations", label: "Monitoring", icon: Activity }] },
  { group: "Infrastructure", items: [{ href: "/dashboard/infrastructure", label: "Servers", icon: Server }, { href: "/dashboard/stacks", label: "Stacks", icon: Layers }] },
  { group: "AI Management", items: [{ href: "/dashboard/model-catalog", label: "Models & Providers", icon: Brain }, { href: "/dashboard/safeguards", label: "Routing Policies", icon: Route }, { href: "/dashboard/applications", label: "AI Workspaces", icon: Network }, { href: "/dashboard/knowledge", label: "Knowledge Bases", icon: Database }, { href: "/dashboard/agents", label: "Governed Agents", icon: Bot }] },
  { group: "Organisation", items: [{ href: "/dashboard/teams", label: "Teams", icon: Users }] },
  { group: "Governance", items: [{ href: "/dashboard/audit", label: "Audit Logs", icon: FileClock }, { href: "/dashboard/compliance", label: "Compliance Readiness", icon: ShieldCheck }] },
  { group: "Optimisation", items: [{ href: "/dashboard/resource-planner", label: "Resource Planner", icon: Gauge }, { href: "/dashboard/cost-capacity", label: "Cost & Capacity", icon: WalletCards }] },
  { group: "System", items: [{ href: "/dashboard/settings", label: "Settings", icon: Settings }, { href: "/dashboard/documentation", label: "Documentation", icon: BookOpen }] }
];

const commands = [
  { label: "Open Overview", description: "AI estate health and next actions", href: "/dashboard" },
  { label: "Open Monitoring", description: "Provider, server and budget signals", href: "/dashboard/operations" },
  { label: "Open Servers", description: "Register and inspect infrastructure", href: "/dashboard/infrastructure" },
  { label: "Create AI Workspace", description: "Configure a governed employee workspace", href: "/dashboard/applications" },
  { label: "Open Models & Providers", description: "Manage local and external models", href: "/dashboard/model-catalog" },
  { label: "Open Routing Policies", description: "Control data boundaries and fallbacks", href: "/dashboard/safeguards" },
  { label: "Open Teams", description: "Manage users, roles and effective access", href: "/dashboard/teams" },
  { label: "Open Audit Logs", description: "Review simulated control-plane events", href: "/dashboard/audit" },
  { label: "Open Documentation", description: "Read product workflows and manual guidance", href: "/dashboard/documentation" }
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const commandRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("switchboard-sidebar-collapsed") === "true");
  }, []);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return commands.filter((command) => {
      const haystack = `${command.label} ${command.description}`.toLowerCase();
      return !needle || haystack.includes(needle);
    }).slice(0, 7);
  }, [query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
        commandInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        commandInputRef.current?.blur();
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  function toggleSidebar() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("switchboard-sidebar-collapsed", String(next));
      return next;
    });
  }

  function openCommand(index = selectedIndex) {
    const command = matches[index];
    if (!command) return;
    setCommandOpen(false);
    setQuery("");
    router.push(command.href);
  }

  function handleCommandKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((current) => Math.min(current + 1, matches.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((current) => Math.max(current - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      openCommand();
    }
  }

  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <Link href="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-copy"><h1>Switchboard AI</h1><p>AI workspace control plane</p></span>
          </Link>
          <button className="sidebar-toggle" type="button" onClick={toggleSidebar} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button>
        </div>
        {nav.map((section) => (
          <nav className="nav-section" key={section.group} aria-label={section.group}>
            <div className="nav-label">{section.group}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} className={`nav-link ${active ? "active" : ""}`} title={item.label} aria-label={item.label}><span className="nav-icon" aria-hidden="true"><Icon size={16} strokeWidth={2} /></span><span>{item.label}</span></Link>;
            })}
          </nav>
        ))}
      </aside>
      <main className="main">
        <header className="topbar">
          <div className="topbar-left"><strong>{organization.name}</strong><span className="environment-pill">Sandbox</span></div>
          <div className="command-shell" ref={commandRef}>
            <label className="command" htmlFor="global-command" role="combobox" aria-expanded={commandOpen} aria-controls="global-command-menu" aria-haspopup="listbox">
              <Search size={15} aria-hidden="true" />
              <input ref={commandInputRef} id="global-command" value={query} onFocus={() => setCommandOpen(true)} onKeyDown={handleCommandKeyDown} onChange={(event) => { setQuery(event.target.value); setCommandOpen(true); }} placeholder="Search or run command..." aria-autocomplete="list" aria-activedescendant={commandOpen ? `command-${selectedIndex}` : undefined} />
              <kbd>Ctrl K</kbd>
            </label>
            {commandOpen ? (
              <div className="command-menu" id="global-command-menu" role="listbox" aria-label="Global command results">
                {matches.length ? matches.map((command, index) => (
                  <button
                    className={index === selectedIndex ? "selected" : ""}
                    id={`command-${index}`}
                    key={command.href}
                    role="option"
                    aria-selected={index === selectedIndex}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => openCommand(index)}
                  >
                    <strong>{command.label}</strong>
                    <span>{command.description}</span>
                  </button>
                )) : <div className="command-empty">No matching command.</div>}
              </div>
            ) : null}
          </div>
          <div className="topbar-actions"><StatusBadge value={`AI Ops: ${organization.aiOpsStatus}`} /><Link className="icon-button" href="/dashboard/operations" aria-label="Open alerts"><Bell size={16} /><span>3</span></Link><Link className="icon-button" href="/dashboard/documentation" aria-label="Open documentation"><HelpCircle size={17} /></Link></div>
        </header>
        {children}
      </main>
    </div>
  );
}
