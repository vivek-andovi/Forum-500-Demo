"use client";

import { useState, type KeyboardEvent } from "react";
import { Loader2, Send } from "lucide-react";

const MAX_LEN = 4000;

/** Message composer: Enter sends, Shift+Enter inserts a newline, max 4000 chars. */
export function ChatComposer({
  onSend,
  busy,
  placeholder,
  autoFocus,
}: {
  onSend: (body: string) => Promise<unknown>;
  busy?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const body = text.trim();

  async function submit() {
    if (!body || busy) return;
    try {
      await onSend(body.slice(0, MAX_LEN));
      setText("");
    } catch {
      /* errors are toasted globally */
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="flex items-end gap-2 border-t border-border px-4 py-3"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        maxLength={MAX_LEN}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label="Write a message"
        className="max-h-40 min-h-[42px] flex-1 resize-none rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={!body || busy}
        className="flex h-[42px] items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
      </button>
    </form>
  );
}
