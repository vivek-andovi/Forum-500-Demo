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

export const inputClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
export const primaryButtonClass =
  "w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";

/** Mirrors the API password policy so members see problems before submitting. */
export function passwordProblems(pw: string): string[] {
  const out: string[] = [];
  if (pw.length < 10) out.push("at least 10 characters");
  if (!/[A-Za-z]/.test(pw)) out.push("a letter");
  if (!/\d/.test(pw)) out.push("a number");
  return out;
}
