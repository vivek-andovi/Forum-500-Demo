"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { isWorkflowStatus, recordHref } from "@/lib/meta";
import { type AdminRecord, type ResourceMeta, recordId } from "@/lib/types";
import { Button } from "@/components/ui/button";
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
import { StatusBadge } from "@/components/common/status-badge";

/** The "…" menu at the end of each row: edit/view, change status, delete. */
export function RowActions({
  resource,
  row,
  onChangeStatus,
  onDelete,
}: {
  resource: ResourceMeta;
  row: AdminRecord;
  onChangeStatus: (status: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Row actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={recordHref(resource.name, recordId(row))}>
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
                    disabled={
                      row.status === s ||
                      isWorkflowStatus(resource, s) ||
                      isWorkflowStatus(resource, row.status as string)
                    }
                    onClick={() => onChangeStatus(s)}
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
              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
