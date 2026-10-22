"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useSignOut } from "@/hooks/useAuth";
import { useMemberSite } from "@/features/site/queries";
import { DynamicIcon } from "@/components/DynamicIcon";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavItem } from "@/features/site/types";

function isUnder(pathname: string, base: string | null) {
  if (!base) return false;
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function MemberSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const signOutLocal = useSignOut();
  const site = useMemberSite();
  const items = [...(site.data?.navigation.sidebar ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const settings = site.data?.settings;
  // Explicit user toggles; hubs default to open when the current route is inside them.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  function signOut() {
    signOutLocal("/");
  }

  function renderLink(item: NavItem, first: boolean) {
    const href = item.href ?? "#";
    if (item.highlight) {
      return (
        <Link
          key={item.id}
          href={href}
          onClick={onNavigate}
          className={`${first ? "" : "mt-2 "}flex items-center gap-3 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90`}
        >
          <DynamicIcon name={item.icon} className="h-4 w-4" /> {item.label}
        </Link>
      );
    }
    return (
      <Link
        key={item.id}
        href={href}
        onClick={onNavigate}
        className={`${first ? "" : "mt-2 "}flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
          pathname === item.href ? "bg-sidebar-accent" : ""
        }`}
      >
        <DynamicIcon name={item.icon} className="h-4 w-4" /> {item.label}
      </Link>
    );
  }

  function renderHub(hub: NavItem, first: boolean) {
    const key = hub.id;
    const isOpen = toggled[key] ?? isUnder(pathname, hub.href);
    const children = [...(hub.children ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
    return (
      <div key={key} className={first ? "" : "mt-2"}>
        <button
          onClick={() => setToggled((o) => ({ ...o, [key]: !isOpen }))}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent"
          aria-expanded={isOpen}
        >
          <DynamicIcon name={hub.icon} className="h-4 w-4" />
          <span className="flex-1 text-left">{hub.label}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
        {isOpen && (
          <div className="ml-7 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
            {children.map((item) => (
              <Link
                key={item.id}
                href={item.href ?? "#"}
                onClick={onNavigate}
                className={`rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-sidebar-accent ${
                  pathname === item.href ? "bg-sidebar-accent font-semibold" : "text-sidebar-foreground/75"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        {settings ? (
          <>
            <Link href="/" className="font-display text-xl font-semibold">{settings.name}</Link>
            {settings.tagline && (
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
                {settings.tagline}
              </p>
            )}
          </>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-6 w-28 bg-sidebar-accent" />
            <Skeleton className="h-3 w-36 bg-sidebar-accent" />
          </div>
        )}
      </div>
      <nav className="scrollbar-sidebar flex-1 overflow-y-auto px-3 py-4">
        {site.isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className={`h-9 w-full bg-sidebar-accent ${i ? "mt-2" : ""}`} />
          ))}
        {site.error && !site.data && (
          <p className="px-3 py-2 text-xs text-sidebar-foreground/60">Navigation could not be loaded.</p>
        )}
        {items.map((item, i) =>
          item.children && item.children.length > 0 ? renderHub(item, i === 0) : renderLink(item, i === 0),
        )}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
