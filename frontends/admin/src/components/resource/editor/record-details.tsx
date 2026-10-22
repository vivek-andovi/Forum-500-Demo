import Link from "next/link";
import { formatDateTime, stringify } from "@/lib/format";
import { recordHref } from "@/lib/meta";
import type { AdminRecord, FieldMeta } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReadableValue } from "@/components/common/readable-value";
import { StatusBadge } from "@/components/common/status-badge";

/** The "Record details" card: read-only fields (id, timestamps, server-set values). */
export function RecordDetails({ fields, record }: { fields: FieldMeta[]; record: AdminRecord }) {
  return (
    <Card className="bg-muted/30 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display font-medium">Record details</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((f) => (
            <div key={f.name} className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {f.label}
              </dt>
              <dd className="mt-0.5 break-words">
                <InfoValue field={f} record={record} />
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function InfoValue({ field, record }: { field: FieldMeta; record: AdminRecord }) {
  const v = record[field.name];
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (field.type === "relation") {
    const resolved = record._relations?.[field.name];
    const label = resolved ?? String(v);
    // No resolved label (e.g. a free-text createdBy such as "import-script"): show the raw value, no link.
    return field.relation && resolved ? (
      <Link href={recordHref(field.relation.resource, String(v))} className="text-primary hover:underline">
        {label}
      </Link>
    ) : (
      <span>{label}</span>
    );
  }
  if (field.type === "datetime") return <span>{formatDateTime(v)}</span>;
  if (field.type === "boolean") return <span>{v ? "Yes" : "No"}</span>;
  if (field.type === "enum") return <StatusBadge value={String(v)} />;
  if (field.type === "json") return <ReadableValue value={v} refs={record._refs} />;
  return <span>{stringify(v)}</span>;
}
