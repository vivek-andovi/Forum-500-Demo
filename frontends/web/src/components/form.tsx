import type { InputHTMLAttributes, ReactNode } from "react";

/** Standard text input / select / textarea style (auth pages, apply, profile, security settings). */
export const inputClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

/** Full-width primary submit button used on the public auth pages. */
export const primaryButtonClass =
  "w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60";

/**
 * Editorial form style used by the In:Forum dialogs (pitch, recommendation, comments): no top margin,
 * a thin focus ring and a styled placeholder. Deliberately different from `inputClass`.
 */
export const editorialFieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring";

/**
 * A labelled text input using `inputClass`. Pass any <input> props; `children` render under the input
 * (e.g. a hint). `optional` adds a muted "(optional)" after the label.
 */
export function FormField({
  label,
  id,
  required,
  optional,
  children,
  ...props
}: {
  label: string;
  id?: string;
  required?: boolean;
  optional?: boolean;
  children?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input id={id} required={required} className={inputClass} {...props} />
      {children}
    </div>
  );
}
