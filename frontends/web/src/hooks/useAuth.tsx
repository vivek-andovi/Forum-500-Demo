"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken, onAuthChange, setToken } from "@/lib/api";
import { useMe } from "@/features/auth/queries";

/** Reactive view of the stored bearer token. `undefined` until mounted on the client. */
export function useToken() {
  const [token, setTok] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    setTok(getToken());
    return onAuthChange(() => setTok(getToken()));
  }, []);
  return token;
}

/** Current user + member (member is null when an admin is logged in). */
export function useCurrentMember() {
  const me = useMe();
  return {
    ...me,
    user: me.data?.user ?? null,
    member: me.data?.member ?? null,
    pendingRevision: me.data?.pendingRevision ?? null,
  };
}

// Where the member layout should send the user after the token is cleared. Set by an explicit
// sign-out; when empty (session expired, 401) the layout sends them to /auth?next=<current page>.
let signOutRedirect: string | null = null;

/** Read (once) the destination chosen by the last explicit sign-out. */
export function takeSignOutRedirect() {
  const to = signOutRedirect;
  signOutRedirect = null;
  return to;
}

/** Clears the session; the member layout then navigates to `redirectTo`. */
export function useSignOut() {
  const qc = useQueryClient();
  return (redirectTo = "/auth") => {
    signOutRedirect = redirectTo;
    setToken(null);
    qc.clear();
  };
}

/** An in-app path that is safe to redirect to (rejects "//host" and "/\\host"). */
export function safePath(p: string | null | undefined): string | null {
  return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/\\") ? p : null;
}
