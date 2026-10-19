"use client";

import Link from "next/link";
import { usePublicSite } from "@/lib/queries";
import { Skeleton } from "@/components/ui/skeleton";

export function SiteFooter() {
  const site = usePublicSite();
  const settings = site.data?.settings;
  const columns = site.data?.navigation.footer ?? [];
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          {settings ? (
            <>
              <p className="font-display text-2xl font-semibold">{settings.name}</p>
              {settings.footerBlurb && (
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{settings.footerBlurb}</p>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-4 w-56" />
            </div>
          )}
        </div>
        {site.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
        )}
        {columns.map((col) => (
          <div key={col.id}>
            <p className="eyebrow">{col.label}</p>
            <div className="mt-4 flex flex-col gap-2 text-sm">
              {(col.children ?? []).map((link) =>
                link.href ? (
                  <Link key={link.id} href={link.href} className="text-foreground/80 hover:text-foreground">
                    {link.label}
                  </Link>
                ) : (
                  <span key={link.id} className="text-foreground/80">
                    {link.label}
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
        {settings?.membershipBlurb && (
          <div>
            <p className="eyebrow">{settings.membershipHeading}</p>
            <p className="mt-4 text-sm text-muted-foreground">{settings.membershipBlurb}</p>
          </div>
        )}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        {settings ? <>© {new Date().getFullYear()} {settings.copyright}</> : <span>&nbsp;</span>}
      </div>
    </footer>
  );
}
