"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { formatDateTime, humanize, stringify } from "@/lib/format";
import { usePageTitle } from "@/lib/use-debounce";
import { cn } from "@/lib/utils";
import { type AdminRecord, type FieldMeta, type ResourceMeta, recordId } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import {
  type FormValues,
  fromFormValue,
  isEmptyFormValue,
  isWideField,
  parsePrefill,
  toFormValue,
  validateField,
} from "@/components/resource/field-codec";
import { FieldInput } from "@/components/resource/field-input";
import {
  useDeleteMutation,
  useInvalidateResource,
  useRecord,
  useStatusMutation,
} from "@/components/resource/hooks";
import { ResourceExtras } from "@/components/resource/extras";
import { RelatedTabs } from "@/components/resource/related";

export function ResourceEditor({ resource, id }: { resource: ResourceMeta; id?: string }) {
  const isNew = !id;
  const record = useRecord(resource.name, id);
  const [version, setVersion] = useState(0);
  const invalidate = useInvalidateResource();
  const qc = useQueryClient();

  const title = isNew
    ? `New ${resource.singular.toLowerCase()}`
    : (record.data?._label ?? (record.data?.[resource.labelField] as string | undefined) ?? resource.singular);
  usePageTitle(isNew ? `New ${resource.singular}` : `${title} · ${resource.label}`);

  if (!isNew && record.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-72" />
        <Card>
          <CardContent className="grid gap-5 p-6 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isNew && record.error) {
    return (
      <div className="space-y-4">
        <BackLink resource={resource} />
        <ErrorState error={record.error} onRetry={() => record.refetch()} />
      </div>
    );
  }

  const onWorkflowChange = async () => {
    invalidate(resource.name);
    await qc.refetchQueries({ queryKey: ["record", resource.name, id] });
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-6">
      <EditorForm
        key={`${id ?? "new"}-${version}`}
        resource={resource}
        record={record.data}
        title={String(title)}
        extras={
          record.data ? (
            <ResourceExtras resource={resource} record={record.data} onChanged={onWorkflowChange} />
          ) : null
        }
      />
      {record.data && <RelatedTabs resource={resource} record={record.data} />}
    </div>
  );
}

function BackLink({ resource }: { resource: ResourceMeta }) {
  return (
    <Link
      href={`/r/${resource.name}`}
      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> {resource.label}
    </Link>
  );
}

function EditorForm({
  resource,
  record,
  title,
  extras,
}: {
  resource: ResourceMeta;
  record?: AdminRecord;
  title: string;
  extras: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = !record;
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : null;
  const invalidate = useInvalidateResource();
  const statusMutation = useStatusMutation(resource.name);
  const deleteMutation = useDeleteMutation(resource.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const readOnlyResource = !!resource.readOnly;

  // Editable fields; on edit the status lives in the header control instead.
  const editable = useMemo(
    () =>
      resource.fields
        .filter(
          (f) =>
            !f.hidden &&
            (!f.readOnly || (isNew && isNaturalKey(resource, f))) &&
            !(resource.hasStatus && !isNew && f.name === "status"),
        )
        .map((f) => (isNew && isNaturalKey(resource, f) ? { ...f, readOnly: false, required: true } : f)),
    [resource, isNew],
  );
  const infoFields = useMemo(
    () => resource.fields.filter((f) => !f.hidden && f.readOnly),
    [resource],
  );

  const prefill = useMemo(() => {
    const out: Record<string, unknown> = {};
    if (!isNew) return out;
    searchParams.forEach((v, k) => {
      if (!k.startsWith("prefill.")) return;
      const name = k.slice(8);
      const field = resource.fields.find((f) => f.name === name);
      if (field) out[name] = parsePrefill(field, v);
    });
    return out;
  }, [isNew, searchParams, resource.fields]);

  const defaultValues = useMemo(() => {
    const v: FormValues = {};
    for (const f of editable) {
      const raw = record ? record[f.name] : f.name in prefill ? prefill[f.name] : f.default;
      v[f.name] = toFormValue(f, raw);
    }
    return v;
    // computed once per mount (EditorForm is keyed by record id + version)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<FormValues>({ defaultValues, mode: "onTouched" });
  const { control, handleSubmit, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    const body: Record<string, unknown> = {};
    try {
      for (const f of editable) {
        const v = values[f.name];
        if (isNew) {
          // On create, only send what the admin provided so DB defaults apply.
          if (f.type === "boolean") {
            if (!formState.dirtyFields[f.name] && !(f.name in prefill)) continue;
          } else if (isEmptyFormValue(v)) continue;
        }
        body[f.name] = fromFormValue(f, v);
      }
    } catch (e) {
      toast.error(errorMessage(e));
      return;
    }
    try {
      if (isNew) {
        const created = await api<AdminRecord>(`/admin/r/${resource.name}`, {
          method: "POST",
          body,
        });
        toast.success(`${resource.singular} created`);
        invalidate(resource.name);
        router.replace(safeReturnTo ?? `/r/${resource.name}/${encodeURIComponent(recordId(created))}`);
      } else {
        await api<AdminRecord>(`/admin/r/${resource.name}/${encodeURIComponent(recordId(record))}`, {
          method: "PATCH",
          body,
        });
        toast.success(`${resource.singular} saved`);
        invalidate(resource.name);
        router.push(safeReturnTo ?? `/r/${resource.name}`);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  });

  const currentStatus = record?.status as string | undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* Header */}
      <div className="space-y-3">
        <Link
          href={safeReturnTo ?? `/r/${resource.name}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> {safeReturnTo ? "Back" : resource.label}
        </Link>
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
                  value={currentStatus ?? ""}
                  disabled={statusMutation.isPending || readOnlyResource}
                  onValueChange={(s) => statusMutation.mutate({ id: recordId(record), status: s })}
                >
                  <SelectTrigger className="h-9 w-44 bg-background">
                    <SelectValue placeholder="Status">
                      {currentStatus ? <StatusBadge value={currentStatus} /> : "Status"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {resource.statusEnum.map((s) => (
                      <SelectItem key={s} value={s}>
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
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 /> Delete
              </Button>
            )}
            {!readOnlyResource && (
              <Button type="submit" disabled={formState.isSubmitting}>
                {formState.isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                {isNew ? "Create" : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {extras}

      {/* Fields (audit entries are fully shown by their extras panel) */}
      {editable.length > 0 && resource.name !== "audit-logs" && (
        <Card>
          <CardContent className="grid gap-x-6 gap-y-5 p-5 sm:p-6 md:grid-cols-2">
            {editable.map((f) => (
              <Controller
                key={f.name}
                control={control}
                name={f.name}
                rules={{ validate: (v) => validateField(f, v) }}
                render={({ field, fieldState }) => (
                  <div className={cn("space-y-1.5", isWideField(f) && "md:col-span-2")}>
                    <Label htmlFor={`field-${f.name}`} className="flex items-center gap-1">
                      {f.label}
                      {f.required && f.type !== "boolean" && (
                        <span className="text-destructive" aria-hidden>
                          *
                        </span>
                      )}
                      {f.type === "json" && (
                        <span className="text-xs font-normal text-muted-foreground">(JSON)</span>
                      )}
                    </Label>
                    <FieldInput
                      field={f}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={readOnlyResource}
                      invalid={!!fieldState.error}
                      relationLabel={record?._relations?.[f.name] ?? null}
                    />
                    {fieldState.error && (
                      <p className="text-xs font-medium text-destructive">
                        {fieldState.error.message}
                      </p>
                    )}
                  </div>
                )}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Read-only info */}
      {!isNew && record && infoFields.length > 0 && resource.name !== "audit-logs" && (
        <Card className="bg-muted/30 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display font-medium">Record details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {infoFields.map((f) => (
                <div key={f.name} className="min-w-0">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="mt-0.5 break-words">
                    <InfoValue field={f} record={record} />
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {record && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Delete ${resource.singular.toLowerCase()}?`}
          description={
            <>
              <strong>{title}</strong> will be permanently deleted. This cannot be undone.
            </>
          }
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            await deleteMutation.mutateAsync(recordId(record));
            router.push(safeReturnTo ?? `/r/${resource.name}`);
          }}
        />
      )}
    </form>
  );
}

/** A user-supplied primary key such as Setting.key (no `id` field on the model). */
function isNaturalKey(resource: ResourceMeta, f: FieldMeta) {
  return f.name === "key" && f.readOnly && !resource.fields.some((x) => x.name === "id");
}

function InfoValue({ field, record }: { field: FieldMeta; record: AdminRecord }) {
  const v = record[field.name];
  if (v === null || v === undefined || v === "") return <span className="text-muted-foreground">—</span>;
  if (field.type === "relation") {
    const label = record._relations?.[field.name] ?? String(v);
    return field.relation ? (
      <Link href={`/r/${field.relation.resource}/${v}`} className="text-primary hover:underline">
        {label}
      </Link>
    ) : (
      <span>{label}</span>
    );
  }
  if (field.type === "datetime") return <span>{formatDateTime(v)}</span>;
  if (field.type === "boolean") return <span>{v ? "Yes" : "No"}</span>;
  if (field.type === "enum") return <StatusBadge value={String(v)} />;
  if (field.type === "json")
    return (
      <pre className="max-h-48 overflow-auto rounded bg-background p-2 font-mono text-xs">
        {JSON.stringify(v, null, 2)}
      </pre>
    );
  return <span className={field.name === "id" ? "font-mono text-xs" : undefined}>{stringify(v)}</span>;
}
