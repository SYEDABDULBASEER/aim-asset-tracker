import { Link, useRouterState } from "@tanstack/react-router";
import { AppLogo } from "@/components/brand/AppLogo";

import { useAuth } from "@/lib/auth/AuthProvider";
import { adminNavItemsForRole, isAdminNavItemActive } from "@/components/layout/admin-nav";
import { AppBrandName } from "@/components/brand/AppBrandName";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const navItems = adminNavItemsForRole(role);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
        <AppLogo className="h-8 w-auto max-w-[88px] shrink-0" />
        <div className="leading-tight">
          <AppBrandName variant="on-dark" className="text-sm font-semibold" />
          <div className="text-[11px] text-sidebar-foreground/60">IT Admin Workspace</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-sidebar-foreground/50">
          Admin
        </div>
        {navItems.map((item) => {
          const active = isAdminNavItemActive(pathname, item.url);
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
    </aside>
  );
}
