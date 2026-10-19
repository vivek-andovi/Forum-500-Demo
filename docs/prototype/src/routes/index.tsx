import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Handshake, Heart, Newspaper, Trophy, Users } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import globeHero from "@/assets/globe-hero.jpg";
import inforumHero from "@/assets/inforum-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forum500 — Making Ideas Happen" },
      {
        name: "description",
        content:
          "Forum500 is a private membership club connecting leaders in hospitality, media and the arts across 26 cities. Making ideas happen since 2010.",
      },
      { property: "og:title", content: "Forum500 — Making Ideas Happen" },
      {
        property: "og:description",
        content: "A private membership for people who make ideas happen. Founded in London, 2010.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative">
          <div className="absolute inset-0">
            <img src={globeHero} alt="A vintage-style globe with golden arcs connecting Forum500 cities" className="h-full w-full object-cover" width={1920} height={960} />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1f14]/95 via-[#0a1f14]/70 to-transparent" />
          </div>
          <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-4 pb-16 pt-40 sm:px-6 sm:pt-56">
            <h1 className="max-w-2xl font-display text-5xl font-medium leading-[1.05] text-white sm:text-6xl">
              Making Ideas Happen
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/90">
              Forum500 is a diverse private community of 500 subject matter experts from around the world who together turn
              their intellectual curiosity into real action.
            </p>
            <p className="eyebrow !text-accent mt-6">Est. London, 2010</p>
          </div>
        </section>



        {/* Engage with Forum */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="text-center">
            <h2 className="mt-3 font-display text-4xl font-medium">Engage with Forum</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Join Friends of Forum to engage with our community and content.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <EngageCard
              icon={<Newspaper className="h-6 w-6" />}
              title="In:Forum"
              description="The weekly editorial digest written by and for members — news, ideas worth making happen, and the people behind them."
              to="/inforum"
            />
            <EngageCard
              icon={<BookOpen className="h-6 w-6" />}
              title="Publications"
              description="The annual Forum500 Forecast, every edition of IN:FORUM, and the growing library of member essays and reports."
              to="/inforum"
            />
            <EngageCard
              icon={<Users className="h-6 w-6" />}
              title="Partnerships"
              description="Reciprocal relationships with private clubs, hotels and cultural institutions in Forum cities around the world."
              to="#"
            />
            <EngageCard
              icon={<Heart className="h-6 w-6" />}
              title="Forum For Impact"
              description="Member-led philanthropy, pro-bono introductions and the projects where Forum500 puts its collective weight behind a cause."
              to="#"
            />
            <EngageCard
              icon={<Trophy className="h-6 w-6" />}
              title="Sporting Chance"
              description="A programme for members who believe the best introductions happen on a pitch, fairway, court or starting line."
              to="#"
            />
            <EngageCard
              icon={<Handshake className="h-6 w-6" />}
              title="Sponsorships"
              description="Opportunities for aligned brands and organisations to support Forum500 events, content and member experiences."
              to="#"
            />
          </div>
        </section>

        {/* In:Forum teaser */}
        <section className="relative">
          <div className="absolute inset-0">
            <img src={inforumHero} alt="The In:Forum journal on a reading table" className="h-full w-full object-cover" loading="lazy" width={1024} height={1024} />
            <div className="absolute inset-0 bg-black/65" />
          </div>
          <div className="relative mx-auto flex max-w-6xl items-center gap-10 px-4 py-20 sm:px-6">
            <div className="max-w-xl">
              <div className="flex items-center gap-3">
                <Newspaper className="h-5 w-5 text-accent" />
                <p className="eyebrow">The Forum's journal</p>
              </div>
              <h2 className="mt-3 font-display text-4xl font-medium text-white">In:Forum</h2>
              <p className="mt-4 text-white/85">
                A weekly editorial digest written by and for members — news, ideas worth making happen, and the
                people behind them. Publicly readable here; the full edition lives behind the member sign in.
              </p>
              <Link
                to="/inforum"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
              >
                Read In:Forum <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EngageCard({
  icon,
  title,
  description,
  to,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-lg border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-lg ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-accent">
        {icon}
      </div>
      <h3 className="mt-5 font-display text-xl font-medium">{title}</h3>
      <p className="mt-2 flex-1 text-sm text-muted-foreground">{description}</p>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
        Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
