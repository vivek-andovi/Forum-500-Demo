"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { recordHref } from "@/lib/meta";
import { useList } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { type AdminRecord, type ResourceMeta, recordId } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState, ErrorState } from "@/components/common/empty-state";
import { useDeleteMutation, useStatusMutation } from "@/components/resource/hooks";
import { buildListQuery, useListState, useSearchInput } from "@/components/resource/table/use-list-state";
import { useResourceColumns } from "@/components/resource/table/columns";
import { TableToolbar } from "@/components/resource/table/table-toolbar";
import { FilterChips } from "@/components/resource/table/filter-chips";
import { Pagination } from "@/components/resource/table/pagination";

/**
 * Generic list for any resource. In "page" mode the list state lives in the URL;
 * in "embedded" mode (related tabs) it is local and `fixedFilter` is always applied.
 */
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
  const [searchInput, setSearchInput] = useSearchInput(state, update);
  const [toDelete, setToDelete] = useState<AdminRecord | null>(null);
  const statusMutation = useStatusMutation(resource.name);
  const deleteMutation = useDeleteMutation(resource.name);

  const fieldMap = useMemo(
    () => new Map(resource.fields.map((f) => [f.name, f] as const)),
    [resource.fields],
  );

  const { query, sort, order } = buildListQuery(resource, state, fixedFilter);
  const list = useList(resource.name, query);

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

  const columns = useResourceColumns({
    resource,
    columnNames,
    fieldMap,
    sort,
    order,
    state,
    update,
    onChangeStatus: (row, status) => statusMutation.mutate({ id: recordId(row), status }),
    onDelete: setToDelete,
  });

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

  const hasFilters = Object.keys(state.filters).length > 0;

  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", embedded && "shadow-none")}>
      <TableToolbar
        resource={resource}
        fieldMap={fieldMap}
        search={searchInput}
        onSearchChange={setSearchInput}
        status={state.status}
        onStatusChange={(status) => update({ status, page: 1 })}
        fetching={list.isFetching && !list.isLoading}
        newHref={newHref}
        embedded={embedded}
      />

      {!embedded && (
        <FilterChips
          filters={state.filters}
          fieldMap={fieldMap}
          onChange={(filters) => update({ filters, page: 1 })}
        />
      )}

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
                    {columns.map((_, j) => (
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
                    onClick={() => router.push(recordHref(resource.name, recordId(row.original)))}
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
                state.search || state.status || hasFilters
                  ? "Try adjusting your search or filters."
                  : undefined
              }
              className={embedded ? "py-8" : undefined}
            />
          )}
        </div>
      )}

      <Pagination
        page={state.page}
        pageSize={state.pageSize}
        total={total}
        showPageSize={!embedded}
        onChange={update}
      />

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
