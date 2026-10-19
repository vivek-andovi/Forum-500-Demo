"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken, onAuthChange, setToken } from "@/lib/api";
import { useMe } from "@/lib/queries";

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

export function useSignOut() {
  const qc = useQueryClient();
  return () => {
    setToken(null);
    qc.clear();
  };
}
