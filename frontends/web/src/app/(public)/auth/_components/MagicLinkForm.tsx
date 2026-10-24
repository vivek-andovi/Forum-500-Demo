"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { errorMessage } from "@/lib/api";
import { useRequestMagicLink } from "@/features/auth/queries";
import { FormField } from "@/components/form";

/** Secondary sign-in: email a one-click link instead of typing a password. */
export function MagicLinkForm({ initialEmail }: { initialEmail: string }) {
  const request = useRequestMagicLink();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setEmail(initialEmail);
          setOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
      >
        <Mail className="h-4 w-4" /> Email me a sign-in link
      </button>
    );
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    request.mutate(
      { email },
      {
        onSuccess: (res) => setSent(res.message),
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      {sent ? (
        <p className="text-sm">{sent}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField
            label="Email"
            id="magic-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          >
            <p className="mt-1.5 text-xs text-muted-foreground">We&apos;ll email you a link that signs you in — no password needed.</p>
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={request.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
          >
            <Mail className="h-4 w-4" /> {request.isPending ? "Sending…" : "Send link"}
          </button>
        </form>
      )}
    </div>
  );
}
