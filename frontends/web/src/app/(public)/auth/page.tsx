"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { setToken, errorMessage } from "@/lib/api";
import { qk, useLogin } from "@/lib/queries";
import { useToken } from "@/hooks/useAuth";

export default function AuthPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const token = useToken();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) router.replace("/dashboard");
  }, [token, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    login.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          // Admins are allowed too — they simply have no member profile.
          qc.clear();
          qc.setQueryData(qk.me, { user: res.user, member: res.member, pendingRevision: null });
          setToken(res.accessToken);
          router.push("/dashboard");
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  }

  const busy = login.isPending;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <p className="eyebrow">Members only</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in for the directory, events and the full In:Forum edition.
          </p>
        </div>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-lg border border-border bg-card p-6">
          <div>
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <Link href="/auth/forgot" className="text-xs font-semibold text-accent hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy ? "One moment…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Interested in joining?{" "}
          <Link href="/apply" className="font-semibold text-accent hover:underline">
            Apply for membership
          </Link>
        </p>
      </div>
    </div>
  );
}
