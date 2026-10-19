import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Home,
  LogOut,
  MessageSquare,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Hub {
  label: string;
  icon: typeof Users;
  base: string;
  items: { to: string; label: string }[];
}

const hubs: Hub[] = [
  {
    label: "Membership",
    icon: Users,
    base: "/membership",
    items: [
      { to: "/membership/profile", label: "My Member Profile" },
      { to: "/membership", label: "Member Directory" },
      { to: "/membership/benefits", label: "Member Benefits" },
      { to: "/membership/groups", label: "Member Groups" },
      { to: "/membership/club-rules", label: "Club Rules" },
    ],
  },
  {
    label: "Events",
    icon: CalendarDays,
    base: "/events",
    items: [
      { to: "/events", label: "Events Calendar" },
      { to: "/events/my-events", label: "My Events" },
      { to: "/events/venues", label: "Venues" },
      { to: "/events/gallery", label: "Gallery" },
    ],
  },
  {
    label: "Media",
    icon: Newspaper,
    base: "/media",
    items: [
      { to: "/media/inforum", label: "In:Forum" },
      { to: "/media/forecast", label: "Forum500 Forecast" },
      { to: "/media/podcasts", label: "Podcasts" },
      { to: "/media/forum-radio", label: "Forum Radio" },
      { to: "/media/reading", label: "What to read" },
      { to: "/media/articles", label: "Member articles" },
      { to: "/media/books", label: "Member Books" },
      { to: "/media/newsfeed", label: "Newsfeed" },
    ],
  },
  {
    label: "Communications",
    icon: MessageSquare,
    base: "/comms",
    items: [
      { to: "/comms/introductions", label: "Member Introductions" },
      { to: "/comms/whatsapp", label: "WhatsApp groups" },
      { to: "/comms/messages", label: "Messages" },
      { to: "/comms/emails", label: "Emails" },
      { to: "/comms/actions", label: "Actions" },
    ],
  },
];


export function MemberSidebar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(hubs.map((h) => [h.base, pathname.startsWith(h.base)])),
  );

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Link to="/" className="font-display text-xl font-semibold">Forum500</Link>
        <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/60">
          Making Ideas Happen
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          to="/ask-zola"
          className="flex items-center gap-3 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
        >
          <Sparkles className="h-4 w-4" /> Ask Zola
        </Link>
        <Link
          to="/dashboard"
          className={`mt-2 flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent ${
            pathname === "/dashboard" ? "bg-sidebar-accent" : ""
          }`}
        >
          <Home className="h-4 w-4" /> Dashboard
        </Link>
        {hubs.map((hub) => {
          const Icon = hub.icon;
          const isOpen = open[hub.base];
          return (
            <div key={hub.base} className="mt-2">
              <button
                onClick={() => setOpen((o) => ({ ...o, [hub.base]: !o[hub.base] }))}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent"
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1 text-left">{hub.label}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="ml-7 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                  {hub.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-sidebar-accent ${
                        pathname === item.to ? "bg-sidebar-accent font-semibold" : "text-sidebar-foreground/75"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-3 py-4">
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
