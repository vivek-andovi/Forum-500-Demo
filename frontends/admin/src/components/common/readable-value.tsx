import { formatDateTime, humanize } from "@/lib/format";

type Refs = Record<string, string | null | undefined> | undefined;

const empty = <span className="text-muted-foreground/70">—</span>;
const isIdKey = (k: string) => /Id$/.test(k);

/**
 * JSON shown as an admin reads it, not as code: labelled fields, lists, dates, and ids
 * replaced by the record they point to (`refs`, from a record's `_refs`). An id field that
 * resolves becomes the heading of its object, so `{ questionId, answer }` reads as the
 * question followed by the answer.
 */
export function ReadableValue({ value, refs }: { value: unknown; refs?: Refs }) {
  if (value === null || value === undefined || value === "") return empty;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (typeof value === "number") return <>{value}</>;
  if (typeof value === "string") {
    if (refs?.[value]) return <>{refs[value]}</>;
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return <>{formatDateTime(value)}</>;
    if (/^https?:\/\//i.test(value)) {
      // Images as a thumbnail, other links as a short clickable host + path.
      const image = /\.(png|jpe?g|webp|gif|avif|svg)(\?|$)/i.test(value);
      return (
        <a href={value} target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-14 w-14 rounded-md border object-cover" />
          ) : (
            value.replace(/^https?:\/\//, "").slice(0, 60)
          )}
        </a>
      );
    }
    return <span className="whitespace-pre-wrap break-words">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (!value.length) return empty;
    if (value.every((v) => typeof v !== "object" || v === null)) {
      return <>{value.map((v) => (typeof v === "string" && refs?.[v]) || String(v)).join(", ")}</>;
    }
    return (
      <ol className="space-y-2">
        {value.map((v, i) => (
          <li key={i} className="rounded-md border bg-background/60 px-3 py-2">
            <ReadableValue value={v} refs={refs} />
          </li>
        ))}
      </ol>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (!entries.length) return empty;
    const headings = entries.filter(([k, v]) => isIdKey(k) && typeof v === "string" && refs?.[v]);
    const rest = entries.filter((e) => !headings.includes(e));
    return (
      <div className="space-y-1">
        {headings.map(([k, v]) => (
          <p key={k} className="font-semibold">
            {refs![v as string]}
          </p>
        ))}
        {rest.length > 0 && (
          <dl className="space-y-1">
            {rest.map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-x-2">
                <dt className="text-muted-foreground">{humanize(isIdKey(k) ? k.slice(0, -2) : k)}:</dt>
                <dd className="min-w-0">
                  <ReadableValue value={v} refs={refs} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    );
  }
  return <>{String(value)}</>;
}
