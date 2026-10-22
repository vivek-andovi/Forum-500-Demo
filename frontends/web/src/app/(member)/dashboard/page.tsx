"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { QueryState } from "@/components/QueryState";
import { useDashboard } from "@/features/site/queries";
import { ActionsSection } from "./_components/ActionsSection";
import { CommsSection } from "./_components/CommsSection";
import { EventsSection } from "./_components/EventsSection";
import { MediaSection } from "./_components/MediaSection";
import { MembershipSection } from "./_components/MembershipSection";

// UI state lives here (not in the sections) so it survives the loading/error state above unmounting them.
export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const [openThread, setOpenThread] = useState<string | null>(null);
  const [openMember, setOpenMember] = useState<string | null>(null);
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const [eventsCollapsed, setEventsCollapsed] = useState(true);
  const [membershipCollapsed, setMembershipCollapsed] = useState(true);
  const [mediaCollapsed, setMediaCollapsed] = useState(true);
  const [commsCollapsed, setCommsCollapsed] = useState(true);
  const [actionsCollapsed, setActionsCollapsed] = useState(true);

  const me = data?.member ?? null;
  const firstName = me?.fullName?.split(" ")[0] || "Member";
  const isAdmin = !isLoading && !!data && !me;

  if (isLoading || error || !data) {
    return (
      <div className="space-y-16">
        <PageHeader pageKey="dashboard" eyebrow="Dashboard" title="Welcome back" description="Stay up to date with your Membership" />
        <QueryState isLoading={isLoading} error={error} />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      <div>
        <PageHeader
          pageKey="dashboard"
          eyebrow="Dashboard"
          title="Welcome back"
          titleOverride={me ? `Welcome back, ${firstName}` : undefined}
          description={isAdmin ? "Admin account — no member profile" : "Stay up to date with your Membership"}
        />
      </div>

      <EventsSection
        data={data}
        me={me}
        collapsed={eventsCollapsed}
        onToggleCollapsed={() => setEventsCollapsed((v) => !v)}
        openEvent={openEvent}
        setOpenEvent={setOpenEvent}
      />

      <MembershipSection
        data={data}
        collapsed={membershipCollapsed}
        onToggleCollapsed={() => setMembershipCollapsed((v) => !v)}
        openMember={openMember}
        setOpenMember={setOpenMember}
      />

      <MediaSection
        data={data}
        me={me}
        collapsed={mediaCollapsed}
        onToggleCollapsed={() => setMediaCollapsed((v) => !v)}
      />

      <CommsSection
        data={data}
        me={me}
        collapsed={commsCollapsed}
        onToggleCollapsed={() => setCommsCollapsed((v) => !v)}
        openThread={openThread}
        setOpenThread={setOpenThread}
      />

      <ActionsSection
        data={data}
        collapsed={actionsCollapsed}
        onToggleCollapsed={() => setActionsCollapsed((v) => !v)}
        onExpand={() => setActionsCollapsed(false)}
      />
    </div>
  );
}
