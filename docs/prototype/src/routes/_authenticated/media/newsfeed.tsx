import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import eventLondon from "@/assets/event-london.jpg";
import candidSingapore from "@/assets/candid-singapore-rooftop.jpg";
import candidStockholm from "@/assets/candid-stockholm-roundtable.jpg";
import candidNassau from "@/assets/candid-nassau-boat.jpg";
import companyPlotify from "@/assets/company-plotify.jpg";
import memberShreyas from "@/assets/member-shreyas.jpg";
import memberAmara from "@/assets/member-amara.jpg";
import memberJames from "@/assets/member-james.jpg";
import memberPriya from "@/assets/member-priya.jpg";
import memberSofia from "@/assets/member-sofia.jpg";
import memberDaniel from "@/assets/member-daniel.jpg";

export const Route = createFileRoute("/_authenticated/media/newsfeed")({
  component: Newsfeed,
});

type FeedPost = {
  id: string;
  name: string;
  meta: string;
  photo: string;
  time: string;
  text: string;
  image?: string;
  imageAlt?: string;
  likes: number;
  comments: number;
};

const posts: FeedPost[] = [
  {
    id: "p1",
    name: "Amara Osei",
    meta: "Founder · London",
    photo: memberAmara,
    time: "2h ago",
    text: "Thank you to everyone who joined Thursday's salon on climate capital. The room did what Forum rooms do — a scientist, a hotelier and a fund manager walked out with a plan. Notes and the reading list are in the Climate & Sustainability group.",
    image: eventLondon,
    imageAlt: "Members in discussion at a London salon",
    likes: 42,
    comments: 12,
  },
  {
    id: "p2",
    name: "Anish Malhotra",
    meta: "Founder, Plotify · New York",
    photo: memberShreyas,
    time: "6h ago",
    text: "Excited to share that Plotify has opened its doors to Forum members with preferred membership access — details in Member Benefits. If you're curious about building a residential portfolio, my door (and inbox) is open.",
    image: companyPlotify,
    imageAlt: "Plotify residential property portfolio",
    likes: 58,
    comments: 19,
  },
  {
    id: "p3",
    name: "Priya Nair",
    meta: "CEO, Meridian Hotels · Singapore",
    photo: memberPriya,
    time: "Yesterday",
    text: "Rooftop drinks with the Singapore chapter last night — twenty members, three visiting from London and New York, and one impromptu book swap. This is the travel network working exactly as intended.",
    image: candidSingapore,
    imageAlt: "Singapore chapter rooftop gathering at dusk",
    likes: 76,
    comments: 24,
  },
  {
    id: "p4",
    name: "Sofia Lindqvist",
    meta: "Partner, Lindqvist & Co · Stockholm",
    photo: memberSofia,
    time: "Yesterday",
    text: "Our Nordic family offices roundtable sold out in a day, so we're adding a second table in October. If you'd like a seat — or want to host one in your chapter — message me.",
    image: candidStockholm,
    imageAlt: "Roundtable conversation in Stockholm",
    likes: 34,
    comments: 8,
  },
  {
    id: "p5",
    name: "James Whitfield",
    meta: "Publisher · New York",
    photo: memberJames,
    time: "2 days ago",
    text: "My essay on the future of the printed journal is in this month's In:Forum. Would genuinely love the counter-argument — comments open, strongest rebuttal gets a bottle from my cellar.",
    likes: 51,
    comments: 31,
  },
  {
    id: "p6",
    name: "Daniel Okafor",
    meta: "Investor · Dubai",
    photo: memberDaniel,
    time: "3 days ago",
    text: "Back from the Nassau weekend — sailing, a sunrise swim, and a founders' breakfast that ran four hours. Photos are in the Gallery; tag the ones you want in your My Gallery.",
    image: candidNassau,
    imageAlt: "Members sailing off Nassau",
    likes: 89,
    comments: 27,
  },
];

function Newsfeed() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="Newsfeed"
        description="Posts, photos and updates shared by members across the chapters."
      />

      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.id} className="rounded-lg border border-border bg-card">
            <div className="flex items-center gap-3 px-5 pt-5">
              <img
                src={post.photo}
                alt={post.name}
                className="h-11 w-11 rounded-full object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-tight">{post.name}</p>
                <p className="text-xs text-muted-foreground">
                  {post.meta} · {post.time}
                </p>
              </div>
            </div>
            <p className="px-5 pt-3 leading-relaxed text-foreground/90">{post.text}</p>
            {post.image && (
              <img
                src={post.image}
                alt={post.imageAlt ?? ""}
                className="mt-4 max-h-96 w-full object-cover"
                loading="lazy"
              />
            )}
            <div className="flex items-center gap-6 border-t border-border px-5 py-3 text-sm text-muted-foreground">
              <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                <Heart className="h-4 w-4" /> {post.likes}
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                <MessageCircle className="h-4 w-4" /> {post.comments}
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
                <Share2 className="h-4 w-4" /> Share
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Want to post here? <Link to="/media/inforum" hash="make-an-idea-happen" className="text-accent hover:underline">Publish an article</Link> or share from a hub — posts appear after a quick Forum review.
      </p>
    </div>
  );
}
