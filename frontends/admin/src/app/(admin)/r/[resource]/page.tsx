"use client";

import { useParams } from "next/navigation";
import { usePageTitle } from "@/lib/use-debounce";
import { useResourceMeta } from "@/lib/meta";
import { PageHeader } from "@/components/common/page-header";
import { ResourceGate } from "@/components/resource/resource-gate";
import { ResourceTable } from "@/components/resource/resource-table";

export default function ResourceListPage() {
  const { resource: name } = useParams<{ resource: string }>();
  const { resource } = useResourceMeta(name);
  usePageTitle(resource?.label);

  return (
    <ResourceGate name={name}>
      {(r) => (
        <>
          <PageHeader
            eyebrow={r.group}
            title={r.label}
            description={r.readOnly ? "Read-only" : undefined}
          />
          <ResourceTable key={r.name} resource={r} />
        </>
      )}
    </ResourceGate>
  );
}
