import type { LucideIcon } from "lucide-react";
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
} from "lucide-react";

import type { AppRole } from "@/lib/auth/roles";
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

export type AdminNavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
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

/** Settings is visible to all IT staff; seeding inside Settings requires admin role. */
export function adminNavItemsForRole(role: AppRole | null | undefined): AdminNavItem[] {
  if (isStaffRole(role)) return [...ADMIN_NAV_ITEMS];
  return ADMIN_NAV_ITEMS.filter((item) => item.url !== ADMIN_SETTINGS_PATH);
}

export function isAdminNavItemActive(pathname: string, url: string): boolean {
  if (url === ADMIN_HOME_PATH) {
    return pathname === ADMIN_HOME_PATH || pathname === `${ADMIN_HOME_PATH}/`;
  }
  return pathname.startsWith(url);
}
