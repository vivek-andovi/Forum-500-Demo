"use client";

import { useState } from "react";
import { initials } from "@/lib/format";

/** Member photo with an initials fallback when avatarUrl is missing or fails to load (the failure is still listed by ProblemCenter). */
export function MemberAvatar({
  src,
  name,
  className = "h-10 w-10 rounded-full",
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  if (src && failed !== src) {
    return (
      <span data-own-fallback className="contents">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name ?? ""} className={`${className} object-cover`} loading="lazy" onError={() => setFailed(src)} />
      </span>
    );
  }
  return (
    <div
      className={`${className} flex items-center justify-center bg-primary/10 font-display text-sm font-semibold text-primary`}
      aria-label={name ?? undefined}
    >
      {initials(name)}
    </div>
  );
}
