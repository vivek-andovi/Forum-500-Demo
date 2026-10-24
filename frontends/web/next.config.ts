import type { NextConfig } from "next";

// Well-known pages of the old forum.club WordPress site → where they live in this app.
// Anything not listed here falls through to app/not-found.tsx, which asks the API (/public/redirect).
// Member profiles (/member/<slug>/) go through the API too: imported slugs don't always match the old ones.
const legacyRedirects: [source: string, destination: string][] = [
  ["/forum-club", "/dashboard"],
  ["/forum-directory-2", "/membership"],
  ["/forum-members-directory-categories", "/membership"],
  ["/member-category/:slug*", "/membership"],
  ["/region/:slug*", "/membership"],
  ["/whatsapp-groups", "/comms/whatsapp"],
  ["/account/messages", "/comms/messages"],
  ["/account/messages/:path*", "/comms/messages"],
  ["/forum-newsfeed", "/media/newsfeed"],
  ["/create-post", "/media/newsfeed"],
  ["/podcast", "/media/forum-radio"],
  ["/in-forum", "/media/inforum"],
  ["/forum-forecast-2026", "/media/forecast"],
  ["/galleries", "/events/gallery"],
  ["/five-minutes-with-forum", "/media/library"],
  ["/zoom-years", "/media/library"],
  ["/youtube-channel", "/media/library"],
  ["/links", "/media/library"],
  ["/essential-documents", "/media/library"],
  ["/newsletter-archive", "/comms/emails"],
  ["/calendar", "/events"],
  ["/forum-movie", "/dashboard"],
  ["/wp-login.php", "/auth"],
  ["/wp-admin", "/auth"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // WordPress URLs end in "/", so each source also matches with a trailing slash.
    return legacyRedirects.map(([source, destination]) => ({
      source: `${source}{/}?`,
      destination,
      permanent: true,
    }));
  },
};

export default nextConfig;
