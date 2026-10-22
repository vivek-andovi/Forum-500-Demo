import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** An in-app path that is safe to redirect to (rejects "//host" and "/\\host", which browsers treat as external). */
export function safePath(p: string | null | undefined): string | null {
  return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\") ? p : null;
}
