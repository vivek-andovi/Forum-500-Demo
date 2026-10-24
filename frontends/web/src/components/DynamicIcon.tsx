import {
  BookOpen,
  Briefcase,
  CalendarDays,
  Circle,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  Lightbulb,
  MapPin,
  MessageCircleQuestion,
  MessageSquare,
  Newspaper,
  Plane,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Explicit map of the lucide icon names the CMS may reference. Unknown names
// fall back to a neutral circle so a typo in the admin never breaks a page.
const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Briefcase,
  CalendarDays,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  Lightbulb,
  MapPin,
  MessageCircleQuestion,
  MessageSquare,
  Newspaper,
  Plane,
  Sparkles,
  Trophy,
  Users,
};

function iconFor(name: string | null | undefined): LucideIcon {
  return (name && ICONS[name]) || Circle;
}

export function DynamicIcon({ name, ...props }: { name: string | null | undefined } & Omit<LucideProps, "name">) {
  const Icon = iconFor(name);
  return <Icon {...props} />;
}
