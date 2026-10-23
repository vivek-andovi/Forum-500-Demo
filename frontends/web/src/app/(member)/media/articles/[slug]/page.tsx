"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { QueryState } from "@/components/QueryState";
import { ArticleImage } from "@/components/media/ArticleImage";
import { Byline } from "@/components/media/Byline";
import { useArticle } from "@/features/media/queries";
import { ApiError } from "@/lib/api";

function BackLink() {
  return (
    <Link href="/media/articles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" /> Articles
    </Link>
  );
}

export default function ArticleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useArticle(slug);

  const notFound = error instanceof ApiError && error.status === 404;
  if (isLoading || (error && !notFound)) {
    return (
      <div className="space-y-8">
        <BackLink />
        <QueryState isLoading={isLoading} error={error} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="py-20 text-center">
        <p className="font-display text-2xl">Article not found</p>
        <Link href="/media/articles" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to articles
        </Link>
      </div>
    );
  }

  const eyebrow = article.publication === "report" ? "Club report" : (article.sectionLabel ?? "Media Hub");

  return (
    <div className="space-y-8">
      <BackLink />
      <article className="mx-auto max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight">{article.title}</h1>
        {article.standfirst ? <p className="mt-4 text-lg text-muted-foreground">{article.standfirst}</p> : null}
        <Byline article={article} className="mt-5" />
        {article.authorRole ? <p className="mt-1 text-sm text-muted-foreground">{article.authorRole}</p> : null}
        {article.imageUrl ? (
          <figure className="mt-8">
            <ArticleImage article={article} className="h-64 w-full rounded-lg object-cover sm:h-96" />
            {article.caption ? (
              <figcaption className="mt-2 text-xs text-muted-foreground">{article.caption}</figcaption>
            ) : null}
          </figure>
        ) : null}
        <div className="mt-8 space-y-5 leading-relaxed text-foreground/90">
          {(article.body ?? []).map((p, i) => (
            <p key={i} className={i === 0 ? "text-lg" : undefined}>
              {p}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
