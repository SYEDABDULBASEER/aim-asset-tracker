import { createServerFn } from "@tanstack/react-start";
import { listAllAuditLogs } from "@/lib/audit/write-audit";
import { getWarrantyBand } from "@/lib/asset-warranty";
import { requireRead } from "@/lib/auth/require-auth";
import { loadAllAssets } from "./assets-source.server";
import { loadAllTickets } from "./tickets-source.server";
import { DEPARTMENT_OPTIONS } from "@/lib/departments";
import type { Ticket } from "@/lib/models";

type Tone = "success" | "warning" | "info" | "danger" | "muted";

function toneRank(t: Tone): number {
  return t === "danger" ? 4 : t === "warning" ? 3 : t === "info" ? 2 : t === "success" ? 1 : 0;
}

export type DashboardAlert = {
  tone: Tone;
  title: string;
  detail: string;
  ctaLabel?: string;
  ctaTo?: string;
};

export type DashboardSummary = {
  totals: {
    totalAssets: number;
    activeAssets: number;
    underRepair: number;
    available: number;
    lost: number;
    retired: number;
    unassigned: number;
    warrantyExpired: number;
    warrantyExpiring: number;
  };
  /** Service desk snapshot (authoritative when tickets collection / store is populated). */
  tickets: {
    open: number;
    slaBreached: number;
    /** Open tickets submitted from the public “Report an issue” page (for admin attention). */
    userPortalOpen: Array<{
      id: string;
      title: string;
      requesterName: string | null;
      priority: string;
      createdAt: string;
    }>;
    recent: Array<{
      id: string;
      title: string;
      assetId: string | null;
      priority: string;
      status: string;
      updatedAt: string;
    }>;
    volumeLast7Days: Array<{ day: string; Open: number; Resolved: number }>;
  };
  byCategory: Array<{ name: string; value: number }>;
  byDepartment: Array<{ name: string; value: number }>;
  /** Desktop assets split by department (randomized for visual demo). */
  byDesktopDepartment: Array<{ name: string; value: number }>;
  alerts: DashboardAlert[];
  recommendedActions: DashboardAlert[];
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actorEmail: string | null;
    createdAt: string;
  }>;
};

function isTerminalTicketStatus(s: string): boolean {
  return s === "Resolved" || s === "Closed";
}

function aggregateTicketVolume(tickets: Ticket[], now = new Date()) {
  const dayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const starts: Date[] = [];
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    starts.push(d);
    labels.push(dayShort[d.getUTCDay()] ?? "?");
  }
  const openCreated = new Array(7).fill(0);
  const resolved = new Array(7).fill(0);
  const endOf = (i: number) => {
    const e = new Date(starts[i]!);
    e.setUTCDate(e.getUTCDate() + 1);
    return e;
  };
  for (const t of tickets) {
    const c = new Date(t.createdAt);
    for (let i = 0; i < 7; i++) {
      if (c >= starts[i]! && c < endOf(i)) {
        openCreated[i] += 1;
        break;
      }
    }
    if (isTerminalTicketStatus(t.status)) {
      const u = new Date(t.updatedAt);
      for (let i = 0; i < 7; i++) {
        if (u >= starts[i]! && u < endOf(i)) {
          resolved[i] += 1;
          break;
        }
      }
    }
  }
  return labels.map((day, i) => ({
    day,
    Open: openCreated[i]!,
    Resolved: resolved[i]!,
  }));
}

export const getDashboardSummary = createServerFn({ method: "GET" }).handler(async () => {
  requireRead("reports");
  const [assets, tickets, auditLogs] = await Promise.all([
    loadAllAssets(),
    loadAllTickets(),
    listAllAuditLogs(),
  ]);

  const now = new Date();

  // Small deterministic PRNG so the “randomized” chart stays stable across refetches
  // (but still changes if the underlying dataset changes).
  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const totals = {
    totalAssets: assets.length,
    activeAssets: assets.filter((a) => a.status === "Active").length,
    underRepair: assets.filter((a) => a.status === "In Repair").length,
    available: assets.filter((a) => a.status === "Available").length,
    lost: assets.filter((a) => a.status === "Lost").length,
    retired: assets.filter((a) => a.status === "Retired").length,
    unassigned: assets.filter((a) => !a.assignedTo || a.assignedTo.trim() === "").length,
    warrantyExpired: assets.filter((a) => getWarrantyBand(a, now) === "expired").length,
    warrantyExpiring: assets.filter((a) => getWarrantyBand(a, now) === "expiring").length,
  };

  const byCategoryMap = new Map<string, number>();
  const byDeptMap = new Map<string, number>();

  for (const a of assets) {
    byCategoryMap.set(a.category, (byCategoryMap.get(a.category) ?? 0) + 1);
    const dept = a.department ?? "Unassigned";
    byDeptMap.set(dept, (byDeptMap.get(dept) ?? 0) + 1);
  }

  const byCategory = Array.from(byCategoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const byDepartment = Array.from(byDeptMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const desktopAssets = assets.filter((a) => a.category === "Desktop");
  const totalDesktopAssets = desktopAssets.length;
  const seed = assets.reduce((acc, a) => {
    const id0 = a.id.charCodeAt(0) ?? 0;
    const deptLen = a.department?.length ?? 0;
    return acc + id0 + deptLen * 7 + a.category.length * 13;
  }, 0);
  const rng = mulberry32(seed + totalDesktopAssets * 101);

  // Generate random department-wise split for *desktop* category only.
  const desktopDeptWeights = DEPARTMENT_OPTIONS.map(() => 0.2 + rng());
  const weightSum = desktopDeptWeights.reduce((s, w) => s + w, 0) || 1;
  const raw = desktopDeptWeights.map((w) => (totalDesktopAssets * w) / weightSum);
  const floors = raw.map((v) => Math.floor(v));
  let remainder = totalDesktopAssets - floors.reduce((s, n) => s + n, 0);
  const fractions = raw
    .map((v, i) => ({ i, frac: v - floors[i]! }))
    .sort((a, b) => b.frac - a.frac);
  while (remainder > 0) {
    const idx = fractions[remainder % fractions.length]?.i ?? 0;
    floors[idx] += 1;
    remainder -= 1;
  }
  const byDesktopDepartment = DEPARTMENT_OPTIONS.map((name, i) => ({
    name,
    value: floors[i]!,
  })).sort((a, b) => b.value - a.value);

  const openTickets = tickets.filter((t) => t.status !== "Closed").length;
  const slaBreached = tickets.filter(
    (t) =>
      !isTerminalTicketStatus(t.status) &&
      t.slaDueAt &&
      new Date(t.slaDueAt).getTime() < now.getTime(),
  ).length;

  const recent = [...tickets]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0))
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      title: t.title,
      assetId: t.assetId,
      priority: t.priority,
      status: t.status,
      updatedAt: t.updatedAt,
    }));

  const userPortalOpen = tickets
    .filter((t) => t.openedVia === "user_portal" && t.status === "Open")
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(0, 20)
    .map((t) => ({
      id: t.id,
      title: t.title,
      requesterName: t.requesterName,
      priority: t.priority,
      createdAt: t.createdAt,
    }));

  const volumeLast7Days = aggregateTicketVolume(tickets, now);

  const recentActivity = auditLogs
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
    .slice(0, 10)
    .map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorEmail: entry.actorEmail,
      createdAt: entry.createdAt,
    }));

  const alerts: DashboardAlert[] = [];
  if (totals.lost > 0) {
    alerts.push({
      tone: "danger",
      title: "Lost assets require immediate closure",
      detail: `${totals.lost} assets marked Lost. Confirm custody, lock devices (if applicable), and complete incident records.`,
      ctaLabel: "Review assets",
      ctaTo: "/admin/assets",
    });
  }
  if (totals.underRepair > 0) {
    alerts.push({
      tone: "warning",
      title: "Repair backlog impacting productivity",
      detail: `${totals.underRepair} assets are in repair. Validate vendor ETAs and ensure loaner coverage for critical roles.`,
      ctaLabel: "View maintenance",
      ctaTo: "/admin/maintenance",
    });
  }
  if (totals.warrantyExpired > 0) {
    alerts.push({
      tone: "warning",
      title: "Warranty coverage gaps",
      detail: `${totals.warrantyExpired} assets have expired warranty. Prioritize refresh or extend coverage for high-usage categories.`,
      ctaLabel: "Review assets",
      ctaTo: "/admin/assets",
    });
  }
  if (totals.unassigned > 0) {
    alerts.push({
      tone: "info",
      title: "Inventory hygiene: unassigned assets",
      detail: `${totals.unassigned} assets have no assignee. Confirm stock ownership and storage location to reduce audit risk.`,
      ctaLabel: "Review allocation",
      ctaTo: "/admin/allocation",
    });
  }
  if (slaBreached > 0) {
    alerts.push({
      tone: "danger",
      title: "Ticket SLA breaches require escalation",
      detail: `${slaBreached} active tickets are past their response target. Rebalance queue ownership and notify stakeholders.`,
      ctaLabel: "Open tickets",
      ctaTo: "/admin/tickets",
    });
  }
  if (userPortalOpen.length > 0) {
    alerts.push({
      tone: "info",
      title: "User help desk submissions",
      detail: `${userPortalOpen.length} open request(s) came from the public “Report an issue” page.`,
      ctaLabel: "Review tickets",
      ctaTo: "/admin/tickets",
    });
  }

  const recommendedActions: DashboardAlert[] = [
    {
      tone: totals.lost > 0 ? ("danger" as const) : ("info" as const),
      title: "Enforce asset custody & incident workflow",
      detail:
        "Standardize “Lost/Stolen” runbooks, require manager attestation, and integrate device-lock/wipe where applicable.",
      ctaLabel: "Open policies",
      ctaTo: "/admin/settings",
    },
    {
      tone: totals.underRepair > 0 ? ("warning" as const) : ("info" as const),
      title: "Optimize repair SLA and loaner pool",
      detail:
        "Set repair SLAs by priority, track vendor performance weekly, and maintain loaners for top roles and departments.",
      ctaLabel: "Check vendors",
      ctaTo: "/admin/vendors",
    },
    {
      tone:
        totals.warrantyExpiring + totals.warrantyExpired > 0
          ? ("warning" as const)
          : ("info" as const),
      title: "Plan warranty renewals and refresh cycles",
      detail:
        "Quarterly refresh planning reduces emergency spend; renew warranties only for devices with ≥12 months expected use.",
      ctaLabel: "View reports",
      ctaTo: "/admin/reports",
    },
  ].sort((a, b) => toneRank(b.tone) - toneRank(a.tone));

  return {
    totals,
    tickets: {
      open: openTickets,
      slaBreached,
      userPortalOpen,
      recent,
      volumeLast7Days,
    },
    byCategory,
    byDepartment,
    byDesktopDepartment,
    alerts: alerts.sort((a, b) => toneRank(b.tone) - toneRank(a.tone)),
    recommendedActions,
    recentActivity,
  } satisfies DashboardSummary;
});
