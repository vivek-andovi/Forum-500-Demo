"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage, setToken } from "@/lib/api";
import { useSignOut } from "@/hooks/useAuth";
import { FormField } from "@/components/form";
import { passwordProblems } from "@/features/auth/password";
import { Button } from "@/components/ui/button";

/** Change password + sign out of every device. */
export function SecuritySettings() {
  const signOut = useSignOut();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState<"pw" | "out" | null>(null);
  const problems = passwordProblems(next);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (problems.length) return toast.error(`New password needs ${problems.join(", ")}.`);
    setBusy("pw");
    try {
      const res = await api<{ accessToken: string }>("/auth/change-password", {
        method: "POST",
        body: { currentPassword: current, newPassword: next },
      });
      setToken(res.accessToken);
      setCurrent("");
      setNext("");
      toast.success("Password updated. Your other devices have been signed out.");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function signOutEverywhere() {
    setBusy("out");
    try {
      await api("/auth/logout-all", { method: "POST" });
    } catch {
      /* token is cleared either way */
    }
    signOut("/auth");
  }

  return (
    <section className="mt-10 max-w-2xl space-y-6 rounded-lg border border-border bg-card p-6">
      <div>
        <h2 className="font-display text-xl font-semibold">Security</h2>
        <p className="mt-1 text-sm text-muted-foreground">Change your password or sign out of every device.</p>
      </div>
      <form onSubmit={changePassword} className="grid gap-4 sm:grid-cols-2">
        <FormField label="Current password" id="current-password" type="password" autoComplete="current-password"
          required value={current} onChange={(e) => setCurrent(e.target.value)} />
        <FormField label="New password" id="new-password" type="password" autoComplete="new-password" required
          value={next} onChange={(e) => setNext(e.target.value)}>
          <p className={`mt-1.5 text-xs ${next && problems.length ? "text-destructive" : "text-muted-foreground"}`}>
            10+ characters with a letter and a number.
          </p>
        </FormField>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy !== null}>{busy === "pw" ? "Updating…" : "Update password"}</Button>
        </div>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="text-sm text-muted-foreground">Lost a device? End every active session, including this one.</p>
        <Button variant="outline" onClick={signOutEverywhere} disabled={busy !== null}>
          {busy === "out" ? "Signing out…" : "Sign out everywhere"}
        </Button>
      </div>
    </section>
  );
}
