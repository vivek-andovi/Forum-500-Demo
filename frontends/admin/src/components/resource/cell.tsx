import { Check, Minus } from "lucide-react";
import type { AdminRecord, FieldMeta } from "@/lib/types";
import { formatDateTime, stringify, truncate } from "@/lib/format";
import { StatusBadge } from "@/components/common/status-badge";

export function CellValue({
  row,
  field,
  name,
  isLabel,
}: {
  row: AdminRecord;
  field?: FieldMeta;
  name: string;
  isLabel?: boolean;
}) {
  const value = row[name];
  const empty = <span className="text-muted-foreground/60">—</span>;

  if (!field) {
    const s = stringify(value);
    return s ? <span>{truncate(s, 60)}</span> : empty;
  }

  if (field.type === "relation") {
    const label = row._relations?.[name];
    if (!value) return empty;
    return (
      <span className="whitespace-nowrap text-foreground/90" title={String(value)}>
        {label ?? truncate(String(value), 10)}
      </span>
    );
  }

  if (value === null || value === undefined || value === "") return empty;

  switch (field.type) {
    case "boolean":
      return value ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
          <Check className="size-3" /> Yes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
          <Minus className="size-3" /> No
        </span>
      );
    case "image":
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={String(value)}
          alt=""
          className="size-9 rounded-md border bg-muted object-cover"
          loading="lazy"
        />
      );
    case "datetime":
      return <span className="whitespace-nowrap tabular-nums">{formatDateTime(value)}</span>;
    case "enum":
      return <StatusBadge value={String(value)} />;
    case "string[]": {
      const arr = Array.isArray(value) ? value.map(String) : [String(value)];
      if (!arr.length) return empty;
      return (
        <span className="text-muted-foreground" title={arr.join(", ")}>
          {truncate(arr.join(", "), 50)}
        </span>
      );
    }
    case "json":
      return (
        <code className="font-mono text-xs text-muted-foreground">
          {truncate(stringify(value), 50)}
        </code>
      );
    case "url":
      return (
        <a
          href={String(value)}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary underline-offset-4 hover:underline"
        >
          {truncate(String(value).replace(/^https?:\/\//, ""), 40)}
        </a>
      );
    case "int":
    case "float":
      return <span className="tabular-nums">{String(value)}</span>;
    case "text":
      return (
        <span className="text-muted-foreground" title={String(value)}>
          {truncate(String(value), 60)}
        </span>
      );
    default:
      return (
        <span className={isLabel ? "font-semibold text-foreground" : undefined} title={String(value)}>
          {truncate(stringify(value), 60)}
        </span>
      );
  }
}
