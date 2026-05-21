import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, Menu } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { adminNavItemsForRole, isAdminNavItemActive } from "@/components/layout/admin-nav";

export function MobileAdminNav() {
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { role } = useAuth();
  const navItems = adminNavItemsForRole(role);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      const firstLink = navRef.current?.querySelector<HTMLAnchorElement>("a[href]");
      firstLink?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9 shrink-0 -ml-1"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-admin-nav"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent
        id="mobile-admin-nav"
        side="left"
        className="w-72 max-w-[85vw] p-0 gap-0 bg-sidebar text-sidebar-foreground border-sidebar-border [&>button]:text-sidebar-foreground/80"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>IT admin navigation</SheetTitle>
          <SheetDescription>Jump to a workspace section</SheetDescription>
        </SheetHeader>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-sidebar-border">
          <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Boxes className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="leading-tight text-left">
            <div className="text-sm font-semibold text-white">Asset Desk</div>
            <div className="text-[11px] text-sidebar-foreground/60">IT Admin Workspace</div>
          </div>
        </div>
        <nav
          ref={navRef}
          aria-label="IT admin sections"
          className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto"
        >
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
                onClick={() => setOpen(false)}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-white font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-white",
                ].join(" ")}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
