import type { ReactNode } from "react";

/** Shared shell for the public sign-in / password pages. */
export function AuthCard({ eyebrow, title, intro, children, footer }: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">{title}</h1>
          {intro && <p className="mt-2 text-sm text-muted-foreground">{intro}</p>}
        </div>
        <div className="mt-8 rounded-lg border border-border bg-card p-6">{children}</div>
        {footer && <p className="mt-4 text-center text-sm text-muted-foreground">{footer}</p>}
      </div>
    </div>
  );
}
