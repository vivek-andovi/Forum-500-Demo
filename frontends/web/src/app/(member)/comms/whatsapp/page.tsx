"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, ExternalLink, MessageCircle, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { ChatComposer } from "@/components/ChatComposer";
import { useCurrentMember } from "@/hooks/useAuth";
import { useGroupChat, useJoinWhatsapp, usePostGroupMessage, useWhatsapp } from "@/features/comms/queries";
import { fmtDate, timeAgo } from "@/lib/format";
import type { GroupChatMessage, WhatsappGroup, WhatsappMembership } from "@/features/comms/types";

function msgTime(iso: string) {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? fmtDate(iso, "HH:mm") : fmtDate(iso, "d MMM, HH:mm");
}

/** Sidebar row for an approved group; shares the cached chat query with the open panel. */
function GroupRow({ group, isActive, onSelect }: { group: WhatsappGroup; isActive: boolean; onSelect: () => void }) {
  const chat = useGroupChat(group.id, true);
  const last = chat.data?.at(-1);
  return (
    <li>
      <button
        onClick={onSelect}
        aria-current={isActive}
        className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors ${
          isActive ? "bg-secondary" : "hover:bg-secondary/60"
        }`}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="font-medium">{group.name}</span>
          <span className="text-xs text-muted-foreground">{last ? timeAgo(last.createdAt) : ""}</span>
        </span>
        <span className="line-clamp-1 text-sm text-muted-foreground">
          {chat.isLoading ? "Loading…" : last ? `${last.mine ? "You" : last.authorName}: ${last.body}` : "No messages yet"}
        </span>
      </button>
    </li>
  );
}

function ChatMessages({ messages }: { messages: GroupChatMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const lastId = messages.at(-1)?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [lastId]);
  return (
    <>
      {messages.map((m) => (
        <div key={m.id} className={`flex items-end gap-2 ${m.mine ? "justify-end" : "justify-start"}`}>
          {!m.mine && (
            <MemberAvatar src={m.authorPhotoUrl} name={m.authorName} className="h-8 w-8 shrink-0 rounded-full text-xs" />
          )}
          <div
            className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
              m.mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
            }`}
          >
            {!m.mine && <p className="text-xs font-semibold opacity-80">{m.authorName}</p>}
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{m.body}</p>
            <p className={`mt-1 text-[11px] ${m.mine ? "opacity-70" : "text-muted-foreground"}`}>{msgTime(m.createdAt)}</p>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </>
  );
}

export default function WhatsAppGroupsPage() {
  const { member } = useCurrentMember();
  const { data, isLoading, error } = useWhatsapp();
  const join = useJoinWhatsapp();

  const openAccess = !!data?.openAccess;
  const groups = useMemo(() => data?.groups ?? [], [data]);
  const memberships = useMemo(() => data?.memberships ?? [], [data]);
  const membershipFor = useMemo(() => {
    const map = new Map<string, WhatsappMembership>();
    for (const m of memberships) map.set(m.groupId, m);
    return map;
  }, [memberships]);

  const joined = useMemo(
    () =>
      groups.filter((g) => membershipFor.get(g.id)?.status === "approved").map((g) => ({
        group: g,
        inviteLink: membershipFor.get(g.id)?.group?.inviteLink ?? g.inviteLink ?? null,
      })),
    [groups, membershipFor],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const active = joined.find((j) => j.group.id === activeId) ?? joined[0] ?? null;
  const [query, setQuery] = useState("");
  const chat = useGroupChat(active?.group.id, !!active);
  const post = usePostGroupMessage();
  const messages = chat.data ?? [];

  const discoverable = useMemo(
    () =>
      groups
        .filter((g) => membershipFor.get(g.id)?.status !== "approved")
        .filter((g) =>
          `${g.name} ${g.chapter?.name ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
        ),
    [groups, membershipFor, query],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="comms/whatsapp"
        eyebrow="Communications Hub"
        title="Chapter WhatsApp Groups"
        description="Your chapter groups live in WhatsApp. Request to join here, then open the group in WhatsApp once a chapter host approves you."
      />

      <QueryState isLoading={isLoading} error={error}>
        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">My groups</p>
            </div>
            {joined.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                You haven&apos;t joined a chapter group yet. Request one below.
              </p>
            ) : (
              <ul className="max-h-[520px] overflow-y-auto">
                {joined.map(({ group }) => (
                  <GroupRow
                    key={group.id}
                    group={group}
                    isActive={active?.group.id === group.id}
                    onSelect={() => setActiveId(group.id)}
                  />
                ))}
              </ul>
            )}
          </aside>

          <section className="flex min-h-[520px] flex-col rounded-lg border border-border bg-card">
            <header className="flex flex-wrap items-center gap-2 border-b border-border px-5 py-4">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-medium">{active ? active.group.name : "Chapter group"}</h2>
              {active?.inviteLink && (
                <a
                  href={active.inviteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in WhatsApp
                </a>
              )}
              <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />{" "}
                {active?.group.moderator?.fullName
                  ? `Moderated by ${active.group.moderator.fullName}`
                  : "Moderated by the chapter host"}
              </span>
            </header>

            <div className="max-h-[560px] flex-1 space-y-3 overflow-y-auto px-5 py-4" data-testid="group-chat">
              {!active ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
                  <MessageCircle className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Request to join a chapter group below. Once a chapter host approves you, the group chat appears here.
                  </p>
                </div>
              ) : chat.isLoading ? (
                <QueryState isLoading />
              ) : chat.error ? (
                <QueryState error={chat.error} />
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages yet — start the conversation.</p>
              ) : (
                <ChatMessages messages={messages} />
              )}
            </div>

            {active && (
              <ChatComposer
                key={active.group.id}
                busy={post.isPending}
                placeholder={`Message ${active.group.name}…`}
                onSend={(body) => post.mutateAsync({ groupId: active.group.id, body })}
              />
            )}
          </section>
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-medium">Join another chapter group</h2>
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chapters"
                aria-label="Search chapter groups"
                className="w-64 rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          {discoverable.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No other chapter groups to join.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {discoverable.map((g) => {
                const status = membershipFor.get(g.id)?.status;
                const pending = status === "requested";
                const busy = join.isPending && join.variables === g.id;
                return (
                  <div key={g.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-5">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-medium">{g.name}</h3>
                      <p className="text-sm text-muted-foreground">{g.chapter?.name ?? "Chapter group"}</p>
                    </div>
                    {openAccess && g.inviteLink ? (
                      <a
                        href={g.inviteLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex shrink-0 items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        <ExternalLink className="h-4 w-4" /> Join on WhatsApp
                      </a>
                    ) : pending ? (
                      <span className="flex shrink-0 items-center gap-2 rounded-md border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground">
                        <Clock className="h-4 w-4" /> Request pending
                      </span>
                    ) : (
                      <button
                        disabled={!member || busy}
                        onClick={() =>
                          join.mutate(g.id, {
                            onSuccess: () =>
                              toast.success("Request sent", {
                                description: `A chapter host will review your request to join ${g.name}.`,
                              }),
                          })
                        }
                        className="flex shrink-0 items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                      >
                        <MessageCircle className="h-4 w-4" /> {busy ? "Requesting…" : "Request to join"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {openAccess
              ? "Groups are moderated by chapter hosts. Join any group directly in WhatsApp."
              : "Groups are moderated by chapter hosts. Join requests are approved against your member profile."}
          </p>
        </div>
      </QueryState>
    </div>
  );
}
