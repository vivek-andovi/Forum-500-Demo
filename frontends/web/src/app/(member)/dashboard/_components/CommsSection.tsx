"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { Dashboard } from "@/features/site/types";
import type { Member } from "@/features/membership/types";
import { timeAgo } from "@/lib/format";
import { introducedBy, introOther, introStatusLabel } from "./helpers";
import { ThreadRow, WhatsappChip } from "./rows";
import { Empty, Panel, SectionHeading } from "./Panel";

/** Communications: WhatsApp groups, email and introductions. Collapsed is a dense one-item summary.
 * The collapsed state uses the `dense` style and a shorter introduction row, so both trees are kept. */
export function CommsSection({
  data,
  me,
  collapsed,
  onToggleCollapsed,
  openThread,
  setOpenThread,
}: {
  data: Dashboard;
  me: Member | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  openThread: string | null;
  setOpenThread: (id: string | null) => void;
}) {
  const whatsappGroups = data.whatsappGroups ?? [];
  const introductions = data.introductions ?? [];
  const emails = data.emails ?? [];

  return (
    <section className="space-y-4">
      <SectionHeading
        icon={MessageSquare}
        title="Communications"
        to="/comms"
        linkLabel="Communications Hub"
        collapsed={collapsed}
        onToggle={onToggleCollapsed}
        cta={{ to: "/membership", label: "Send a Message" }}
      />
      {collapsed ? (
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel title="My WhatsApp Groups" to="/comms/whatsapp" compact dense>
            {whatsappGroups.length === 0 ? (
              <p className="px-1 py-1 text-[10px] text-muted-foreground">You haven&apos;t joined any groups yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 px-1 py-1">
                {whatsappGroups.map((g) => (
                  <WhatsappChip key={g.id} name={g.name} link={g.inviteLink} dense />
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Messages & Email" to="/comms/emails" compact dense>
            {emails.length === 0 && <p className="px-1 py-1 text-[10px] text-muted-foreground">No messages yet.</p>}
            {emails.slice(0, 1).map((t) => (
              <ThreadRow
                key={t.id}
                t={t}
                open={openThread === t.id}
                onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
                compact
                dense
              />
            ))}
          </Panel>
          <Panel title="Member Introductions" to="/comms/introductions" compact dense>
            {introductions.length === 0 && (
              <p className="px-1 py-1 text-[10px] text-muted-foreground">No introductions yet.</p>
            )}
            {introductions.slice(0, 1).map((i) => {
              const other = introOther(i, me);
              const by = introducedBy(i);
              return (
                <div key={i.id} className="px-1 py-1">
                  <p className="font-display text-sm font-medium leading-tight">
                    {[other?.fullName, other?.chapter?.name].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {by ? `Introduced by ${by}` : introStatusLabel(i)}
                  </p>
                </div>
              );
            })}
          </Panel>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="My WhatsApp Groups" to="/comms/whatsapp">
            {whatsappGroups.length === 0 ? (
              <Empty>You haven&apos;t joined any groups yet.</Empty>
            ) : (
              <div className="flex flex-wrap gap-2 px-2 py-2">
                {whatsappGroups.map((g) => (
                  <WhatsappChip key={g.id} name={g.name} link={g.inviteLink} />
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Messages & Email" to="/comms/emails">
            {emails.length === 0 && <Empty>No messages yet.</Empty>}
            {emails.map((t) => (
              <ThreadRow
                key={t.id}
                t={t}
                open={openThread === t.id}
                onToggle={() => setOpenThread(openThread === t.id ? null : t.id)}
              />
            ))}
          </Panel>
          <Panel title="Member Introductions" to="/comms/introductions" className="lg:col-span-2">
            {introductions.length === 0 && <Empty>No introductions yet.</Empty>}
            {introductions.map((i) => {
              const other = introOther(i, me);
              const by = introducedBy(i);
              return (
                <div key={i.id} className="px-2 py-2">
                  <div className="flex items-center justify-between gap-2">
                    {other?.slug ? (
                      <Link href={`/membership/${other.slug}`} className="font-display text-base font-medium hover:underline">
                        {[other.fullName, other.chapter?.name].filter(Boolean).join(" · ")}
                      </Link>
                    ) : (
                      <p className="font-display text-base font-medium">{other?.fullName ?? ""}</p>
                    )}
                    <span className="text-[10px] text-muted-foreground">{timeAgo(i.createdAt)}</span>
                  </div>
                  <p className="text-xs font-semibold text-accent">
                    {by ? `Introduced by ${by}` : introStatusLabel(i)}
                  </p>
                  {i.reason && <p className="text-xs text-muted-foreground">{i.reason}</p>}
                </div>
              );
            })}
          </Panel>
        </div>
      )}
    </section>
  );
}
