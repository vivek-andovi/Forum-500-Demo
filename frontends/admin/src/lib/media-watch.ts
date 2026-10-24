"use client";

// One listener per document catches every image, audio or video that fails to load (error events don't bubble,
// but they can be caught on the way down). Broken images get a placeholder; clicking it explains why it failed.
import { MAILPOET_PLACEHOLDER, reportFile, showFileProblem } from "@/lib/problems";

/** Grey "image unavailable" tile used in place of a broken image. */
const PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120"><rect width="160" height="120" fill="#f1efea"/><g fill="none" stroke="#a39a8e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="58" y="36" width="44" height="34" rx="3"/><path d="M58 62l12-10 10 8 8-6 14 10"/><path d="M52 30l56 50"/></g><text x="80" y="98" font-family="sans-serif" font-size="11" text-anchor="middle" fill="#7d746a">Couldn’t load · details</text></svg>`,
  );

const BROKEN = "brokenSrc";

// Tag names, not instanceof: elements inside an iframe come from that frame's own HTMLImageElement etc.
const MEDIA = new Set(["IMG", "AUDIO", "VIDEO", "SOURCE"]);

function failedUrl(el: Element): string | null {
  if (!MEDIA.has(el.tagName)) return null;
  const m = el as HTMLImageElement & HTMLMediaElement;
  return m.currentSrc || m.src || null;
}

/**
 * Watch `doc` (the page, or a newsletter's iframe document) for media that fails to load.
 * `where` describes the place for the details ("/events", "Newsletter: …"). Returns a cleanup function.
 */
export function watchMedia(doc: Document, where: () => string): () => void {
  const markBroken = (img: HTMLImageElement, url: string) => {
    img.dataset[BROKEN] = url;
    img.title = "This image couldn’t load. Click for details.";
    img.style.cursor = "help";
    // srcset wins over src, so clear it first.
    img.srcset = "";
    img.src = PLACEHOLDER;
  };

  const onError = (e: Event) => {
    const el = e.target as Element | null;
    if (!el?.tagName) return;
    const url = failedUrl(el);
    if (!url || url.startsWith("data:") || url.startsWith("blob:")) return;
    void reportFile(url, where());
    if (el.tagName !== "IMG") return;
    // Old tracking pixels were invisible anyway: hide them instead of showing a placeholder tile.
    if (MAILPOET_PLACEHOLDER.test(url)) (el as HTMLElement).style.display = "none";
    // Components with their own fallback (e.g. MemberAvatar's initials) only get the report.
    else if (!el.closest("[data-own-fallback]")) markBroken(el as HTMLImageElement, url);
  };

  const onClick = (e: MouseEvent) => {
    const img = (e.target as Element | null)?.closest?.("img");
    const url = img?.getAttribute("data-broken-src");
    if (!url) return;
    e.preventDefault();
    e.stopPropagation();
    void showFileProblem(url, where());
  };

  doc.addEventListener("error", onError, true);
  doc.addEventListener("click", onClick, true);
  // Images that failed before the listener was attached (e.g. inside an iframe that loaded first).
  doc.querySelectorAll("img").forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src") && !img.dataset[BROKEN]) {
      img.dispatchEvent(new Event("error"));
    }
  });
  return () => {
    doc.removeEventListener("error", onError, true);
    doc.removeEventListener("click", onClick, true);
  };
}
