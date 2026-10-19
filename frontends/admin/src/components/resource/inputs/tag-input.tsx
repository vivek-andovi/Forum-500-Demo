"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function TagInput({
  value,
  onChange,
  disabled,
  placeholder = "Type and press Enter",
  id,
  invalid,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const tags = value ?? [];

  const add = (raw: string) => {
    const parts = raw
      .split(/\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!parts.length) return;
    onChange([...tags, ...parts]);
    setDraft("");
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-sm focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50",
        invalid && "border-destructive",
      )}
    >
      {tags.map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
        >
          <span className="truncate">{t}</span>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange(tags.filter((_, j) => j !== i))}
              className="rounded-sm opacity-60 hover:opacity-100"
              aria-label={`Remove ${t}`}
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      <input
        id={id}
        value={draft}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && tags.length) {
            onChange(tags.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
