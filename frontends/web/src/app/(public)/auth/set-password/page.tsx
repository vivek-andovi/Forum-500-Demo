"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api, errorMessage, setToken } from "@/lib/api";
import { qk } from "@/lib/queries";
import type { LoginResponse } from "@/lib/types";
import { AuthCard, inputClass, passwordProblems, primaryButtonClass } from "@/components/AuthCard";

function SetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const token = params.get("token") ?? "";
  const isReset = params.get("reset") === "1";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const problems = passwordProblems(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (problems.length) return setError(`Password needs ${problems.join(", ")}.`);
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    setError(null);
    try {
      const res = await api<LoginResponse>("/auth/set-password", { method: "POST", body: { token, password }, auth: false });
      qc.clear();
      qc.setQueryData(qk.me, { user: res.user, member: res.member, pendingRevision: null });
      setToken(res.accessToken);
      // New members land on their profile to complete it; resets go to the dashboard.
      router.push(isReset ? "/dashboard" : "/membership/profile");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <AuthCard eyebrow="Account" title="Link missing" footer={<Link href="/auth/forgot" className="font-semibold text-accent hover:underline">Request a new link</Link>}>
        <p className="text-sm">This page needs the link from your email. Please open it again, or request a new one.</p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      eyebrow={isReset ? "Password reset" : "Welcome to Forum500"}
      title={isReset ? "Choose a new password" : "Set your password"}
      intro={isReset ? "You'll be signed out on your other devices." : "Create a password to activate your membership account."}
      footer={<Link href="/auth" className="font-semibold text-accent hover:underline">Back to sign in</Link>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium" htmlFor="password">New password</label>
          <input id="password" type="password" required autoComplete="new-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          <p className={`mt-1.5 text-xs ${password && problems.length ? "text-destructive" : "text-muted-foreground"}`}>
            At least 10 characters, with a letter and a number.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="confirm">Confirm password</label>
          <input id="confirm" type="password" required autoComplete="new-password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} className={inputClass} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? "Saving…" : isReset ? "Update password" : "Activate account"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}
