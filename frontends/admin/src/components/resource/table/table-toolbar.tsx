"use client";

import Link from "next/link";
import { Plus, RefreshCw, Search } from "lucide-react";
import { humanize } from "@/lib/format";
import type { FieldMeta, ResourceMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ALL = "__all__";

/** Search box, status filter, fetching spinner and the "New" button. */
export function TableToolbar({
  resource,
  fieldMap,
  search,
  onSearchChange,
  status,
  onStatusChange,
  fetching,
  newHref,
  embedded,
}: {
  resource: ResourceMeta;
  fieldMap: Map<string, FieldMeta>;
  search: string;
  onSearchChange: (value: string) => void;
  status: string | undefined;
  onStatusChange: (status: string | undefined) => void;
  fetching: boolean;
  newHref: string;
  embedded: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={
            resource.searchFields?.length
              ? `Search ${resource.searchFields.map((f) => fieldMap.get(f)?.label ?? f).join(", ").toLowerCase()}…`
              : "Search…"
          }
          className="h-9 bg-background pl-8"
        />
      </div>
      {resource.hasStatus && !!resource.statusEnum?.length && (
        <Select value={status ?? ALL} onValueChange={(v) => onStatusChange(v === ALL ? undefined : v)}>
          <SelectTrigger className="h-9 bg-background sm:w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {resource.statusEnum.map((s) => (
              <SelectItem key={s} value={s}>
                {humanize(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <div className="flex items-center gap-2 sm:ml-auto">
        {fetching && <RefreshCw className="size-4 animate-spin text-muted-foreground" />}
        {!resource.readOnly && (
          <Button asChild size="sm">
            <Link href={newHref}>
              <Plus /> New {embedded ? "" : resource.singular.toLowerCase()}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
