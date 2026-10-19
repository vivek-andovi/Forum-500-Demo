import { createFileRoute } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { libraryItems } from "@/lib/forum-data";
import inforumHero from "@/assets/inforum-hero.jpg";

export const Route = createFileRoute("/_authenticated/media/library")({
  component: Library,
});

function Library() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Media Hub"
        title="Library"
        description="The Forum's publications archive — the annual Forecast and every edition of IN:FORUM."
      />
      <div className="grid gap-6 md:grid-cols-3">
        {libraryItems.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative">
              <img
                src={inforumHero}
                alt={item.title}
                loading="lazy"
                width={1024}
                height={1024}
                className="aspect-[4/3] w-full object-cover"
              />
              <span className="absolute left-3 top-3 rounded bg-background/90 px-2 py-1 text-xs font-bold uppercase tracking-wider">
                {item.kind}
              </span>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-medium">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              <button className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium hover:bg-secondary">
                <BookOpen className="h-4 w-4" /> Read ({item.pages} pages)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
