import { initials } from "@/lib/format";

/** Member photo with an initials fallback when avatarUrl is missing. */
export function MemberAvatar({
  src,
  name,
  className = "h-10 w-10 rounded-full",
}: {
  src?: string | null;
  name?: string | null;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name ?? ""} className={`${className} object-cover`} loading="lazy" />;
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
