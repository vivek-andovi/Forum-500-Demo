import type { ReactNode } from "react";

/**
 * Renders `children` for members. Admin accounts can sign in to the member area but have no member
 * profile, so they see a notice instead. Each page keeps its own wording and styling:
 *
 *   <MemberOnly member={member} message="Admin account — no member profile." className="text-sm …">…</MemberOnly>
 *   <MemberOnly member={member} variant="card" message="…">…</MemberOnly>   // dashed, centred card
 *   <MemberOnly member={member} fallback={<CustomNotice />}>…</MemberOnly>  // anything else
 *
 * JSX children are evaluated even when the notice is shown, so when they read from the member pass a
 * function instead: `{(m) => <Inbox myId={m.id} />}`.
 */
export function MemberOnly<T>({
  member,
  children,
  message,
  className,
  variant = "text",
  fallback,
}: {
  /** The signed-in member; null/undefined for admin accounts. */
  member: T | null | undefined;
  children: ReactNode | ((member: T) => ReactNode);
  message?: ReactNode;
  /** Classes for the notice <p> (variant "text"). */
  className?: string;
  variant?: "text" | "card";
  /** Replaces the notice entirely (message/variant/className are then ignored). */
  fallback?: ReactNode;
}) {
  if (member) return <>{typeof children === "function" ? children(member) : children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  if (variant === "card") {
    return (
      <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
        <p className="text-muted-foreground">{message}</p>
      </div>
    );
  }
  return <p className={className}>{message}</p>;
}
