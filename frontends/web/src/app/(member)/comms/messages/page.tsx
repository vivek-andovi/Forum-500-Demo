"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, PenSquare, Search } from "lucide-react";
import { ChatComposer as Composer } from "@/components/ChatComposer";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { MemberAvatar } from "@/components/Avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentMember } from "@/hooks/useAuth";
import {
  qk,
  useConversation,
  useConversations,
  useMember,
  useMembers,
  useReply,
  useSendMessage,
} from "@/lib/queries";
import { fmtDate, timeAgo } from "@/lib/format";
import type { ConversationSummary, DirectMessage, MessageMember } from "@/lib/types";

export default function MessagesPage() {
  return (
    <Suspense fallback={<QueryState isLoading />}>
      <MessagesInner />
    </Suspense>
  );
}

function MessagesInner() {
  const { member: me, isLoading: meLoading } = useCurrentMember();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        pageKey="comms/messages"
        eyebrow="Communications Hub"
        title="Messages"
        description="Introductions and conversations with fellow members."
        action={
          me ? (
            <button
              type="button"
              onClick={() => setComposeOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <PenSquare className="h-4 w-4" /> New message
            </button>
          ) : null
        }
      />

      {meLoading ? (
        <QueryState isLoading />
      ) : !me ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">
            Admin account — no member profile. Direct messages are available to members only.
          </p>
        </div>
      ) : (
        <Inbox myId={me.id} composeOpen={composeOpen} setComposeOpen={setComposeOpen} />
      )}
    </div>
  );
}

function Inbox({
  myId,
  composeOpen,
  setComposeOpen,
}: {
  myId: string;
  composeOpen: boolean;
  setComposeOpen: (v: boolean) => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("c");
  const toId = params.get("to");
  const conversations = useConversations();
  const list = conversations.data ?? [];

  // `?to=<memberId>`: open the existing conversation with that member, if any.
  const existingForTo = toId ? list.find((c) => c.otherMember.id === toId) : undefined;
  useEffect(() => {
    if (existingForTo) router.replace(`/comms/messages?c=${existingForTo.id}`);
  }, [existingForTo, router]);

  const showPanel = !!selectedId || (!!toId && !existingForTo);

  function startWith(memberId: string) {
    setComposeOpen(false);
    const existing = list.find((c) => c.otherMember.id === memberId);
    router.push(existing ? `/comms/messages?c=${existing.id}` : `/comms/messages?to=${memberId}`);
  }

  return (
    <>
      <div className="grid overflow-hidden rounded-lg border border-border bg-card md:h-[70vh] md:min-h-[480px] md:grid-cols-[320px_minmax(0,1fr)]">
        {/* Conversation list */}
        <div className={`min-h-0 flex-col border-border md:flex md:border-r ${showPanel ? "hidden" : "flex"}`}>
          <div className="border-b border-border px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Inbox</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {conversations.isLoading ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-2 py-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.error ? (
              <QueryState error={conversations.error} className="m-4" />
            ) : list.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No conversations yet.{" "}
                <button type="button" onClick={() => setComposeOpen(true)} className="font-semibold text-accent hover:underline">
                  Start one
                </button>
                .
              </div>
            ) : (
              <ul className="divide-y divide-border" data-testid="conversation-list">
                {list.map((c) => (
                  <ConversationRow key={c.id} c={c} active={c.id === selectedId} />
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Thread / compose panel */}
        <div className={`min-h-[60vh] flex-col md:flex md:min-h-0 ${showPanel ? "flex" : "hidden"}`}>
          {selectedId ? (
            <ThreadPanel conversationId={selectedId} />
          ) : toId && !existingForTo ? (
            conversations.isLoading ? (
              <QueryState isLoading className="px-6" />
            ) : (
              <NewThreadPanel memberId={toId} myId={myId} />
            )
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-sm text-muted-foreground">
              <p>Select a conversation, or start a new one.</p>
              <button
                type="button"
                onClick={() => setComposeOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 font-semibold text-foreground hover:border-accent hover:text-accent"
              >
                <PenSquare className="h-4 w-4" /> New message
              </button>
            </div>
          )}
        </div>
      </div>

      <NewMessageDialog open={composeOpen} onOpenChange={setComposeOpen} myId={myId} onPick={startWith} />
    </>
  );
}

function ConversationRow({ c, active }: { c: ConversationSummary; active: boolean }) {
  const preview = c.lastMessage ? `${c.lastMessage.mine ? "You: " : ""}${c.lastMessage.body}` : "No messages yet";
  return (
    <li>
      <Link
        href={`/comms/messages?c=${c.id}`}
        scroll={false}
        className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/40 ${active ? "bg-secondary/60" : ""}`}
      >
        <MemberAvatar src={c.otherMember.avatarUrl} name={c.otherMember.fullName} className="h-11 w-11 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`truncate text-sm ${c.unread ? "font-bold" : "font-medium"}`}>{c.otherMember.fullName}</p>
            <span className="shrink-0 text-xs text-muted-foreground">
              {timeAgo(c.lastMessage?.createdAt ?? c.lastMessageAt)}
            </span>
          </div>
          <p className={`truncate text-sm ${c.unread ? "text-foreground" : "text-muted-foreground"}`}>{preview}</p>
        </div>
        {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
      </Link>
    </li>
  );
}

function PanelHeader({ member }: { member: Pick<MessageMember, "slug" | "fullName" | "avatarUrl" | "headline" | "company"> }) {
  const role = [member.headline, member.company].filter(Boolean).join(", ");
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Link href="/comms/messages" className="text-muted-foreground hover:text-foreground md:hidden" aria-label="Back to inbox">
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <MemberAvatar src={member.avatarUrl} name={member.fullName} className="h-9 w-9 shrink-0 rounded-full" />
      <div className="min-w-0">
        <Link href={`/membership/${member.slug}`} className="truncate text-sm font-semibold hover:underline">
          {member.fullName}
        </Link>
        {role && <p className="truncate text-xs text-muted-foreground">{role}</p>}
      </div>
    </div>
  );
}

function ThreadPanel({ conversationId }: { conversationId: string }) {
  const qc = useQueryClient();
  const thread = useConversation(conversationId);
  const reply = useReply();
  const data = thread.data;

  // Opening a thread marks it read on the server — refresh the inbox unread dots.
  useEffect(() => {
    if (data?.id) qc.invalidateQueries({ queryKey: qk.conversations, exact: true });
  }, [data?.id, qc]);

  if (thread.isLoading) return <QueryState isLoading className="px-6" />;
  if (thread.error || !data) return <QueryState error={thread.error ?? new Error("Conversation not found")} className="m-6" />;

  return (
    <>
      <PanelHeader member={data.otherMember} />
      <MessageList messages={data.messages} />
      <Composer
        busy={reply.isPending}
        placeholder={`Message ${data.otherMember.fullName.split(" ")[0]}…`}
        onSend={(body) => reply.mutateAsync({ conversationId, body })}
      />
    </>
  );
}

function NewThreadPanel({ memberId, myId }: { memberId: string; myId: string }) {
  const router = useRouter();
  const memberQ = useMember(memberId);
  const send = useSendMessage();
  const member = memberQ.data;

  if (memberId === myId) {
    return <p className="p-8 text-center text-sm text-muted-foreground">You can&apos;t message yourself.</p>;
  }
  if (memberQ.isLoading) return <QueryState isLoading className="px-6" />;
  if (memberQ.error || !member) return <QueryState error={memberQ.error ?? new Error("Member not found")} className="m-6" />;

  return (
    <>
      <PanelHeader member={member} />
      <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Start your conversation with {member.fullName}.
      </div>
      <Composer
        autoFocus
        busy={send.isPending}
        placeholder={`Message ${member.fullName.split(" ")[0]}…`}
        onSend={async (body) => {
          const res = await send.mutateAsync({ recipientMemberId: member.id, body });
          router.replace(`/comms/messages?c=${res.conversationId}`);
        }}
      />
    </>
  );
}

function MessageList({ messages }: { messages: DirectMessage[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1]?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [last]);

  return (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-5" data-testid="message-thread">
      {messages.length === 0 && <p className="text-center text-sm text-muted-foreground">No messages yet.</p>}
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
              m.mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-secondary text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap break-words leading-relaxed">{m.body}</p>
            <p className={`mt-1 text-[10px] ${m.mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {fmtDate(m.createdAt, "d MMM, HH:mm")}
            </p>
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}

function NewMessageDialog({
  open,
  onOpenChange,
  myId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  myId: string;
  onPick: (memberId: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);
  const members = useMembers({ search: debounced || undefined });
  const results = (members.data ?? []).filter((m) => m.id !== myId).slice(0, 30);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New message</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name, company or city"
            aria-label="Search members"
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="max-h-80 overflow-y-auto">
          {members.isLoading ? (
            <QueryState isLoading className="py-6" />
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No members found.</p>
          ) : (
            <ul className="divide-y divide-border">
              {results.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onPick(m.id)}
                    className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-secondary/40"
                  >
                    <MemberAvatar src={m.avatarUrl} name={m.fullName} className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[m.headline, m.company].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
