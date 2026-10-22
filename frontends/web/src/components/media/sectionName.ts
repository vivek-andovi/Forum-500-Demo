import type { Article } from "@/features/media/types";

/** The section label shown above an article ("" when it has none). */
export function sectionName(a: Article) {
  return a.sectionLabel ?? a.section?.label ?? "";
}
