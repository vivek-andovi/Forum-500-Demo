import type { Metadata } from "next";

const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "");

/** Server-side metadata for public CMS pages; falls back to a generic title. */
export async function publicPageMetadata(slug: string, fallbackTitle = "Forum500"): Promise<Metadata> {
  try {
    const [pageRes, siteRes] = await Promise.all([
      fetch(`${API}/public/pages/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } }),
      fetch(`${API}/public/site`, { next: { revalidate: 300 } }),
    ]);
    if (!pageRes.ok) return { title: fallbackTitle };
    const page = (await pageRes.json()) as { title?: string; metaDescription?: string | null; subtitle?: string | null };
    const site = siteRes.ok ? ((await siteRes.json()) as { settings?: { name?: string } }) : null;
    const brand = site?.settings?.name;
    const title = page.title ? (brand && page.title !== brand ? `${page.title} — ${brand}` : page.title) : fallbackTitle;
    return { title, description: page.metaDescription ?? page.subtitle ?? undefined };
  } catch {
    return { title: fallbackTitle };
  }
}
