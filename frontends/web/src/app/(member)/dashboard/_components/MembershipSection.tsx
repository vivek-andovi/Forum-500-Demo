"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { Dashboard } from "@/features/site/types";
import { groupMeta } from "./helpers";
import { NewMemberCard, OfferRow } from "./rows";
import { Empty, Panel, SectionHeading } from "./Panel";

/** Membership: new members, featured and opted-in benefits, my groups. Collapsed shows one of each.
 * One tree for both states: collapsing only changes the limits, `compact` and groupMeta's note. */
export function MembershipSection({
  data,
  collapsed,
  onToggleCollapsed,
  openMember,
  setOpenMember,
}: {
  data: Dashboard;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  openMember: string | null;
  setOpenMember: (id: string | null) => void;
}) {
  const newMembers = data.newMembers ?? [];
  const featuredOffers = data.featuredOffers ?? [];
  const myOffers = data.myOffers ?? [];
  const myGroups = data.myGroups ?? [];

  return (
    <section className="space-y-4">
      <SectionHeading
        icon={Users}
        title="Membership"
        to="/membership"
        linkLabel="Membership Hub"
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
        cta={{ to: "/membership", label: "Find a Member" }}
      />
      <div className="space-y-4">
        <Panel title="New Members" to="/membership" compact={collapsed}>
          {newMembers.length === 0 && <Empty />}
          {(collapsed ? newMembers.slice(0, 1) : newMembers).map((m) => (
            <NewMemberCard
              key={m.id}
              m={m}
              open={openMember === m.id}
              onToggle={() => setOpenMember(openMember === m.id ? null : m.id)}
              compact={collapsed}
            />
          ))}
        </Panel>
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Benefits in Focus" to="/membership/benefits" compact={collapsed}>
            {featuredOffers.length === 0 && <Empty />}
            {featuredOffers.slice(0, collapsed ? 1 : 3).map((o) => (
              <OfferRow key={o.id} offer={o} compact={collapsed} />
            ))}
          </Panel>
          <Panel title="My Benefits" to="/membership/benefits" compact={collapsed}>
            {myOffers.length === 0 && <Empty>You haven&apos;t opted into any benefits yet.</Empty>}
            {(collapsed ? myOffers.slice(0, 1) : myOffers).map((o) => (
              <OfferRow key={o.id} offer={o} badge="Opted in" compact={collapsed} />
            ))}
          </Panel>
          <Panel title="My Groups" to="/membership/groups" compact={collapsed}>
            {myGroups.length === 0 && <Empty>You haven&apos;t joined any groups yet.</Empty>}
            {myGroups.slice(0, collapsed ? 1 : 4).map((g) => (
              <Link key={g.id} href="/membership/groups" className="block px-2 py-2">
                <p className="font-display text-base font-medium">{g.name}</p>
                <p className="text-xs text-muted-foreground">{groupMeta(g, !collapsed)}</p>
              </Link>
            ))}
          </Panel>
        </div>
      </div>
    </section>
  );
}
