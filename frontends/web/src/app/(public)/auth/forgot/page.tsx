"use client";

import { useState } from "react";
import Link from "next/link";
import { api, errorMessage } from "@/lib/api";
import { AuthCard } from "@/components/AuthCard";
import { FormField, primaryButtonClass } from "@/components/form";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/auth/forgot-password", { method: "POST", body: { email }, auth: false });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Account"
      title="Reset your password"
      intro="Enter the email you use for Forum500 and we'll send you a link to choose a new password."
      footer={<Link href="/auth" className="font-semibold text-accent hover:underline">Back to sign in</Link>}
    >
      {sent ? (
        <p className="text-sm">
          If that email belongs to a Forum500 account, a reset link is on its way. It expires in one hour.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="Email" id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthCard>
  );
}
