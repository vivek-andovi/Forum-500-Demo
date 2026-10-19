"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePublicSite } from "@/lib/queries";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const site = usePublicSite();
  const brand = site.data?.settings.name ?? "";
  const nav = (site.data?.navigation.header ?? [])
    .filter((item) => item.href)
    .map((item) => ({ to: item.href as string, label: item.label, id: item.id }));
  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold tracking-tight">
            {brand || <span className="inline-block h-6 w-28 animate-pulse rounded bg-muted align-middle" />}
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={item.id}
              href={item.to}
              className={`text-sm font-medium transition-colors hover:text-foreground ${
                pathname === item.to ? "text-foreground underline underline-offset-8" : "text-foreground/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/auth"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Member sign in
          </Link>
        </nav>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-border px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {nav.map((item) => (
              <Link key={item.id} href={item.to} onClick={() => setOpen(false)} className="text-sm font-medium">
                {item.label}
              </Link>
            ))}
            <Link
              href="/auth"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
            >
              Member sign in
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
