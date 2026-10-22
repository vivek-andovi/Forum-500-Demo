"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PAGE_SIZES = [10, 20, 50, 100];

/** "1–20 of 135", page-size picker (page mode only) and prev/next. Hidden when the list is empty. */
export function Pagination({
  page,
  pageSize,
  total,
  showPageSize,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  showPageSize: boolean;
  onChange: (patch: { page: number; pageSize?: number }) => void;
}) {
  if (total <= 0) return null;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="flex flex-col gap-3 border-t px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        {showPageSize && (
          <Select value={String(pageSize)} onValueChange={(v) => onChange({ pageSize: Number(v), page: 1 })}>
            <SelectTrigger className="h-8 w-[110px] bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page <= 1}
          onClick={() => onChange({ page: page - 1 })}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span className="whitespace-nowrap tabular-nums text-muted-foreground">
          {page} / {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          disabled={page >= pageCount}
          onClick={() => onChange({ page: page + 1 })}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
