import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import coverAutumn from "@/assets/forecast-cover-autumn.jpg";
import coverSummer from "@/assets/forecast-cover-summer.jpg";
import globeHero from "@/assets/globe-hero.jpg";

export const Route = createFileRoute("/_authenticated/media/forecast")({
  component: ForumForecast,
});

interface ForecastArticle {
  id: string;
  section: string;
  title: string;
  standfirst: string;
  author: string;
  dateline: string;
  readTime: string;
  image: string;
  caption: string;
  body: string[];
}

interface ForecastEdition {
  id: string;
  issue: string;
  title: string;
  date: string;
  cover: string;
  letter: { title: string; body: string[]; signoff: string };
  articles: ForecastArticle[];
}

const autumnArticles: ForecastArticle[] = [
  {
    id: "forecast-1",
    section: "Macro",
    title: "The capital cycle ahead: where patient money is moving now",
    standfirst:
      "From private credit in India to family-office allocations in the Gulf, members share what they are watching as rates reset and liquidity reshapes.",
    author: "Simon Foreman",
    dateline: "London",
    readTime: "6 min read",
    image: globeHero,
    caption: "Global capital flows — illustration by Forum500",
    body: [
      "After two years of rapid rate rises, the conversation among Forum500 investors has shifted from when the cycle will turn to which pockets of capital will move first.",
      "Family offices in London and Singapore report a renewed appetite for private credit, particularly in emerging-market infrastructure where local currency risk can be hedged.",
      "Real estate remains selective. The best opportunities, several members argue, are in distressed office-to-residential conversions in gateway cities and in logistics-adjacent land in the US Sun Belt.",
      "The consensus view: the next twelve months favour operators with strong balance sheets and local networks over those relying on cheap leverage.",
    ],
  },
  {
    id: "forecast-2",
    section: "Geopolitics",
    title: "Supply chains, chokepoints and the new diplomacy of ports",
    standfirst:
      "A member-led discussion on why maritime infrastructure has become the quiet front line of great-power competition.",
    author: "Jessica Foreman",
    dateline: "New York",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1504384308090-c54be3852f33?auto=format&fit=crop&w=1200&q=80",
    caption: "Container port at dusk",
    body: [
      "Ports are no longer just logistics assets; they are leverage. From the Red Sea to the South China Sea, control of chokepoints is shaping trade, insurance costs and alliance structures.",
      "Members with shipping and commodity backgrounds note that rerouting around the Cape has become a semi-permanent feature of global trade, not a temporary disruption.",
      "The implication for investors: higher freight costs are here to stay, and the winners will be those with vertically integrated exposure to terminals, energy transition fuels and regional warehousing.",
    ],
  },
  {
    id: "forecast-3",
    section: "Technology",
    title: "AI infrastructure: the build-out beyond the hype",
    standfirst:
      "Data centres, power contracts and chip supply: what operators are actually spending money on in 2026.",
    author: "Anish Malhotra",
    dateline: "New York",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    caption: "Server corridor in a hyperscale data centre",
    body: [
      "The AI narrative has moved from models to molecules — specifically, the electrons and concrete required to run them at scale.",
      "Members building data centres describe a scramble for power interconnection agreements and long-lead transformers. The bottleneck is not GPUs alone; it is the physical layer beneath them.",
      "For allocators, the opportunity set now includes power generation, cooling, modular construction and the real estate that houses it all.",
    ],
  },
  {
    id: "forecast-4",
    section: "Lifestyle",
    title: "The next chapter cities: where members are travelling, living and opening doors",
    standfirst:
      "From Lisbon to Jaipur, a member survey on the cities that combine quality of life with access to capital and culture.",
    author: "Zola",
    dateline: "Forum500",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80",
    caption: "Lisbon at sunrise",
    body: [
      "When Forum500 members were asked where they would base themselves for the next chapter, the answers clustered around cities that offer density, walkability and a genuine creative scene.",
      "Lisbon, Mexico City, Dubai, Singapore and Jaipur led the list. Each offers something different: tax clarity, time-zone advantage, hospitality culture or access to founders.",
      "The common thread: members want to live where they can also do business, and they are increasingly willing to relocate for a better balance of the two.",
    ],
  },
  {
    id: "forecast-5",
    section: "Impact",
    title: "Impact at scale: five bets our members are making",
    standfirst:
      "Regenerative agriculture, clean hydrogen, education access and mental health: the themes members are backing with capital and counsel.",
    author: "Jessica Foreman",
    dateline: "London",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
    caption: "Regenerative landscape",
    body: [
      "Impact investing has matured from a silo into a lens. Members are now asking not whether an investment does good, but whether it can do good at venture scale.",
      "The five most cited themes this quarter: regenerative agriculture in Southern Europe and Latin America, clean hydrogen offtake contracts, vocational education in Africa, maternal health in South Asia, and workplace mental health platforms.",
      "Several members are co-investing across these themes, combining capital with operational expertise and introductions to local partners.",
    ],
  },
];

const summerArticles: ForecastArticle[] = [
  {
    id: "summer-1",
    section: "Cities",
    title: "The terrace index: which cities are winning the summer of business",
    standfirst:
      "A light-hearted but telling survey of where deals were actually struck this summer — and which hotel terraces hosted them.",
    author: "Simon Foreman",
    dateline: "London",
    readTime: "5 min read",
    image: coverSummer,
    caption: "Riviera terrace at dusk",
    body: [
      "Every summer has a geography. This year's was written on terraces from Monte Carlo to Mykonos, where members reported more first meetings per week than in any January.",
      "The pattern is instructive: capital follows conviviality. Cities that make it easy to gather outdoors — and to stay for one more hour — quietly win the introductions that matter.",
      "Our advice for the season ahead: choose your August base as deliberately as your January board calendar.",
    ],
  },
  {
    id: "summer-2",
    section: "Travel",
    title: "The chapter-city playbook: how members host when the Forum comes to town",
    standfirst:
      "Members share the dinners, walks and one perfect table they rely on when fellow members pass through their city.",
    author: "Jessica Foreman",
    dateline: "Paris",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
    caption: "Paris at golden hour",
    body: [
      "Ask a Forum500 member how they host and you will rarely hear about restaurants first. The best hosts start with a walk, a view, or a room with no agenda.",
      "This summer's dispatches from Lisbon, New York and Singapore reveal a shared instinct: one unforgettable experience beats three competent ones.",
    ],
  },
];

const editions: ForecastEdition[] = [
  {
    id: "autumn-2026",
    issue: "Issue 12",
    title: "The Capital Issue",
    date: "September 2026",
    cover: coverAutumn,
    letter: {
      title: "From the editors",
      body: [
        "Welcome to the Autumn edition of the Forum500 Forecast — our capital issue. Across dinners in London, New York and Dubai this summer, one question kept surfacing: where is patient money actually going next?",
        "This edition gathers the answers we heard. From the reset of the capital cycle to the physical build-out beneath the AI story, from port diplomacy to the cities members are quietly choosing as their next base, each piece begins with a member's experience rather than an abstraction.",
        "As always, the Forecast is a starting point for conversation, not the end of one. If a piece provokes a disagreement or an idea, bring it to your chapter dinner — or pitch us a response for the next edition.",
      ],
      signoff: "Simon & Jessica Foreman, Editors",
    },
    articles: autumnArticles,
  },
  {
    id: "summer-2026",
    issue: "Issue 11",
    title: "The Cities Issue",
    date: "June 2026",
    cover: coverSummer,
    letter: {
      title: "From the editors",
      body: [
        "Summer is when the Forum's map comes alive. This edition is a celebration of the cities our members call home — and the terraces, tables and walks where the best conversations of the season happened.",
        "Inside: the terrace index, and a hosting playbook from members in three chapter cities.",
      ],
      signoff: "Simon & Jessica Foreman, Editors",
    },
    articles: summerArticles,
  },
];

// A "page" in the reader: 0 = cover, 1 = letter, 2 = contents, 3+ = articles
function pageLabel(page: number, total: number) {
  if (page === 0) return "Cover";
  if (page === 1) return "Letter";
  if (page === 2) return "Contents";
  return `Page ${page - 2} of ${total - 3}`;
}

function ForumForecast() {
  const [edition, setEdition] = useState<ForecastEdition>(editions[0]!);
  const [page, setPage] = useState(0); // 0 cover, 1 letter, 2 contents, 3.. articles

  const totalPages = edition.articles.length + 3;
  const article = page >= 3 ? edition.articles[page - 3] : null;

  function openEdition(e: ForecastEdition) {
    setEdition(e);
    setPage(0);
  }

  function go(delta: number) {
    setPage((p) => Math.min(Math.max(p + delta, 0), totalPages - 1));
  }

  const contents = useMemo(() => edition.articles, [edition]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Media Hub</p>
          <h1 className="mt-2 font-display text-3xl font-medium sm:text-4xl">Forum500 Forecast</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Our quarterly magazine, published electronically for members — read it cover to cover, or print a copy.
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / save as PDF
        </Button>
      </div>

      {/* Edition selector / historic editions */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Editions</p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {editions.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => openEdition(e)}
              className={cn(
                "group w-32 shrink-0 text-left",
                edition.id === e.id ? "" : "opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={e.cover}
                alt={`${e.title} cover`}
                loading="lazy"
                width={1024}
                height={1376}
                className={cn(
                  "aspect-[3/4] w-full rounded-md border object-cover",
                  edition.id === e.id ? "border-accent ring-2 ring-accent" : "border-border",
                )}
              />
              <p className="mt-2 text-xs font-bold uppercase tracking-wider">{e.issue} · {e.date}</p>
              <p className="text-xs text-muted-foreground">{e.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Reader chrome */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <Button variant="ghost" size="sm" className="gap-1" disabled={page === 0} onClick={() => go(-1)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
              {edition.issue} · {edition.date}
            </p>
            <p className="text-xs text-muted-foreground">{pageLabel(page, totalPages)}</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" disabled={page === totalPages - 1} onClick={() => go(1)}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Cover */}
        {page === 0 && (
          <div className="mx-auto max-w-xl p-6">
            <button type="button" onClick={() => go(1)} className="block w-full">
              <img
                src={edition.cover}
                alt={`${edition.title} cover`}
                width={1024}
                height={1376}
                className="w-full rounded-md border border-border object-cover shadow-lg"
              />
            </button>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Click the cover or press Next to open the edition.
            </p>
          </div>
        )}

        {/* Letter from the editors */}
        {page === 1 && (
          <div className="mx-auto max-w-2xl space-y-5 p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{edition.letter.title}</p>
            <h2 className="font-display text-3xl font-medium">{edition.title}</h2>
            {edition.letter.body.map((p, i) => (
              <p key={i} className="leading-relaxed text-muted-foreground">{p}</p>
            ))}
            <p className="font-display text-lg italic">{edition.letter.signoff}</p>
          </div>
        )}

        {/* Contents */}
        {page === 2 && (
          <div className="mx-auto max-w-2xl p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">In this edition</p>
            <h2 className="mt-2 font-display text-3xl font-medium">Contents</h2>
            <div className="mt-6 divide-y divide-border border-y border-border">
              {contents.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setPage(3 + i)}
                  className="group flex w-full items-baseline gap-4 py-4 text-left"
                >
                  <span className="w-8 shrink-0 font-display text-lg text-muted-foreground">{i + 1}</span>
                  <span className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-accent">{a.section}</span>
                    <span className="block font-display text-xl font-medium leading-snug group-hover:underline">
                      {a.title}
                    </span>
                    <span className="mt-1 block text-xs uppercase tracking-wider text-muted-foreground">
                      {a.author} · {a.dateline} · {a.readTime}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Article page */}
        {article && (
          <article className="mx-auto max-w-2xl p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{article.section}</p>
            <h2 className="mt-2 font-display text-3xl font-medium leading-tight">{article.title}</h2>
            <p className="mt-3 text-lg text-muted-foreground">{article.standfirst}</p>
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
              {article.author} · {article.dateline} · {article.readTime}
            </p>
            <img
              src={article.image}
              alt={article.caption}
              loading="lazy"
              width={1200}
              height={800}
              className="mt-6 w-full rounded-md border border-border object-cover"
            />
            <p className="mt-1 text-xs text-muted-foreground">{article.caption}</p>
            <div className="mt-6 space-y-4 leading-relaxed">
              {article.body.map((p, i) => (
                <p key={i} className={i === 0 ? "text-lg" : "text-muted-foreground"}>{p}</p>
              ))}
            </div>
          </article>
        )}

        {/* Page dots */}
        <div className="flex justify-center gap-1.5 border-t border-border py-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to ${pageLabel(i, totalPages)}`}
              onClick={() => setPage(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === page ? "w-6 bg-accent" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground",
              )}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-secondary/50 p-6">
        <h3 className="font-display text-lg font-medium">Contribute to the Forecast</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Members can submit a trend, a market signal, or a contrarian view for the next edition. The editorial team reviews every pitch.
        </p>
        <Button className="mt-4" variant="outline">Pitch a forecast</Button>
      </div>
    </div>
  );
}
