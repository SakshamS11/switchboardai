import { AppStateProvider } from "@/components/app-state";
import { AccessManager } from "@/components/access-manager";
import { DashboardShell } from "@/components/shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppStateProvider><DashboardShell>{children}</DashboardShell><AccessManager /></AppStateProvider>;
}
