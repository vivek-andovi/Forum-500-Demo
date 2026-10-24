export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api").replace(
  /\/$/,
  "",
);

const TOKEN_KEY = "forum500_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export class ApiError extends Error {
  status: number;
  messages: string[];
  /** The request that failed, e.g. "PATCH /admin/r/events/…" (shown in the error details dialog). */
  request?: string;
  statusText?: string;
  constructor(status: number, messages: string[], request?: string, statusText?: string) {
    super(messages.join("\n") || `Request failed (${status})`);
    this.status = status;
    this.messages = messages;
    this.request = request;
    this.statusText = statusText;
  }
}

let unauthorizedHandler: (() => void) | null = null;
/** Registered by AuthProvider: called when an authenticated request returns 401. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export type QueryValue = string | number | boolean | null | undefined;

function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
};

async function parseError(res: Response, request: string): Promise<ApiError> {
  let messages: string[] = [];
  try {
    const data = await res.json();
    const m = data?.message ?? data?.error;
    if (Array.isArray(m)) messages = m.map(String);
    else if (m) messages = [String(m)];
  } catch {
    /* not JSON */
  }
  if (!messages.length) messages = [res.statusText || `Request failed (${res.status})`];
  return new ApiError(res.status, messages, request, res.statusText);
}

async function handle<T>(res: Response, hadToken: boolean, request: string): Promise<T> {
  if (!res.ok) {
    const err = await parseError(res, request);
    if (res.status === 401 && hadToken) unauthorizedHandler?.();
    throw err;
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const request = `${opts.method ?? "GET"} ${path}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(opts.query)}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") throw e;
    throw new ApiError(0, [`Cannot reach the API at ${API_URL}`], request);
  }
  return handle<T>(res, !!token, request);
}

/**
 * Files above this go straight from the browser to the bucket (presign → PUT → confirm), because the API on
 * Lambda accepts about 6 MB per request. Matches the API's UPLOAD_MAX_MB on Lambda.
 */
const DIRECT_UPLOAD_MAX_BYTES = Number(process.env.NEXT_PUBLIC_DIRECT_UPLOAD_MAX_MB || 4) * 1e6;

export async function uploadFile(file: File): Promise<{ url: string; id: string }> {
  if (file.size > DIRECT_UPLOAD_MAX_BYTES) return uploadViaPresign(file);
  const token = getToken();
  const form = new FormData();
  form.append("file", file);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/admin/uploads`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
  } catch {
    throw new ApiError(0, [`Cannot reach the API at ${API_URL}`], "POST /admin/uploads");
  }
  return handle(res, !!token, "POST /admin/uploads");
}

/** Large files: the API signs a 5-minute upload URL, the browser PUTs the file to the bucket, the API records it. */
async function uploadViaPresign(file: File): Promise<{ url: string; id: string }> {
  const meta = { filename: file.name, mime: file.type, size: file.size };
  const { key, uploadUrl } = await api<{ key: string; uploadUrl: string }>("/admin/uploads/presign", { method: "POST", body: meta });
  const request = "PUT (file storage)";
  let put: Response;
  try {
    put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  } catch {
    throw new ApiError(0, ["Couldn't send the file to storage. The bucket's CORS rule must allow PUT from this site."], request);
  }
  if (!put.ok) throw new ApiError(put.status, [`File storage refused the upload (${put.status})`], request, put.statusText);
  return api("/admin/uploads/confirm", { method: "POST", body: { key, ...meta } });
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}
