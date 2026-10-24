"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <details className="mt-4 rounded-md bg-secondary/50 p-3 text-left text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground">What went wrong</summary>
          <p className="mt-2 break-words font-mono">{error.message || "No error message"}</p>
          {error.digest && <p className="mt-1 font-mono text-muted-foreground">Reference: {error.digest}</p>}
          <p className="mt-1 font-mono text-muted-foreground">Page: {typeof window !== "undefined" ? window.location.pathname : ""}</p>
        </details>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
