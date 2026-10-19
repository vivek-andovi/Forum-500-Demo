import { useMemo, useRef, useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Search, Send, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { whatsappGroups, myWhatsappGroups } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/comms/whatsapp")({
  head: () => ({
    meta: [
      { title: "WhatsApp Groups — Forum500" },
      { name: "description", content: "Read and reply to your Forum500 chapter WhatsApp groups without leaving the Forum." },
      { property: "og:title", content: "WhatsApp Groups — Forum500" },
      { property: "og:description", content: "Read and reply to your Forum500 chapter WhatsApp groups without leaving the Forum." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WhatsAppGroups,
});

type ChatMessage = { id: string; author: string; body: string; time: string; mine?: boolean };

const seedConversations: Record<string, ChatMessage[]> = {
  London: [
    { id: "l1", author: "Jessica Bell", body: "Two seats have opened for Thursday's salon at the Mayfair dining room — first to reply.", time: "09:12" },
    { id: "l2", author: "James Whitfield", body: "I'll take one. Bringing a guest from the Oxford chapter if there's room.", time: "09:20" },
    { id: "l3", author: "Anish", body: "Put me down for the second seat — landing that morning.", time: "09:34", mine: true },
    { id: "l4", author: "Jessica Bell", body: "Both confirmed. Jacket, no tie. 7pm for 7:30.", time: "09:41" },
  ],
  "New York": [
    { id: "n1", author: "Amara Osei", body: "Anyone free for a working breakfast on Tuesday? Thinking Locanda Verde.", time: "Yesterday" },
    { id: "n2", author: "Anish", body: "In. 8am works for me.", time: "Yesterday", mine: true },
    { id: "n3", author: "Daniel Reyes", body: "Same — I'll bring the founder I mentioned at the last dinner.", time: "Yesterday" },
  ],
  Singapore: [
    { id: "s1", author: "Wei Ling Tan", body: "Anyone in town the week of the rooftop reception?", time: "Mon" },
    { id: "s2", author: "Wei Ling Tan", body: "Happy to host a small dinner the night before for members travelling in.", time: "Mon" },
  ],
};

function WhatsAppGroups() {
  const joined = myWhatsappGroups;
  const [active, setActive] = useState(joined[0] ?? "London");
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(seedConversations);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const messages = conversations[active] ?? [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, active]);

  const discoverable = useMemo(
    () =>
      whatsappGroups
        .filter((c) => !joined.includes(c))
        .filter((c) => c.toLowerCase().includes(query.trim().toLowerCase())),
    [joined, query],
  );

  function send() {
    const text = draft.trim();
    if (!text) return;
    setConversations((prev) => ({
      ...prev,
      [active]: [
        ...(prev[active] ?? []),
        {
          id: `${active}-${Date.now()}`,
          author: "Anish",
          body: text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mine: true,
        },
      ],
    }));
    setDraft("");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Chapter WhatsApp Groups"
        description="Read and reply to your chapter groups here — messages sync with WhatsApp, so you never have to leave the Forum."
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">My groups</p>
          </div>
          <ul className="max-h-[520px] overflow-y-auto">
            {joined.map((city) => {
              const last = (conversations[city] ?? []).at(-1);
              return (
                <li key={city}>
                  <button
                    onClick={() => setActive(city)}
                    aria-current={active === city}
                    className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors ${
                      active === city ? "bg-secondary" : "hover:bg-secondary/60"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-medium">{city} chapter</span>
                      <span className="text-xs text-muted-foreground">{last?.time}</span>
                    </span>
                    <span className="line-clamp-1 text-sm text-muted-foreground">{last?.body ?? "No messages yet"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="flex min-h-[520px] flex-col rounded-lg border border-border bg-card">
          <header className="flex items-center gap-2 border-b border-border px-5 py-4">
            <MessageCircle className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-medium">{active} chapter group</h2>
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Moderated by the chapter host
            </span>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                    m.mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {!m.mine && <p className="text-xs font-semibold opacity-80">{m.author}</p>}
                  <p className="text-sm leading-relaxed">{m.body}</p>
                  <p className={`mt-1 text-[11px] ${m.mine ? "opacity-70" : "text-muted-foreground"}`}>{m.time}</p>
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="flex items-end gap-2 border-t border-border px-4 py-3">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={`Message the ${active} chapter…`}
              aria-label={`Message the ${active} chapter group`}
              className="min-h-[42px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={send}
              className="flex h-[42px] items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </section>
      </div>

      <div className="space-y-4">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discoverable.map((city) => (
            <div key={city} className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
              <div>
                <h3 className="font-display text-lg font-medium">{city}</h3>
                <p className="text-sm text-muted-foreground">Chapter group</p>
              </div>
              <button className="flex items-center gap-2 rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <MessageCircle className="h-4 w-4" /> Request
              </button>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Groups are moderated by chapter hosts. Join requests are approved against your member profile.
        </p>
      </div>
    </div>
  );
}
