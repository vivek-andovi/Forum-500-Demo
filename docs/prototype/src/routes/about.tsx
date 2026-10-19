import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { benefits, whatsappGroups } from "@/lib/forum-data";
import heroSalon from "@/assets/hero-salon.jpg";
import chapterMap from "@/assets/chapter-map.jpg";
import benefitsLounge from "@/assets/benefits-lounge.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "The Club — Forum500" },
      {
        name: "description",
        content:
          "Founded in London in 2010, Forum500 is an invitation-only membership built on trust and curated introductions across 49 chapter cities.",
      },
      { property: "og:title", content: "The Club — Forum500" },
      { property: "og:description", content: "An invitation-only membership built on trust and curated introductions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative">
          <div className="absolute inset-0">
            <img src={heroSalon} alt="A Forum500 salon dinner in a candlelit London dining room" className="h-full w-full object-cover" width={1024} height={1024} />
            <div className="absolute inset-0 bg-black/55" />
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-14 pt-36 sm:px-6 sm:pt-48">
            <p className="eyebrow !text-accent">The Club</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl font-medium leading-tight text-white sm:text-5xl">
              A community built on trust
            </h1>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="space-y-5 text-lg leading-relaxed text-foreground/85">
            <p>
              Forum500 was founded in 2010 by Simon Jacot de Boinod and Jessica Fellowes, on a simple
              observation: the most valuable thing one person can give another is a good introduction.
            </p>
            <p>
              Today the Forum counts founders, writers, scientists, academics, innovators, investors, artists,
              politicians and philanthropists from diverse backgrounds across age, gender and geogrpahies amongst
              its 500 Members across 49 chapter cities.
            </p>
            <p>
              Each Member joins by invitation, on the recommendation of an existing Member. That single rule is
              what keeps the room worth being in.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-secondary/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="space-y-12">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="h-full overflow-hidden rounded-lg border border-border bg-card">
                  <img
                    src={chapterMap}
                    alt="A vintage-style world map marking Forum500 chapter cities"
                    className="h-full w-full object-cover"
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-medium">Membership Chapters</h3>
                  <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                    {whatsappGroups.map((city) => (
                      <li key={city} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {city}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div className="lg:order-2 overflow-hidden rounded-lg border border-border bg-card">
                  <img
                    src={benefitsLounge}
                    alt="A candlelit Forum500 club lounge with green leather armchairs and bookshelves"
                    className="aspect-[3/2] w-full object-cover"
                    width={1536}
                    height={1024}
                    loading="lazy"
                  />
                </div>
                <div className="lg:order-1">
                  <h3 className="font-display text-2xl font-medium">Member Benefits</h3>
                  <ul className="mt-5 space-y-4">
                    {benefits.map((b) => (
                      <li key={b.title} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        <div>
                          <p className="text-sm font-semibold">{b.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-border bg-primary/5 p-8 text-center sm:p-12">
            <p className="mx-auto max-w-xl text-muted-foreground">
              Membership is by invitation or nomination. If you would like to be considered, tell us a little about
              yourself and the membership team will be in touch.
            </p>
            <Link
              to="/apply"
              className="mt-6 inline-block rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Apply for membership
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
