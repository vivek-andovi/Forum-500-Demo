"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { humanize } from "@/lib/format";
import { isWorkflowStatus, resourceHref } from "@/lib/meta";
import type { ResourceMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";

/** "← Members" (or "← Back" when the editor was opened with ?returnTo=). */
export function BackLink({ resource, returnTo }: { resource: ResourceMeta; returnTo?: string | null }) {
  return (
    <Link
      href={returnTo ?? resourceHref(resource.name)}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {returnTo ? "Back" : resource.label}
    </Link>
  );
}

/** Back link, title, and the status / delete / save controls. */
export function EditorHeader({
  resource,
  title,
  isNew,
  returnTo,
  status,
  statusPending,
  onStatusChange,
  onDelete,
  submitting,
  canSave,
}: {
  resource: ResourceMeta;
  title: string;
  isNew: boolean;
  returnTo: string | null;
  status: string | undefined;
  statusPending: boolean;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  submitting: boolean;
  /** False when the form has no editable fields (e.g. workflow-only resources). */
  canSave: boolean;
}) {
  const readOnlyResource = !!resource.readOnly;
  return (
    <div className="space-y-3">
      <BackLink resource={resource} returnTo={returnTo} />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="eyebrow mb-1.5">{isNew ? "Create" : resource.singular}</div>
          <h1 className="truncate text-3xl">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isNew && resource.hasStatus && !!resource.statusEnum?.length && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <Select
                value={status ?? ""}
                disabled={statusPending || readOnlyResource || isWorkflowStatus(resource, status)}
                onValueChange={onStatusChange}
              >
                <SelectTrigger className="h-9 w-44 bg-background">
                  <SelectValue placeholder="Status">
                    {status ? <StatusBadge value={status} /> : "Status"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {resource.statusEnum.map((s) => (
                    <SelectItem key={s} value={s} disabled={isWorkflowStatus(resource, s)}>
                      {humanize(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isNew && !readOnlyResource && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 /> Delete
            </Button>
          )}
          {!readOnlyResource && canSave && (
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" /> : <Save />}
              {isNew ? "Create" : "Save"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
