import type { Article } from "@/features/media/types";
import { cn } from "@/lib/utils";

/** An article's lead image, or a muted placeholder of the same size when it has none. */
export function ArticleImage({ article, className }: { article: Article; className: string }) {
  if (!article.imageUrl) return <div className={cn(className, "bg-muted")} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={article.imageUrl}
      alt={article.caption ?? article.title}
      loading="lazy"
      width={1200}
      height={800}
      className={className}
    />
  );
}
