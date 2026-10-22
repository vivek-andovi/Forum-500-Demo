import type { Introduction } from "@/features/comms/types";
import type { Article } from "@/features/media/types";
import type { Group, Member } from "@/features/membership/types";
import { articleDate, readTime } from "@/lib/format";

/** "12 Members · Note" (or the cadence when the count is unknown). */
export function groupMeta(g: Group & { memberCount?: number }, withNote: boolean): string {
  const count = typeof g.memberCount === "number" ? `${g.memberCount} Members` : "";
  return [count || g.cadence, withNote ? g.note : ""].filter(Boolean).join(" · ");
}

/** "Author · Date · N min read". */
export function articleMeta(a: Article, withDate: boolean): string {
  return [a.authorName, withDate ? articleDate(a) : "", readTime(a)].filter(Boolean).join(" · ");
}

/** The other member in an introduction, from the signed-in member's point of view. */
export function introOther(i: Introduction, me: Member | null): Member | null | undefined {
  if (me && i.targetId === me.id) return i.requester ?? i.target;
  return i.target ?? i.requester;
}

export function introducedBy(i: Introduction): string | null {
  return i.introducer?.fullName ?? i.introducerName ?? null;
}

export function introStatusLabel(i: Introduction): string {
  const s = i.status;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
