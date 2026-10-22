import {
  CalendarDays,
  Cog,
  Inbox,
  type LucideIcon,
  Monitor,
  Newspaper,
  Shield,
  Users,
} from "lucide-react";

/** Sidebar group icons. Resource icons live in lib/resource-registry.ts. */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  Membership: Users,
  Events: CalendarDays,
  Media: Newspaper,
  Communications: Inbox,
  Website: Monitor,
  Configuration: Cog,
  System: Shield,
};
