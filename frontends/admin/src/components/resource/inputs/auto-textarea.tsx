"use client";

import { forwardRef, useCallback, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"textarea"> & { minRows?: number };

export const AutoTextarea = forwardRef<HTMLTextAreaElement, Props>(function AutoTextarea(
  { className, value, minRows = 3, onChange, ...props },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement | null>(null);
  const resize = useCallback(() => {
    const el = inner.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, []);
  useEffect(resize, [value, resize]);

  return (
    <Textarea
      {...props}
      rows={minRows}
      value={value}
      onChange={(e) => {
        onChange?.(e);
        resize();
      }}
      ref={(el) => {
        inner.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
      }}
      className={cn("resize-none overflow-hidden bg-background leading-relaxed", className)}
    />
  );
});
