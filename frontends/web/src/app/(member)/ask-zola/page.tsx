"use client";

import { useState, type FormEvent } from "react";
import { Send, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { DynamicIcon } from "@/components/DynamicIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { useAskConcierge, useConcierge, useQuickPrompts } from "@/lib/queries";
import { useCurrentMember } from "@/hooks/useAuth";
import { timeAgo } from "@/lib/format";
import type { ConciergeStatus, QuickPrompt } from "@/lib/types";

const STATUS_STYLES: Record<ConciergeStatus, string> = {
  open: "border-border text-muted-foreground",
  answered: "border-accent/40 bg-accent/10 text-accent",
  closed: "border-border bg-muted text-muted-foreground",
};

export default function AskZolaPage() {
  const [prompt, setPrompt] = useState("");
  const [promptType, setPromptType] = useState<string>("general");
  const [submitted, setSubmitted] = useState(false);
  const { member, isLoading: meLoading } = useCurrentMember();
  const ask = useAskConcierge();
  const requests = useConcierge(!!member);
  const promptsQ = useQuickPrompts();
  const prompts = [...(promptsQ.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const promptLabels: Record<string, string> = Object.fromEntries(prompts.map((p) => [p.key, p.label]));

  function applyPrompt(p: QuickPrompt) {
    setPrompt(p.template);
    setPromptType(p.key);
    setSubmitted(false);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    ask.mutate(
      { promptType: promptType.slice(0, 60), body: prompt.trim().slice(0, 4000) },
      {
        onSuccess: () => {
          toast.success("Your request has been sent to the Forum team");
          setSubmitted(true);
          setPrompt("");
          setPromptType("general");
        },
      },
    );
  }

  const list = requests.data ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        pageKey="ask-zola"
        eyebrow="Concierge"
        title="Ask Zola"
        description="Your Forum500 assistant. Ask a question, request an introduction, or find something in the community."
      />

      {meLoading ? (
        <QueryState isLoading />
      ) : !member ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">Admin account — no member profile. Concierge requests are available to members only.</p>
        </div>
      ) : (
      <>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <label htmlFor="zola-prompt" className="block text-sm font-medium text-foreground">
              What would you like to ask?
            </label>
            <div className="flex flex-wrap gap-2">
              {promptsQ.isLoading &&
                Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-32 rounded-full" />)}
              {prompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPrompt(p)}
                  aria-pressed={promptType === p.key}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent ${
                    promptType === p.key ? "border-accent bg-accent/10 text-accent" : "border-border bg-background text-foreground"
                  }`}
                >
                  <DynamicIcon name={p.icon} className="h-4 w-4" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="zola-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (submitted) setSubmitted(false);
            }}
            placeholder="e.g. Who should I meet in Singapore? / What events are happening this month?"
            rows={5}
            maxLength={4000}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Requests are answered personally by the Forum team.</p>
            <button
              type="submit"
              disabled={!prompt.trim() || ask.isPending}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ask.isPending ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" /> Sending…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Ask Zola
                </>
              )}
            </button>
          </div>
        </form>

        {submitted && (
          <div className="mt-8 rounded-lg border-l-4 border-accent bg-muted/50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-accent" /> Thank you
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Thank you — the Forum team will reply. You&apos;ll find the answer to your request below as soon as it&apos;s ready.
            </p>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-medium">My requests</h2>
        <QueryState
          isLoading={requests.isLoading}
          error={requests.error}
          empty={list.length === 0}
          emptyText="You haven't asked Zola anything yet."
        >
          <ul className="space-y-3">
            {list.map((r) => (
              <li key={r.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
                    {(r.promptType && promptLabels[r.promptType]) || r.promptType || promptLabels.general || "General"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLES[r.status] ?? STATUS_STYLES.open}`}
                    >
                      {r.status}
                    </span>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">{r.body}</p>
                {r.adminReply && (
                  <div className="mt-4 rounded-lg border-l-4 border-accent bg-muted/50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-accent" /> Zola
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{r.adminReply}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </QueryState>
      </section>
      </>
      )}
    </div>
  );
}
