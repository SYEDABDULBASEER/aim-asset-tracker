import { Search, Bell, Plus, ChevronDown } from "lucide-react";

export function Topbar() {
  return (
    <header className="h-16 shrink-0 bg-card border-b border-border flex items-center gap-4 px-6">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search assets, tickets, employees…"
          className="w-full h-10 pl-10 pr-16 rounded-lg bg-muted border border-transparent text-sm focus:bg-card focus:border-border focus:outline-none focus:ring-2 focus:ring-ring/30 transition"
        />
        <kbd className="hidden sm:inline absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground border border-border bg-card rounded px-1.5 py-0.5">⌘K</kbd>
      </div>
      <div className="flex items-center gap-2">
        <button className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition shadow-soft">
          <Plus className="h-4 w-4" /> Quick Add
        </button>
        <button className="relative h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center transition">
          <Bell className="h-4 w-4 text-foreground" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
        </button>
        <button className="flex items-center gap-2 h-9 pl-1 pr-2 rounded-lg hover:bg-muted transition">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-chart-5 text-white text-xs font-semibold flex items-center justify-center">AK</div>
          <div className="hidden sm:block text-left leading-tight">
            <div className="text-xs font-medium">Ahmed Khan</div>
            <div className="text-[10px] text-muted-foreground">Admin</div>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
