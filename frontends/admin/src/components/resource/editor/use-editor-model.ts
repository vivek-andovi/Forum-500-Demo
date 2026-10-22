"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { AdminRecord, ResourceMeta } from "@/lib/types";
import {
  type FormValues,
  fromFormValue,
  isEmptyFormValue,
  parsePrefill,
  toFormValue,
} from "@/components/resource/field-codec";

/**
 * Everything the editor form needs that is not UI:
 * - `editable`: fields shown as inputs (on edit, status lives in the header instead;
 *   on create, a natural key becomes a required input)
 * - `infoFields`: read-only fields shown under "Record details"
 * - the react-hook-form instance, seeded from the record, `?prefill.<field>=` or DB defaults
 * - `buildBody(values)`: the POST/PATCH body (throws on invalid input, e.g. bad JSON)
 *
 * Default values are computed once per mount; the editor re-keys the form to reset it.
 */
export function useEditorModel(resource: ResourceMeta, record: AdminRecord | undefined) {
  const searchParams = useSearchParams();
  const isNew = !record;

  const editable = useMemo(
    () =>
      resource.fields
        .filter(
          (f) =>
            !f.hidden &&
            (!f.readOnly || (isNew && f.createOnly)) &&
            !(resource.hasStatus && !isNew && f.name === "status"),
        )
        .map((f) => (isNew && f.createOnly ? { ...f, readOnly: false, required: true } : f)),
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
    // computed once per mount (the form is keyed by record id + version)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const form = useForm<FormValues>({ defaultValues, mode: "onTouched" });

  const buildBody = (values: FormValues) => {
    const body: Record<string, unknown> = {};
    for (const f of editable) {
      const v = values[f.name];
      if (isNew) {
        // On create, only send what the admin provided so DB defaults apply.
        if (f.type === "boolean") {
          if (!form.formState.dirtyFields[f.name] && !(f.name in prefill)) continue;
        } else if (isEmptyFormValue(v)) continue;
      } else if (!form.getFieldState(f.name).isDirty) {
        // On edit, only send changed fields so values the server set meanwhile
        // (status change → publishedAt, other admins' edits) are not overwritten.
        continue;
      }
      body[f.name] = fromFormValue(f, v);
    }
    return body;
  };

  return { editable, infoFields, form, buildBody };
}
