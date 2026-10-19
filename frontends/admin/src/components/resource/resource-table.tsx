"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { humanize } from "@/lib/format";
import { useDebounce } from "@/lib/use-debounce";
import { cn } from "@/lib/utils";
import { type AdminRecord, type FieldMeta, type ListResponse, type ResourceMeta, recordId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CellValue } from "@/components/resource/cell";
import { useDeleteMutation, useOptionLabels, useStatusMutation } from "@/components/resource/hooks";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";

type ListState = {
  page: number;
  pageSize: number;
  sort?: string;
  order?: "asc" | "desc";
  search: string;
  status?: string;
  filters: Record<string, string>;
};

const ALL = "__all__";
const PAGE_SIZES = [10, 20, 50, 100];

/** List state stored in the URL (page mode) or in component state (embedded mode). */
function useListState(syncUrl: boolean, defaultPageSize: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [local, setLocal] = useState<ListState>({
    page: 1,
    pageSize: defaultPageSize,
    search: "",
    filters: {},
  });

  const fromUrl = useMemo<ListState>(() => {
    const filters: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      if (k.startsWith("filter.")) filters[k.slice(7)] = v;
    });
    const order = searchParams.get("order");
    return {
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      pageSize: Number(searchParams.get("pageSize")) || defaultPageSize,
      sort: searchParams.get("sort") || undefined,
      order: order === "asc" || order === "desc" ? order : undefined,
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || undefined,
      filters,
    };
  }, [searchParams, defaultPageSize]);

  const state = syncUrl ? fromUrl : local;

  const update = (patch: Partial<ListState>) => {
    const next = { ...state, ...patch };
    if (!syncUrl) {
      setLocal(next);
      return;
    }
    const sp = new URLSearchParams();
    if (next.page > 1) sp.set("page", String(next.page));
    if (next.pageSize !== defaultPageSize) sp.set("pageSize", String(next.pageSize));
    if (next.sort) sp.set("sort", next.sort);
    if (next.sort && next.order) sp.set("order", next.order);
    if (next.search) sp.set("search", next.search);
    if (next.status) sp.set("status", next.status);
    for (const [k, v] of Object.entries(next.filters)) sp.set(`filter.${k}`, v);
    const qs = sp.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  return [state, update] as const;
}

function FilterChip({
  field,
  value,
  onRemove,
}: {
  field?: FieldMeta;
  name: string;
  value: string;
  onRemove: () => void;
}) {
  const labels = useOptionLabels(
    field?.type === "relation" ? field.relation?.resource : undefined,
    field?.type === "relation" ? [value] : [],
  );
  const display =
    (value === "null" ? "None" : undefined) ??
    labels.data?.find((o) => o.id === value)?.label ??
    (field?.type === "enum" ? humanize(value) : value);
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border bg-card py-1 pl-3 pr-1 text-xs">
      <span className="text-muted-foreground">{field?.label ?? humanize(field?.name ?? "")}:</span>
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

export function ResourceTable({
  resource,
  mode = "page",
  fixedFilter,
}: {
  resource: ResourceMeta;
  mode?: "page" | "embedded";
  /** Always applied, not removable (embedded related lists). */
  fixedFilter?: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const embedded = mode === "embedded";
  const [state, update] = useListState(!embedded, embedded ? 10 : 20);
  const [searchInput, setSearchInput] = useState(state.search);
  const debouncedSearch = useDebounce(searchInput, 350);
  const [toDelete, setToDelete] = useState<AdminRecord | null>(null);
  const statusMutation = useStatusMutation(resource.name);
  const deleteMutation = useDeleteMutation(resource.name);

  useEffect(() => {
    if (debouncedSearch !== state.search) update({ search: debouncedSearch, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    // keep the input in sync when the URL changes externally
    setSearchInput((s) => (s === state.search ? s : state.search));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.search]);

  const fieldMap = useMemo(
    () => new Map(resource.fields.map((f) => [f.name, f] as const)),
    [resource.fields],
  );

  const sort = state.sort ?? resource.defaultSort?.field;
  const order = state.sort ? (state.order ?? "asc") : resource.defaultSort?.order;

  const query: Record<string, string | number | undefined> = {
    page: state.page,
    pageSize: state.pageSize,
    search: state.search || undefined,
    sort,
    order,
    status: state.status,
  };
  for (const [k, v] of Object.entries({ ...state.filters, ...(fixedFilter ?? {}) })) {
    query[`filter.${k}`] = v;
  }

  const list = useQuery({
    queryKey: ["list", resource.name, query],
    queryFn: () => api<ListResponse>(`/admin/r/${resource.name}`, { query }),
    placeholderData: keepPreviousData,
  });

  const hiddenCols = new Set(Object.keys(fixedFilter ?? {}));
  const columnNames = (resource.listColumns?.length ? resource.listColumns : ["_label"]).filter(
    (c) => !hiddenCols.has(c),
  );

  const newHref = useMemo(() => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...state.filters, ...(fixedFilter ?? {}) })) {
      sp.set(`prefill.${k}`, v);
    }
    if (embedded) sp.set("returnTo", pathname);
    const qs = sp.toString();
    return `/r/${resource.name}/new${qs ? `?${qs}` : ""}`;
  }, [resource.name, state.filters, fixedFilter, embedded, pathname]);

  const columns = useMemo<ColumnDef<AdminRecord>[]>(() => {
    const cols: ColumnDef<AdminRecord>[] = columnNames.map((name) => {
      const field = fieldMap.get(name);
      const sortable =
        !!field && !["json", "string[]", "relation"].includes(field.type) && name !== "_label";
      return {
        id: name,
        header: () => {
          const label = field?.label ?? (name === "_label" ? resource.singular : humanize(name));
          if (!sortable) return <span>{label}</span>;
          const active = sort === name;
          const Icon = !active ? ArrowUpDown : order === "desc" ? ArrowDown : ArrowUp;
          return (
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap hover:text-foreground",
                active && "text-foreground",
              )}
              onClick={() =>
                update({
                  sort: name,
                  order: active && order === "asc" ? "desc" : "asc",
                  page: 1,
                })
              }
            >
              {label}
              <Icon className={cn("size-3", !active && "opacity-40")} />
            </button>
          );
        },
        cell: ({ row }) => (
          <CellValue
            row={row.original}
            field={field}
            name={name}
            isLabel={name === resource.labelField}
          />
        ),
      };
    });
    cols.push({
      id: "__actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/r/${resource.name}/${recordId(row.original)}`}>
                  <Pencil className="size-4" /> {resource.readOnly ? "View" : "Edit"}
                </Link>
              </DropdownMenuItem>
              {resource.hasStatus && !resource.readOnly && !!resource.statusEnum?.length && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RefreshCw className="mr-2 size-4" /> Change status
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {resource.statusEnum.map((s) => (
                      <DropdownMenuItem
                        key={s}
                        disabled={row.original.status === s}
                        onClick={() => statusMutation.mutate({ id: recordId(row.original), status: s })}
                      >
                        <StatusBadge value={s} />
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
              {!resource.readOnly && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setToDelete(row.original)}
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnNames.join(","), fieldMap, resource, sort, order, state]);

  const rows = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / state.pageSize));

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount,
    getRowId: (r, i) => recordId(r) || String(i),
  });

  const filterEntries = Object.entries(state.filters);
  const from = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
  const to = Math.min(total, state.page * state.pageSize);

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", embedded && "shadow-none")}>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={
              resource.searchFields?.length
                ? `Search ${resource.searchFields.map((f) => fieldMap.get(f)?.label ?? f).join(", ").toLowerCase()}…`
                : "Search…"
            }
            className="h-9 bg-background pl-8"
          />
        </div>
        {resource.hasStatus && !!resource.statusEnum?.length && (
          <Select
            value={state.status ?? ALL}
            onValueChange={(v) => update({ status: v === ALL ? undefined : v, page: 1 })}
          >
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
          {list.isFetching && !list.isLoading && (
            <RefreshCw className="size-4 animate-spin text-muted-foreground" />
          )}
          {!resource.readOnly && (
            <Button asChild size="sm">
              <Link href={newHref}>
                <Plus /> New {embedded ? "" : resource.singular.toLowerCase()}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!embedded && filterEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
          {filterEntries.map(([k, v]) => (
            <FilterChip
              key={k}
              name={k}
              field={fieldMap.get(k) ?? { name: k, label: humanize(k), type: "string", required: false, readOnly: false, hidden: false }}
              value={v}
              onRemove={() => {
                const next = { ...state.filters };
                delete next[k];
                update({ filters: next, page: 1 });
              }}
            />
          ))}
          {filterEntries.length > 1 && (
            <button
              type="button"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              onClick={() => update({ filters: {}, page: 1 })}
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {list.error && !list.data ? (
        <div className="p-4">
          <ErrorState error={list.error} onRetry={() => list.refetch()} />
        </div>
      ) : (
        <div className={cn("overflow-x-auto", list.isFetching && list.data && "opacity-70")}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent">
                  {hg.headers.map((h) => (
                    <TableHead
                      key={h.id}
                      className="h-10 whitespace-nowrap text-xs font-semibold uppercase tracking-wide"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {list.isLoading &&
                Array.from({ length: Math.min(state.pageSize, 8) }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((c, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full max-w-40" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {!list.isLoading &&
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/r/${resource.name}/${recordId(row.original)}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="max-w-xs py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          {!list.isLoading && rows.length === 0 && (
            <EmptyState
              title={`No ${resource.label.toLowerCase()} found`}
              description={
                state.search || state.status || filterEntries.length
                  ? "Try adjusting your search or filters."
                  : undefined
              }
              className={embedded ? "py-8" : undefined}
            />
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col gap-3 border-t px-3 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            {from}–{to} of {total}
          </p>
          <div className="flex items-center gap-2">
            {!embedded && (
              <Select
                value={String(state.pageSize)}
                onValueChange={(v) => update({ pageSize: Number(v), page: 1 })}
              >
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
              disabled={state.page <= 1}
              onClick={() => update({ page: state.page - 1 })}
              aria-label="Previous page"
            >
              <ChevronLeft />
            </Button>
            <span className="whitespace-nowrap tabular-nums text-muted-foreground">
              {state.page} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={state.page >= pageCount}
              onClick={() => update({ page: state.page + 1 })}
              aria-label="Next page"
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete ${resource.singular.toLowerCase()}?`}
        description={
          <>
            <strong>{toDelete?._label ?? (toDelete ? recordId(toDelete) : "")}</strong> will be permanently deleted. This
            cannot be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (toDelete) await deleteMutation.mutateAsync(recordId(toDelete));
        }}
      />
    </div>
  );
}
