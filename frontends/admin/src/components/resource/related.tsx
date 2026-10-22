"use client";

import { useMeta } from "@/lib/meta";
import { resourceConfig } from "@/lib/resource-registry";
import type { AdminRecord, ResourceMeta } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceTable } from "@/components/resource/resource-table";

/** Child lists under a record, configured as `related` in lib/resource-registry. */
export function RelatedTabs({ resource, record }: { resource: ResourceMeta; record: AdminRecord }) {
  const meta = useMeta();
  const config = resourceConfig(resource.name).related;
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
