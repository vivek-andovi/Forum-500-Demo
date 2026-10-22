"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api";
import { usePageTitle } from "@/lib/use-page-title";
import { recordHref, resourceHref } from "@/lib/meta";
import { queryKeys, useRecord } from "@/lib/queries";
import { resourceConfig } from "@/lib/resource-registry";
import { cn, safePath } from "@/lib/utils";
import { type AdminRecord, type ResourceMeta, recordId } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ErrorState } from "@/components/common/empty-state";
import { isWideField, validateField } from "@/components/resource/field-codec";
import { FieldInput } from "@/components/resource/field-input";
import { useDeleteMutation, useInvalidateResource, useStatusMutation } from "@/components/resource/hooks";
import { ResourceExtras } from "@/components/resource/extras";
import { RelatedTabs } from "@/components/resource/related";
import { BackLink, EditorHeader } from "@/components/resource/editor/editor-header";
import { RecordDetails } from "@/components/resource/editor/record-details";
import { useEditorModel } from "@/components/resource/editor/use-editor-model";

/** Create (no `id`) or edit page for any resource: header, workflow panel, fields, details, related tabs. */
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

  if (!isNew && record.isLoading) return <EditorSkeleton />;

  if (!isNew && record.error) {
    return (
      <div className="space-y-4">
        <BackLink resource={resource} />
        <ErrorState error={record.error} onRetry={() => record.refetch()} />
      </div>
    );
  }

  // After a workflow action: reload the record, then re-key the form so it starts from the new values.
  const onWorkflowChange = async () => {
    invalidate(resource.name);
    await qc.refetchQueries({ queryKey: queryKeys.record(resource.name, id) });
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
  const safeReturnTo = safePath(searchParams.get("returnTo"));
  const listHref = safeReturnTo ?? resourceHref(resource.name);
  const invalidate = useInvalidateResource();
  const statusMutation = useStatusMutation(resource.name);
  const deleteMutation = useDeleteMutation(resource.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const readOnlyResource = !!resource.readOnly;
  const { hideForm } = resourceConfig(resource.name);

  const isNew = !record;
  const { editable, infoFields, form, buildBody } = useEditorModel(resource, record);
  const { control, handleSubmit, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    let body: Record<string, unknown>;
    try {
      body = buildBody(values);
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
        router.replace(safeReturnTo ?? recordHref(resource.name, recordId(created)));
      } else if (Object.keys(body).length === 0) {
        router.push(listHref);
      } else {
        await api<AdminRecord>(`/admin/r/${resource.name}/${encodeURIComponent(recordId(record))}`, {
          method: "PATCH",
          body,
        });
        toast.success(`${resource.singular} saved`);
        invalidate(resource.name);
        router.push(listHref);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <EditorHeader
        resource={resource}
        title={title}
        isNew={isNew}
        returnTo={safeReturnTo}
        status={record?.status as string | undefined}
        statusPending={statusMutation.isPending}
        onStatusChange={(s) => statusMutation.mutate({ id: recordId(record!), status: s })}
        onDelete={() => setConfirmDelete(true)}
        submitting={formState.isSubmitting}
        canSave={editable.length > 0 && !hideForm}
      />

      {extras}

      {editable.length > 0 && !hideForm && (
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

      {!isNew && record && infoFields.length > 0 && !hideForm && (
        <RecordDetails fields={infoFields} record={record} />
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
            router.push(listHref);
          }}
        />
      )}
    </form>
  );
}

function EditorSkeleton() {
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
