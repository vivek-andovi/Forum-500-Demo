import type { Article } from "@/features/media/types";
import { articleDate, readTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Author photo + "Author · Dateline · Date · N min read" line under an article. */
export function Byline({ article, className }: { article: Article; className?: string }) {
  const parts = [article.authorName, article.dateline, articleDate(article), readTime(article)].filter(Boolean);
  return (
    <div className={cn("flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground", className)}>
      {article.authorPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.authorPhotoUrl}
          alt={article.authorName}
          loading="lazy"
          width={40}
          height={40}
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : null}
      <span>{parts.join(" · ")}</span>
    </div>
  );
}
