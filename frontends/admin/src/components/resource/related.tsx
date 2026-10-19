"use client";

import { useMeta } from "@/lib/meta";
import type { AdminRecord, ResourceMeta } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceTable } from "@/components/resource/resource-table";

/** Child resources shown under a parent record, keyed by parent resource name. */
export const RELATED: Record<string, { resource: string; fk: string; label?: string }[]> = {
  members: [
    { resource: "event-rsvps", fk: "memberId", label: "RSVPs" },
    { resource: "group-memberships", fk: "memberId", label: "Groups" },
    { resource: "benefit-opt-ins", fk: "memberId", label: "Benefit opt-ins" },
    { resource: "action-items", fk: "memberId", label: "Action items" },
  ],
  events: [
    { resource: "event-rsvps", fk: "eventId", label: "RSVPs" },
    { resource: "event-hosts", fk: "eventId", label: "Hosts" },
  ],
  groups: [{ resource: "group-memberships", fk: "groupId", label: "Members" }],
  "inforum-editions": [{ resource: "edition-articles", fk: "editionId", label: "Articles" }],
  "gallery-albums": [{ resource: "gallery-photos", fk: "albumId", label: "Photos" }],
  "forecast-issues": [{ resource: "articles", fk: "forecastIssueId", label: "Articles" }],
  "whatsapp-groups": [
    { resource: "whatsapp-memberships", fk: "groupId", label: "Members" },
    { resource: "whatsapp-messages", fk: "groupId", label: "Chat messages" },
  ],
  "nav-items": [{ resource: "nav-items", fk: "parentId", label: "Sub-items" }],
  "benefit-offers": [{ resource: "benefit-opt-ins", fk: "offerId", label: "Opt-ins" }],
};

export function RelatedTabs({ resource, record }: { resource: ResourceMeta; record: AdminRecord }) {
  const meta = useMeta();
  const config = RELATED[resource.name];
  if (!config || !meta.data) return null;
  const tabs = config
    .map((c) => ({ ...c, meta: meta.data.resources.find((r) => r.name === c.resource) }))
    .filter((c): c is typeof c & { meta: ResourceMeta } => !!c.meta);
  if (!tabs.length) return null;

  return (
    <section className="space-y-3 pt-2">
      <h2 className="text-xl">Related</h2>
      <Tabs defaultValue={tabs[0].resource + tabs[0].fk}>
        <div className="overflow-x-auto">
          <TabsList>
            {tabs.map((t) => (
              <TabsTrigger key={t.resource + t.fk} value={t.resource + t.fk}>
                {t.label ?? t.meta.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {tabs.map((t) => (
          <TabsContent key={t.resource + t.fk} value={t.resource + t.fk} className="mt-3">
            <ResourceTable resource={t.meta} mode="embedded" fixedFilter={{ [t.fk]: record.id }} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
