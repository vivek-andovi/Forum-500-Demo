"use client";

import { X } from "lucide-react";
import { humanize } from "@/lib/format";
import { useOptionLabels } from "@/lib/queries";
import type { FieldMeta } from "@/lib/types";

/** Removable chips for the active `filter.<field>` params, plus "Clear all". */
export function FilterChips({
  filters,
  fieldMap,
  onChange,
}: {
  filters: Record<string, string>;
  fieldMap: Map<string, FieldMeta>;
  onChange: (filters: Record<string, string>) => void;
}) {
  const entries = Object.entries(filters);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
      {entries.map(([k, v]) => (
        <FilterChip
          key={k}
          field={fieldMap.get(k) ?? { name: k, label: humanize(k), type: "string", required: false, readOnly: false, hidden: false }}
          value={v}
          onRemove={() => {
            const next = { ...filters };
            delete next[k];
            onChange(next);
          }}
        />
      ))}
      {entries.length > 1 && (
        <button
          type="button"
          className="text-xs font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => onChange({})}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function FilterChip({ field, value, onRemove }: { field: FieldMeta; value: string; onRemove: () => void }) {
  const labels = useOptionLabels(
    field.type === "relation" ? field.relation?.resource : undefined,
    field.type === "relation" ? [value] : [],
  );
  const display =
    (value === "null" ? "None" : undefined) ??
    labels.data?.find((o) => o.id === value)?.label ??
    (field.type === "enum" ? humanize(value) : value);
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card py-1 pl-3 pr-1 text-xs">
      <span className="text-muted-foreground">{field.label ?? humanize(field.name)}:</span>
      <span className="truncate font-semibold">{display}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-muted"
        aria-label="Remove filter"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
