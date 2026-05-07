import { Outlet } from "@tanstack/react-router";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="min-h-screen w-full flex bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
