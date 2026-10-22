import { format, isValid, parseISO } from "date-fns";

export function humanize(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : parseISO(String(value));
  return isValid(d) ? d : null;
}

export function formatDateTime(value: unknown): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yyyy, HH:mm") : "";
}

export function formatDate(value: unknown): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yyyy") : "";
}

/** ISO string -> value for <input type="datetime-local"> */
export function isoToLocalInput(value: unknown): string {
  const d = toDate(value);
  return d ? format(d, "yyyy-MM-dd'T'HH:mm") : "";
}

/** <input type="datetime-local"> value -> ISO string (or null) */
export function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isValid(d) ? d.toISOString() : null;
}

export function truncate(value: string, max = 80): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

export function stringify(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value) && value.every((v) => typeof v !== "object")) return value.join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

type Tone = "green" | "amber" | "red" | "blue" | "gray" | "brass";

const TONES: Record<string, Tone> = {
  published: "green",
  approved: "green",
  active: "green",
  confirmed: "green",
  accepted: "green",
  completed: "green",
  sent: "green",
  answered: "green",
  in_review: "amber",
  pending: "amber",
  pending_review: "amber",
  requested: "amber",
  new: "blue",
  scheduled: "blue",
  invited: "blue",
  interested: "blue",
  open: "blue",
  draft: "gray",
  archived: "gray",
  left: "gray",
  closed: "gray",
  dismissed: "gray",
  cancelled: "gray",
  waitlisted: "brass",
  rejected: "red",
  declined: "red",
  suspended: "red",
  overdue: "red",
};

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-red-100 text-red-800 border-red-200",
  blue: "bg-sky-100 text-sky-800 border-sky-200",
  gray: "bg-muted text-muted-foreground border-border",
  brass: "bg-accent/15 text-accent-foreground border-accent/30",
};

export function toneFor(value: string): string {
  return TONE_CLASSES[TONES[value] ?? "gray"];
}
