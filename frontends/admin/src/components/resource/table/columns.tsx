"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { humanize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AdminRecord, FieldMeta, ResourceMeta } from "@/lib/types";
import { CellValue } from "@/components/resource/cell";
import { RowActions } from "@/components/resource/table/row-actions";
import type { ListState, UpdateListState } from "@/components/resource/table/use-list-state";

/** Column definitions: one per `listColumns` entry (sortable header + CellValue), then row actions. */
export function useResourceColumns({
  resource,
  columnNames,
  fieldMap,
  sort,
  order,
  state,
  update,
  onChangeStatus,
  onDelete,
}: {
  resource: ResourceMeta;
  columnNames: string[];
  fieldMap: Map<string, FieldMeta>;
  sort: string | undefined;
  order: "asc" | "desc" | undefined;
  /** Only used as a memo dependency, so `update` is never stale. */
  state: ListState;
  update: UpdateListState;
  onChangeStatus: (row: AdminRecord, status: string) => void;
  onDelete: (row: AdminRecord) => void;
}) {
  return useMemo<ColumnDef<AdminRecord>[]>(() => {
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
        <RowActions
          resource={resource}
          row={row.original}
          onChangeStatus={(s) => onChangeStatus(row.original, s)}
          onDelete={() => onDelete(row.original)}
        />
      ),
    });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnNames.join(","), fieldMap, resource, sort, order, state]);
}
