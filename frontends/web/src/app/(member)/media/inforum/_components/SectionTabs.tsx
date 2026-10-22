import { Skeleton } from "@/components/ui/skeleton";
import type { InforumTab } from "@/features/media/types";
import { cn } from "@/lib/utils";

/** The pill tabs (Editor's choice, sections, Recommendations, Comments) across the edition. */
export function SectionTabs({
  tabs,
  activeId,
  isLoading,
  onSelect,
}: {
  tabs: InforumTab[];
  activeId: string | undefined;
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto border-y border-border">
      <div className="flex min-w-max items-center gap-1 px-1 py-2">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] transition-colors",
              activeId === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
