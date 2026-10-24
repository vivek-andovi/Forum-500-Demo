import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { formatDateTime, humanize, withRefLabels } from "@/lib/format";
import { ReadableValue } from "@/components/common/readable-value";
import { recordHref } from "@/lib/meta";
import { Card, CardContent } from "@/components/ui/card";
import type { ExtrasProps } from "@/components/resource/extras/types";

type AuditChange = { field: string; label: string; from: unknown; to: unknown };

function renderAuditValue(v: unknown) {
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground/70">—</span>;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (Array.isArray(v)) return v.length ? v.join(", ") : <span className="text-muted-foreground/70">—</span>;
  if (typeof v === "object") return <ReadableValue value={v} />;
  const str = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(str)) return formatDateTime(str);
  return str;
}

/** Read-only view of one audit entry (the generic form is hidden via `hideForm` in the registry). */
export function AuditDetail({ record }: ExtrasProps) {
  // Linked-record ids in before/after (e.g. a changed chapter) are shown by name via `_refs`.
  const changes = withRefLabels((Array.isArray(record.changes) ? record.changes : []) as AuditChange[], record._refs);
  const who = [record.actorName, record.actorEmail].filter(Boolean).join(" · ") || "System";
  const entityLink =
    record.entityId && record.action !== "delete" && record.entity
      ? recordHref(String(record.entity), String(record.entityId))
      : null;
  return (
    <Card>
      <CardContent className="space-y-5 p-5">
        <div className="space-y-1">
          <p className="font-display text-xl">{String(record.summary ?? record.action)}</p>
          <p className="text-sm text-muted-foreground">
            {who} · {formatDateTime(String(record.createdAt))}
            {record.ip ? ` · IP ${String(record.ip)}` : ""}
          </p>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Action</dt>
            <dd className="mt-1 capitalize">{humanize(String(record.action ?? ""))}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Type</dt>
            <dd className="mt-1">{String(record.entityType ?? record.entity ?? "")}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Record</dt>
            <dd className="mt-1">
              {entityLink ? (
                <Link href={entityLink} className="inline-flex items-center gap-1 underline-offset-4 hover:underline">
                  {String(record.entityLabel ?? "Open record")} <ExternalLink className="size-3" />
                </Link>
              ) : (
                String(record.entityLabel ?? "—")
              )}
            </dd>
          </div>
        </dl>
        {changes.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Field</th>
                  <th className="px-3 py-2 font-medium">Before</th>
                  <th className="px-3 py-2 font-medium">After</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((c) => (
                  <tr key={c.field} className="border-t align-top">
                    <td className="px-3 py-2 font-medium">{c.label}</td>
                    <td className="max-w-xs px-3 py-2 text-muted-foreground line-through decoration-muted-foreground/40">{renderAuditValue(c.from)}</td>
                    <td className="max-w-xs px-3 py-2">{renderAuditValue(c.to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No field-level changes recorded for this action.</p>
        )}
      </CardContent>
    </Card>
  );
}
