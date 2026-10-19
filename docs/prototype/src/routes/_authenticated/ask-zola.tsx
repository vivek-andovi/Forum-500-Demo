import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Send,
  Sparkles,
  Plane,
  Briefcase,
  Users,
  HeartHandshake,
  CalendarDays,
  MapPin,
  Lightbulb,
  MessageCircleQuestion,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_authenticated/ask-zola")({
  component: AskZola,
  head: () => ({
    meta: [
      { title: "Ask Zola — Forum500" },
      { name: "description", content: "Ask Zola, your Forum500 concierge. Coming soon." },
      { property: "og:title", content: "Ask Zola — Forum500" },
      { property: "og:description", content: "Ask Zola, your Forum500 concierge. Coming soon." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type QuickPrompt = {
  id: string;
  label: string;
  template: string;
  icon: React.ReactNode;
};

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: "travel",
    label: "Travel connect",
    template:
      "I'm traveling to [SOMEWHERE] for [PURPOSE]. Please connect me with relevant Forum members who might be there or have useful local contacts.",
    icon: <Plane className="h-4 w-4" />,
  },
  {
    id: "needs-leads",
    label: "Needs & Leads",
    template:
      "I have a Need or Lead I'd like to share with Forum members. [DESCRIBE WHAT YOU NEED OR WHAT YOU CAN OFFER]. Please help surface the right connects.",
    icon: <HeartHandshake className="h-4 w-4" />,
  },
  {
    id: "shared-interests",
    label: "Shared interests",
    template:
      "Please connect me with Forum members who share an interest in [WORK TOPIC OR SOCIAL INTEREST] — I'd love to meet them for [COFFEE / CALL / DINNER / COLLABORATION].",
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: "advice",
    label: "Expert advice",
    template:
      "I'd like advice on [TOPIC / DECISION]. Can you introduce me to a Forum member with relevant experience, or suggest who I should speak to?",
    icon: <Briefcase className="h-4 w-4" />,
  },
  {
    id: "events",
    label: "Event recommendation",
    template:
      "What Forum gatherings, salons, or member-organized events should I attend in the next few weeks? I'm particularly interested in [TOPIC / CITY / FORMAT].",
    icon: <CalendarDays className="h-4 w-4" />,
  },
  {
    id: "host",
    label: "Find a host",
    template:
      "I'm visiting [CITY] and would love to meet Forum members there. Can you suggest a host, venue, or upcoming gathering I can join?",
    icon: <MapPin className="h-4 w-4" />,
  },
  {
    id: "idea",
    label: "Make an idea happen",
    template:
      "I have an idea for Forum500 / In:Forum / an event / a partnership. [DESCRIBE THE IDEA]. Who should I speak to about making it happen?",
    icon: <Lightbulb className="h-4 w-4" />,
  },
  {
    id: "general",
    label: "Ask anything",
    template: "",
    icon: <MessageCircleQuestion className="h-4 w-4" />,
  },
];

function AskZola() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function applyPrompt(template: string) {
    setPrompt(template);
    setResponse(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse(null);
    // Placeholder while the Zola integration is defined
    setTimeout(() => {
      setResponse(
        "This is a placeholder response. Once the Zola integration is ready, your question will be routed to the concierge and you'll receive a real answer here."
      );
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        eyebrow="Concierge"
        title="Ask Zola"
        description="Your Forum500 assistant. Ask a question, request an introduction, or find something in the community."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <label htmlFor="zola-prompt" className="block text-sm font-medium text-foreground">
              What would you like to ask?
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPrompt(p.template)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-accent hover:bg-accent/10 hover:text-accent"
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="zola-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Who should I meet in Singapore? / What events are happening this month?"
            rows={5}
            className="w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Integration with Zola is coming soon.</p>
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 animate-pulse" /> Zola is thinking…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Ask Zola
                </>
              )}
            </button>
          </div>
        </form>

        {response && (
          <div className="mt-8 rounded-lg border-l-4 border-accent bg-muted/50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-accent" /> Zola
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
