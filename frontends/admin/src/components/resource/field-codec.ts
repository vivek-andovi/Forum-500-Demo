import type { FieldMeta } from "@/lib/types";
import { isoToLocalInput, localInputToIso } from "@/lib/format";

export type FormValue = string | boolean | string[];
export type FormValues = Record<string, FormValue>;

/** API value -> form control value */
export function toFormValue(field: FieldMeta, raw: unknown): FormValue {
  switch (field.type) {
    case "boolean":
      return raw === true || raw === "true";
    case "int":
    case "float":
      return raw === null || raw === undefined ? "" : String(raw);
    case "datetime":
      return isoToLocalInput(raw);
    case "string[]":
      return Array.isArray(raw) ? raw.map(String) : [];
    case "json":
      if (raw === null || raw === undefined) return "";
      return typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    default:
      return raw === null || raw === undefined ? "" : String(raw);
  }
}

/** Raw query-string prefill (?prefill.field=value) -> API-ish value */
export function parsePrefill(field: FieldMeta, raw: string): unknown {
  switch (field.type) {
    case "boolean":
      return raw === "true" || raw === "1";
    case "string[]":
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    case "json":
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    default:
      return raw;
  }
}

/** Form control value -> API payload value */
export function fromFormValue(field: FieldMeta, v: FormValue): unknown {
  switch (field.type) {
    case "boolean":
      return !!v;
    case "int": {
      if (v === "" || v === undefined) return null;
      const n = parseInt(String(v), 10);
      return Number.isNaN(n) ? null : n;
    }
    case "float": {
      if (v === "" || v === undefined) return null;
      const n = parseFloat(String(v));
      return Number.isNaN(n) ? null : n;
    }
    case "datetime":
      return localInputToIso(String(v ?? ""));
    case "string[]":
      return Array.isArray(v) ? v : [];
    case "json": {
      const s = String(v ?? "").trim();
      return s ? JSON.parse(s) : null;
    }
    default: {
      const s = String(v ?? "");
      return s === "" ? null : s;
    }
  }
}

export function isEmptyFormValue(v: FormValue | undefined): boolean {
  return v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

export function validateField(field: FieldMeta, v: FormValue): true | string {
  if (field.required && field.type !== "boolean" && isEmptyFormValue(v)) {
    return `${field.label} is required`;
  }
  if (isEmptyFormValue(v)) return true;
  if (field.type === "json") {
    try {
      JSON.parse(String(v));
    } catch {
      return "Invalid JSON";
    }
  }
  if (field.type === "int" && !/^-?\d+$/.test(String(v).trim())) return "Must be a whole number";
  if (field.type === "float" && Number.isNaN(Number(v))) return "Must be a number";
  if ((field.type === "url" || field.type === "image") && !/^(https?:\/\/|\/)/i.test(String(v))) {
    return "Must be a URL (https://…)";
  }
  return true;
}

/** Whether a field takes the full width of the form grid. */
export function isWideField(field: FieldMeta) {
  return ["text", "json", "string[]", "image"].includes(field.type);
}
