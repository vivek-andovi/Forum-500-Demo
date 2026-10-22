"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MemberOnly } from "@/components/MemberOnly";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentMember } from "@/hooks/useAuth";
import { useEdition, useEditions, useInforumTabs } from "@/features/media/queries";
import { usePageCopy } from "@/features/site/queries";
import type { Article, InforumTab } from "@/features/media/types";
import { ArticleDialog } from "./_components/ArticleDialog";
import { CommentsSection } from "./_components/CommentsSection";
import { EditionBanner } from "./_components/EditionBanner";
import { EditionView } from "./_components/EditionView";
import { PitchForm } from "./_components/PitchForm";
import { PreviousEditions } from "./_components/PreviousEditions";
import { RecommendationForm } from "./_components/RecommendationForm";
import { RecommendationsSection } from "./_components/RecommendationsSection";
import { SectionTabs } from "./_components/SectionTabs";

function articlesForTab(tab: InforumTab | undefined, pool: Article[]): Article[] {
  if (!tab) return [];
  if (tab.type === "section") {
    const key = tab.sectionKey ?? tab.id.replace(/^section:/, "");
    return pool.filter((a) => a.section?.key === key);
  }
  if (tab.id === "editors-choice") return pool.filter((a) => a.editorsChoice);
  if (tab.id === "around-the-world") return pool.filter((a) => a.fromAroundWorld);
  if (tab.id === "by-members") return pool.filter((a) => a.isMember);
  return [];
}

export default function MemberInForumPage() {
  const pitchBlock = usePageCopy("media/inforum")?.blocks?.find((b) => b.key === "pitch");
  const { member } = useCurrentMember();
  const [tab, setTab] = useState<string>("editors-choice");
  const [editionSlug, setEditionSlug] = useState<string>("current");
  const [open, setOpen] = useState<Article | null>(null);
  const [pitchOpen, setPitchOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);

  const editions = useEditions();
  const editionQ = useEdition(editionSlug);
  const edition = editionQ.data;
  const editionList = editions.data ?? [];
  const latestSlug = editionList[0]?.slug;
  const isCurrent = editionSlug === "current" || (!!latestSlug && editionSlug === latestSlug);
  const activeSlug = edition?.slug ?? (editionSlug === "current" ? latestSlug : editionSlug);

  const tabsQ = useInforumTabs();
  const tabs = tabsQ.data ?? [];
  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0];
  const activeId = activeTab?.id;

  const articles = articlesForTab(activeTab, edition?.articles ?? []);

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="media/inforum"
        eyebrow="Media Hub"
        title="In:Forum"
        description="The full member edition — reporting, essays and dispatches from the Forum500 community."
      />

      <div id="make-an-idea-happen" className="rounded-lg border border-border bg-secondary/50 p-6">
        <h3 className="font-display text-lg font-medium">{pitchBlock?.title}</h3>
        {pitchBlock?.body && <p className="mt-2 text-sm text-muted-foreground">{pitchBlock.body}</p>}
        <MemberOnly
          member={member}
          className="mt-4 text-xs text-muted-foreground"
          message="Admin account — no member profile."
        >
          <Button className="mt-4" variant="outline" onClick={() => setPitchOpen(true)}>
            {pitchBlock?.ctaLabel ?? "Pitch"}
          </Button>
        </MemberOnly>
      </div>

      <EditionBanner
        edition={edition}
        isCurrent={isCurrent}
        isLoading={editionQ.isLoading}
        onBackToCurrent={() => setEditionSlug("current")}
      />

      <SectionTabs tabs={tabs} activeId={activeId} isLoading={tabsQ.isLoading} onSelect={setTab} />

      {activeId === "recommendations" ? (
        <RecommendationsSection onShare={() => setRecOpen(true)} />
      ) : activeId === "comments" ? (
        <CommentsSection />
      ) : (
        <EditionView articles={articles} isLoading={editionQ.isLoading} error={editionQ.error} onOpen={setOpen} />
      )}

      <PreviousEditions
        editionList={editionList}
        activeSlug={activeSlug}
        isLoading={editions.isLoading}
        error={editions.error}
        onSelect={(e) => {
          setEditionSlug(e.slug === latestSlug ? "current" : e.slug);
          setTab("editors-choice");
          if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <ArticleDialog open={open} onClose={() => setOpen(null)} />

      <Dialog open={pitchOpen} onOpenChange={setPitchOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl leading-snug">Pitch a story</DialogTitle>
          </DialogHeader>
          {pitchOpen ? <PitchForm onClose={() => setPitchOpen(false)} /> : null}
        </DialogContent>
      </Dialog>

      <Dialog open={recOpen} onOpenChange={setRecOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl leading-snug">Share a recommendation</DialogTitle>
          </DialogHeader>
          {recOpen ? <RecommendationForm onClose={() => setRecOpen(false)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
