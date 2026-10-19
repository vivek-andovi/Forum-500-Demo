import { cn } from "@/lib/utils";
import { humanize, toneFor } from "@/lib/format";

export function StatusBadge({ value, className }: { value: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneFor(value),
        className,
      )}
    >
      {humanize(value)}
    </span>
  );
}
