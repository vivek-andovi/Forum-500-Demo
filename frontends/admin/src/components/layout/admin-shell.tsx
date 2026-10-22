"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut, Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { groupResources, useMeta } from "@/lib/meta";
import { useApprovals } from "@/lib/queries";
import { NAV_PAGES, resourceIcon } from "@/lib/resource-registry";
import { GROUP_ICONS } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  onNavigate,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  badge?: number;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-primary font-semibold"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {!!badge && (
        <span className="ml-auto rounded-full bg-sidebar-primary px-1.5 text-[10px] font-bold text-sidebar-primary-foreground">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const meta = useMeta();
  const approvals = useApprovals();
  const pendingCount = (approvals.data ?? []).reduce((n, a) => n + (a.count || 0), 0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  return (
    <nav className="scrollbar-sidebar flex-1 space-y-5 overflow-y-auto px-3 pb-6">
      <div className="space-y-0.5">
        {NAV_PAGES.map((p) => (
          <NavLink
            key={p.href}
            href={p.href}
            icon={p.icon}
            label={p.label}
            active={pathname === p.href}
            badge={p.badge === "pendingApprovals" ? pendingCount : undefined}
            onNavigate={onNavigate}
          />
        ))}
      </div>
      {meta.isLoading && (
        <div className="space-y-2 px-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 bg-sidebar-accent" />
          ))}
        </div>
      )}
      {meta.error && (
        <p className="px-2 text-xs text-sidebar-foreground/60">Could not load resources.</p>
      )}
      {meta.data &&
        groupResources(meta.data.resources).map(([group, resources]) => {
          const GroupIcon = GROUP_ICONS[group];
          const isCollapsed = collapsed[group];
          return (
            <div key={group}>
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
                className="flex w-full items-center gap-2 px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-primary/90"
              >
                {GroupIcon && <GroupIcon className="size-3" />}
                {group}
                <ChevronDown
                  className={cn("ml-auto size-3 transition-transform", isCollapsed && "-rotate-90")}
                />
              </button>
              {!isCollapsed && (
                <div className="space-y-0.5">
                  {resources.map((r) => (
                    <NavLink
                      key={r.name}
                      href={`/r/${r.name}${r.defaultQuery ? `?${new URLSearchParams(r.defaultQuery)}` : ""}`}
                      icon={resourceIcon(r.name)}
                      label={r.label}
                      active={pathname === `/r/${r.name}` || pathname.startsWith(`/r/${r.name}/`)}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="block px-5 py-5">
      <span className="font-display text-2xl text-sidebar-foreground">Forum500</span>
      <span className="eyebrow ml-2 !text-[0.6rem] !text-sidebar-primary">Admin</span>
    </Link>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <Brand />
        <SidebarNav />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex w-72 flex-col border-0 bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Brand />
          <SidebarNav onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold uppercase text-primary-foreground">
                    {(user?.email ?? "A").slice(0, 1)}
                  </span>
                  <span className="hidden max-w-48 truncate sm:inline">
                    {user?.email ?? "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
                  {user?.email ?? "Signed in"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="size-4" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={logout} className="hidden sm:inline-flex">
              <LogOut /> Log out
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
