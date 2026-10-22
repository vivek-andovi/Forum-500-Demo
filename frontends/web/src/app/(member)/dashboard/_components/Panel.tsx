import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, type LucideIcon } from "lucide-react";

/** Muted one-line placeholder for an empty panel. */
export function Empty({ children = "Nothing here yet." }: { children?: ReactNode }) {
  return <p className="px-2 py-2 text-xs text-muted-foreground">{children}</p>;
}

/** Image with a muted placeholder of the same size when there is no src. */
export function Img({ src, alt, className }: { src: string | null | undefined; alt: string; className: string }) {
  if (!src) return <div className={`${className} bg-muted`} aria-hidden />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading="lazy" className={`${className} object-cover`} />;
}

/** Section title row: icon + title, optional CTA, collapse toggle and hub link. */
export function SectionHeading({
  icon: Icon,
  title,
  to,
  linkLabel,
  collapsed,
  onToggle,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  to: string;
  linkLabel: string;
  collapsed?: boolean;
  onToggle?: () => void;
  cta?: { to: string; label: string };
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2">
      <h2 className="flex items-center gap-2 font-display text-xl font-medium">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </h2>
      <div className="flex items-center gap-3">
        {cta && (
          <Link
            href={cta.to}
            className="rounded-md border border-accent px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-accent-foreground"
          >
            {cta.label}
          </Link>
        )}
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-primary"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        )}
        <Link href={to} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

/** Bordered card with an uppercase title, optional "View all" link and divided rows. `compact`/`dense` tighten it. */
export function Panel({
  title,
  to,
  className,
  compact = false,
  dense = false,
  children,
}: {
  title: string;
  to?: string;
  className?: string;
  compact?: boolean;
  dense?: boolean;
  children: ReactNode;
}) {
  const padding = dense ? "p-3" : compact ? "p-4" : "p-5";
  const titleSize = dense ? "text-[10px]" : "text-xs";
  const gap = dense ? "mt-1.5" : compact ? "mt-2" : "mt-3";
  return (
    <div className={`flex flex-col rounded-lg border border-border bg-card ${padding} ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`font-bold uppercase tracking-[0.18em] text-muted-foreground ${titleSize}`}>{title}</h3>
        {to && (
          <Link href={to} className={`font-medium text-primary hover:underline ${dense ? "text-[10px]" : "text-xs"}`}>
            View all
          </Link>
        )}
      </div>
      <div className={`flex-1 divide-y divide-border ${gap}`}>{children}</div>
    </div>
  );
}
