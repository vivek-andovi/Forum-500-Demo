"use client";

// Explains failures in plain words: an API call that failed, a file (image, audio, video) that didn't load,
// or a newsletter link that can't work. ProblemCenter (components/ProblemCenter.tsx) shows them: one problem at
// a time in a dialog, and failed files collected in a small tray.
import { useSyncExternalStore } from "react";
import { API_URL, ApiError } from "@/lib/api";

export interface ProblemAction {
  label: string;
  href: string;
  /** Opens in a new tab (another site). */
  external?: boolean;
}

export interface Problem {
  title: string;
  /** Why it failed, in plain words. */
  reason: string;
  /** What the person can do about it. */
  hint?: string;
  /** Set when the fix waits on an integration or decision that isn't done yet. */
  pending?: string;
  /** Technical facts for whoever investigates: request, status, server message, URL… */
  facts: [label: string, value: string][];
  actions?: ProblemAction[];
}

export interface FileProblem extends Problem {
  url: string;
  /** Page (or newsletter) where it failed. */
  where: string;
}

// ───────────── store ─────────────

let current: Problem | null = null;
let files: FileProblem[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Open the details dialog for one problem. */
export function showProblem(problem: Problem) {
  current = problem;
  emit();
}

export function closeProblem() {
  current = null;
  emit();
}

export function clearFileProblems() {
  files = [];
  pendingChecks.clear();
  emit();
}

export const useCurrentProblem = () => useSyncExternalStore(subscribe, () => current, () => null);
const NO_FILES: FileProblem[] = [];
export const useFileProblems = () => useSyncExternalStore(subscribe, () => files, () => NO_FILES);

const pendingChecks = new Map<string, Promise<FileProblem>>();

/** Record a file that failed to load (each URL is checked once) and return the explanation. */
export function reportFile(url: string, where: string): Promise<FileProblem> {
  const known = pendingChecks.get(url);
  if (known) return known;
  const check = diagnoseFile(url, where).then((p) => {
    // Skip if the list was cleared (page changed) while the check ran.
    if (pendingChecks.get(url) === check) {
      files = [...files, p];
      emit();
    }
    return p;
  });
  pendingChecks.set(url, check);
  return check;
}

// ───────────── API errors ─────────────

const STATUS_REASONS: Record<number, string> = {
  400: "The server didn't accept what was sent. The server message below says which part.",
  401: "You're not signed in any more (the session ended or was signed out elsewhere). Sign in again.",
  403: "Your account isn't allowed to do this.",
  404: "It doesn't exist any more: it may have been deleted, unpublished or never existed.",
  409: "It clashes with something that already exists.",
  413: "The file or text is too large for the server.",
  429: "Too many requests in a short time. Wait a minute and try again.",
};

/** Explanation for any error thrown by `api()` (or anything else). */
export function problemFromError(err: unknown, title = "That didn't work"): Problem {
  if (!(err instanceof ApiError)) {
    const message = err instanceof Error ? err.message : String(err);
    return { title, reason: "Something went wrong in the app itself.", facts: [["Error", message], ["Time", now()]] };
  }
  const facts: Problem["facts"] = [];
  if (err.request) facts.push(["Request", err.request]);
  facts.push(["Status", err.status === 0 ? "no answer (network error)" : `${err.status}${err.statusText ? ` ${err.statusText}` : ""}`]);
  if (err.status !== 0) facts.push(["Server message", err.message]);
  facts.push(["API", API_URL], ["Time", now()]);
  if (err.status === 0) {
    return {
      title,
      reason: `The app couldn't reach the Forum500 server at ${API_URL}. The server is down or restarting, the address is wrong, or the internet connection dropped.`,
      hint: "Check the connection and try again in a moment.",
      facts,
    };
  }
  const reason =
    STATUS_REASONS[err.status] ??
    (err.status >= 500
      ? "The server ran into an error while handling this. That's a fault on the server side, not something you did."
      : "The server refused the request.");
  return { title, reason, hint: err.status >= 500 ? "Try again; if it keeps happening, send these details to the team." : undefined, facts };
}

// ───────────── files ─────────────

const LOCAL_HOST = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/i;
const OLD_SITE = /(^|\.)(forum\.club|jessicaj37\.sg-host\.com)$/i;
const onLocalMachine = () => typeof window !== "undefined" && LOCAL_HOST.test(window.location.hostname);
const apiOrigin = () => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "";
  }
};

/** MailPoet placeholders left in newsletters imported before the B1 fix (raw or URL-encoded brackets). */
export const MAILPOET_PLACEHOLDER = /(\[|%5B)(mailpoet_|link:|subscriber:)/i;

const STORAGE_PENDING =
  "Production file storage is not set up yet (audit item B2). Files imported from the old site only exist on the computer that ran the import; the production import will store them properly.";

async function diagnoseFile(url: string, where: string): Promise<FileProblem> {
  const base = { url, where, title: "A file couldn't load" };
  if (MAILPOET_PLACEHOLDER.test(url)) {
    return {
      ...base,
      title: "Old email tracking placeholder",
      reason: "This is MailPoet's open-tracking pixel from the old site, not a real image. It was invisible in the original email and is hidden here.",
      pending: "Fixed in the importer (audit item B1). This copy was imported before the fix; re-running the import removes it.",
      facts: [["Address", url], ["Where", where]],
    };
  }
  let u: URL;
  try {
    u = new URL(url, window.location.href);
  } catch {
    return { ...base, reason: "The file's address isn't a valid URL.", facts: [["Address", url], ["Where", where]] };
  }
  const facts: Problem["facts"] = [["File", u.href], ["Where", where]];
  if (LOCAL_HOST.test(u.hostname) && !onLocalMachine()) {
    return {
      ...base,
      reason: `The file was saved with a local development address (${u.origin}), so it only exists on the computer that ran the import.`,
      pending: STORAGE_PENDING,
      facts,
    };
  }
  if (OLD_SITE.test(u.hostname)) {
    return {
      ...base,
      reason: `The file still points at the old ${u.hostname} site and wasn't copied into Forum500.`,
      hint: "Re-running the WordPress import copies the files it can find.",
      facts,
    };
  }
  // Files on our own API answer CORS requests, so the real HTTP status can be read.
  if (u.origin === apiOrigin()) {
    try {
      const res = await fetch(u.href, { method: "HEAD", cache: "no-store" });
      facts.push(["Status", `${res.status} ${res.statusText}`]);
      if (res.status === 404) {
        return {
          ...base,
          reason: "The file isn't on the server: it was deleted or never uploaded to this environment.",
          hint: LOCAL_HOST.test(u.hostname) ? "Locally, files live in backends/uploads; re-run the import or upload the file again." : "Upload the file again.",
          facts,
        };
      }
      if (res.ok) {
        return { ...base, reason: "The server has the file, but the browser couldn't show it (wrong file type or a damaged file).", facts };
      }
      return { ...base, reason: `The file server answered with an error (${res.status}).`, facts };
    } catch {
      return {
        ...base,
        reason: `The file server at ${u.origin} didn't answer: it's down or not running.`,
        hint: LOCAL_HOST.test(u.hostname) ? "Locally, start the API (npm run dev:api)." : undefined,
        facts,
      };
    }
  }
  return {
    ...base,
    reason: `${u.hostname} didn't deliver the file: it was removed there, the site is down, or it blocks showing it here.`,
    facts,
  };
}

/** Explanation for a file that failed, for the dialog (checks it first if it wasn't reported yet). */
export async function showFileProblem(url: string, where: string) {
  showProblem(await reportFile(url, where));
}

// ───────────── newsletter links ─────────────

/**
 * Why a link inside an archived email can't work, or null when it's fine to open.
 * `lookupRedirect` finds where an old forum.club page lives in this app (GET /public/redirect).
 */
export async function diagnoseLink(rawHref: string | null, email: string, lookupRedirect: (path: string) => Promise<string | null>): Promise<Problem | null> {
  const href = (rawHref ?? "").trim();
  const facts: Problem["facts"] = [["Link", href || "(empty)"], ["Email", email]];
  if (!href || href === "#") {
    return {
      title: "This link isn't available in the archive",
      reason:
        "In the original email this was a personal link (view in browser, unsubscribe or manage subscription) that only worked for the person it was sent to. Archived copies can't keep it.",
      facts,
    };
  }
  if (MAILPOET_PLACEHOLDER.test(href)) {
    return {
      title: "This link was never filled in",
      reason: "The link is still a MailPoet placeholder from the old site, so it has no address to open.",
      pending: "Fixed in the importer (audit item B1). This copy was imported before the fix; re-running the import replaces the placeholders with the real links.",
      facts,
    };
  }
  if (/^(mailto|tel):/i.test(href)) return null;
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return { title: "This link is broken", reason: "The address in the email isn't a valid web address.", facts };
  }
  if (!/^https?:$/.test(u.protocol)) return { title: "This link can't be opened", reason: `Links of type "${u.protocol}" can't be opened from an archived email.`, facts };
  if (LOCAL_HOST.test(u.hostname) && !onLocalMachine()) {
    return {
      title: "This link points at a developer's computer",
      reason: `The link was saved with a local development address (${u.origin}), so it can't open here.`,
      pending: STORAGE_PENDING,
      facts,
    };
  }
  if (OLD_SITE.test(u.hostname) && !u.pathname.startsWith("/wp-content/")) {
    const here = await lookupRedirect(u.pathname).catch(() => null);
    return {
      title: "This link goes to the old forum.club site",
      reason: here
        ? "The newsletter links to a page on the old WordPress site. That page now lives in Forum500."
        : "The newsletter links to a page on the old WordPress site, which has no matching page in Forum500.",
      pending: "Once forum.club points at Forum500 (DNS switch-over), links like this redirect here automatically.",
      facts,
      actions: [
        ...(here ? [{ label: "Open it in Forum500", href: here }] : []),
        { label: "Open the old site", href: u.href, external: true },
      ],
    };
  }
  return null;
}

/** Plain-text copy of a problem, for "Copy details". */
export function problemText(p: Problem): string {
  return [p.title, p.reason, p.hint, p.pending && `Pending: ${p.pending}`, ...p.facts.map(([k, v]) => `${k}: ${v}`)]
    .filter(Boolean)
    .join("\n");
}

const now = () => new Date().toLocaleString();
