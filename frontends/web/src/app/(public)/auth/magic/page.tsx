"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { errorMessage, setToken } from "@/lib/api";
import { useConsumeMagicLink } from "@/features/auth/queries";
import { AuthCard } from "@/components/AuthCard";

function MagicSignIn() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const consume = useConsumeMagicLink();
  const token = params.get("token") ?? "";
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The token is single-use: never send it twice (Strict Mode runs effects twice in development).
    if (!token || started.current) return;
    started.current = true;
    consume.mutate(token, {
      onSuccess: (res) => {
        qc.clear();
        setToken(res.accessToken);
        router.replace("/dashboard");
      },
      onError: (err) => setError(errorMessage(err)),
    });
  }, [token, consume, qc, router]);

  const backToSignIn = (
    <Link href="/auth" className="font-semibold text-accent hover:underline">
      Back to sign in
    </Link>
  );

  if (!token || error) {
    return (
      <AuthCard eyebrow="Account" title="Sign-in link not valid" footer={backToSignIn}>
        <p className="text-sm">
          {error ?? "This page needs the link from your email. Please open it again, or request a new one."}
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard eyebrow="Members only" title="Signing you in">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> One moment…
      </p>
    </AuthCard>
  );
}

export default function MagicLinkPage() {
  return (
    <Suspense fallback={null}>
      <MagicSignIn />
    </Suspense>
  );
}
