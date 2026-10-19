"use client";

import { humanize } from "@/lib/format";
import type { FieldMeta } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FormValue } from "@/components/resource/field-codec";
import { AutoTextarea } from "@/components/resource/inputs/auto-textarea";
import { TagInput } from "@/components/resource/inputs/tag-input";
import { ImageInput } from "@/components/resource/inputs/image-input";
import { RelationSelect } from "@/components/resource/inputs/relation-select";

const NONE = "__none__";

export function FieldInput({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  invalid,
  relationLabel,
}: {
  field: FieldMeta;
  value: FormValue;
  onChange: (v: FormValue) => void;
  onBlur?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  relationLabel?: string | null;
}) {
  const id = `field-${field.name}`;
  const base = cn("bg-background", invalid && "border-destructive focus-visible:ring-destructive");

  switch (field.type) {
    case "text":
      return (
        <AutoTextarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={base}
        />
      );
    case "json":
      return (
        <AutoTextarea
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          minRows={4}
          spellCheck={false}
          placeholder="{ }"
          className={cn(base, "font-mono text-xs")}
        />
      );
    case "int":
    case "float":
      return (
        <Input
          id={id}
          type="number"
          step={field.type === "int" ? 1 : "any"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={base}
        />
      );
    case "boolean":
      return (
        <div className="flex h-9 items-center gap-3">
          <Switch
            id={id}
            checked={!!value}
            onCheckedChange={(c) => onChange(c)}
            disabled={disabled}
          />
          <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
        </div>
      );
    case "datetime":
      return (
        <Input
          id={id}
          type="datetime-local"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={base}
        />
      );
    case "enum":
      return (
        <Select
          value={value ? String(value) : NONE}
          onValueChange={(v) => onChange(v === NONE ? "" : v)}
          disabled={disabled}
        >
          <SelectTrigger id={id} className={base}>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {!field.required && (
              <SelectItem value={NONE}>
                <span className="text-muted-foreground">— None —</span>
              </SelectItem>
            )}
            {field.required && !value && (
              <SelectItem value={NONE} disabled>
                <span className="text-muted-foreground">Select…</span>
              </SelectItem>
            )}
            {(field.enumValues ?? []).map((v) => (
              <SelectItem key={v} value={v}>
                {humanize(v)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "string[]":
      return (
        <TagInput
          id={id}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
        />
      );
    case "image":
      return (
        <ImageInput
          id={id}
          value={String(value ?? "")}
          onChange={onChange}
          disabled={disabled}
          invalid={invalid}
        />
      );
    case "relation":
      return field.relation ? (
        <RelationSelect
          id={id}
          resource={field.relation.resource}
          value={String(value ?? "")}
          onChange={onChange}
          initialLabel={relationLabel}
          disabled={disabled}
          clearable={!field.required}
          invalid={invalid}
        />
      ) : (
        <Input
          id={id}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={base}
        />
      );
    case "url":
      return (
        <Input
          id={id}
          type="url"
          placeholder="https://…"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={base}
        />
      );
    default:
      return (
        <Input
          id={id}
          type={/password/i.test(field.name) ? "password" : "text"}
          autoComplete={/password/i.test(field.name) ? "new-password" : undefined}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={base}
        />
      );
  }
}
