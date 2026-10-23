import { format, isSameDay, parseISO } from "date-fns";
import type { ForumEvent } from "@/features/events/types";
import type { Article } from "@/features/media/types";

function d(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const v = parseISO(iso);
  return isNaN(v.getTime()) ? null : v;
}

/** "Thursday 24 September 2026" — prefers the admin-supplied dateLabel. */
export function eventDate(e: Pick<ForumEvent, "dateLabel" | "startsAt" | "endsAt">): string {
  if (e.dateLabel) return e.dateLabel;
  const s = d(e.startsAt);
  if (!s) return "";
  const end = d(e.endsAt);
  if (end && !isSameDay(s, end)) return `${format(s, "d")}–${format(end, "d MMMM yyyy")}`;
  return format(s, "EEEE d MMMM yyyy");
}

/** "7:00pm – 10:30pm" — prefers timeLabel. */
export function eventTime(e: Pick<ForumEvent, "timeLabel" | "startsAt" | "endsAt" | "allDay">): string {
  if (e.timeLabel) return e.timeLabel;
  if (e.allDay) return "All day";
  const s = d(e.startsAt);
  if (!s) return "";
  const t = (x: Date) => format(x, "h:mmaaa");
  const end = d(e.endsAt);
  return end && isSameDay(s, end) ? `${t(s)} – ${t(end)}` : t(s);
}

/** Venue label used in place of the prototype's `venue` string. */
export function eventVenue(e: Pick<ForumEvent, "venue" | "venueText">): string {
  return e.venue?.name ?? e.venueText ?? "Venue to be announced";
}

export function readTime(a: Pick<Article, "readMinutes">): string {
  return a.readMinutes ? `${a.readMinutes} min read` : "";
}

export function articleDate(a: Pick<Article, "dateLabel" | "publishedAt" | "createdAt">): string {
  if (a.dateLabel) return a.dateLabel;
  const v = d(a.publishedAt) ?? d(a.createdAt);
  return v ? format(v, "d MMMM yyyy") : "";
}

export function fmtDate(iso: string | null | undefined, pattern = "d MMM yyyy"): string {
  const v = d(iso);
  return v ? format(v, pattern) : "";
}

export function money(cents: number | null | undefined, currency: string | null | undefined = "GBP"): string {
  if (cents == null) return "";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: currency || "GBP" }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency ?? ""}`.trim();
  }
}

export function initials(name: string | null | undefined): string {
  if (!name) return "F";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function toList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function timeAgo(iso: string | null | undefined): string {
  const v = d(iso);
  if (!v) return "";
  const s = Math.floor((Date.now() - v.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return format(v, "d MMM yyyy");
}

/** Splits CMS body text (paragraphs separated by blank lines) into paragraphs. */
export function paragraphs(body: string | null | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Groups podcast episodes by series, newest series first ("Series 4" … "Series 1", then any without
 * a series). Returns a single untitled group when no episode has a series.
 */
export function groupBySeries<T extends { series: number | null }>(
  episodes: T[],
): { key: string; title: string | null; episodes: T[] }[] {
  if (!episodes.some((e) => e.series != null)) return [{ key: "all", title: null, episodes }];
  const numbers = [...new Set(episodes.map((e) => e.series).filter((s): s is number => s != null))].sort(
    (a, b) => b - a,
  );
  const groups = numbers.map((n) => ({
    key: `series-${n}`,
    title: `Series ${n}`,
    episodes: episodes.filter((e) => e.series === n),
  }));
  const rest = episodes.filter((e) => e.series == null);
  if (rest.length) groups.push({ key: "other", title: "Other episodes", episodes: rest });
  return groups;
}
