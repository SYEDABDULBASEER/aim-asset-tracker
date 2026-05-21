import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/AuthProvider";
import { isStaffRole } from "@/lib/auth/roles";
import {
  ADMIN_ALLOCATION_PATH,
  ADMIN_ASSETS_PATH,
  ADMIN_EMPLOYEES_PATH,
  ADMIN_HOME_PATH,
  ADMIN_MAINTENANCE_PATH,
  ADMIN_REPORTS_PATH,
  ADMIN_SETTINGS_PATH,
  ADMIN_TICKETS_PATH,
  ADMIN_VENDORS_PATH,
} from "@/lib/auth/routing";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Wrench,
  Ticket,
  Users,
  Building2,
  BarChart3,
  Settings,
  Boxes,
} from "lucide-react";

const items = [
  { title: "Dashboard", url: ADMIN_HOME_PATH, icon: LayoutDashboard },
  { title: "Assets", url: ADMIN_ASSETS_PATH, icon: Package },
  { title: "Asset Allocation", url: ADMIN_ALLOCATION_PATH, icon: ArrowLeftRight },
  { title: "Maintenance", url: ADMIN_MAINTENANCE_PATH, icon: Wrench },
  { title: "Tickets", url: ADMIN_TICKETS_PATH, icon: Ticket },
  { title: "Employees", url: ADMIN_EMPLOYEES_PATH, icon: Users },
  { title: "Vendors", url: ADMIN_VENDORS_PATH, icon: Building2 },
  { title: "Reports", url: ADMIN_REPORTS_PATH, icon: BarChart3 },
  { title: "Settings", url: ADMIN_SETTINGS_PATH, icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  /** Settings is visible to all IT staff; seeding inside Settings requires admin role. */
  const navItems = isStaffRole(role) ? items : items.filter((item) => item.url !== ADMIN_SETTINGS_PATH);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
          <Boxes className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-white">Asset Desk</div>
          <div className="text-[11px] text-sidebar-foreground/60">IT Admin Workspace</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
          Admin
        </div>
        {navItems.map((item) => {
          const active =
            item.url === ADMIN_HOME_PATH
              ? pathname === ADMIN_HOME_PATH || pathname === `${ADMIN_HOME_PATH}/`
              : pathname.startsWith(item.url);
          return (
            <Link
              key={item.url}
              to={item.url}
              preload="intent"
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-white font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
              ].join(" ")}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border">
        <div className="rounded-lg bg-sidebar-accent/60 p-3">
          <div className="text-xs font-medium text-white">Storage</div>
          <div className="mt-2 h-1.5 bg-sidebar-border rounded-full overflow-hidden">
            <div className="h-full w-[64%] bg-sidebar-primary rounded-full" />
          </div>
          <div className="mt-1.5 text-[11px] text-sidebar-foreground/60">6.4 GB of 10 GB used</div>
        </div>
      </div>
    </aside>
  );
}
