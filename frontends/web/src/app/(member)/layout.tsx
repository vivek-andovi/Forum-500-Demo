"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Menu } from "lucide-react";
import { MemberSidebar } from "@/components/MemberSidebar";
import { InforumBanner } from "@/components/InforumBanner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useToken } from "@/hooks/useAuth";
import { useMe } from "@/lib/queries";
import { ApiError } from "@/lib/api";

export default function MemberLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const token = useToken();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (token === null) router.replace("/auth");
  }, [token, router]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <AuthGate>
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block">
          <div className="sticky top-0 h-screen">
            <MemberSidebar />
          </div>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <MemberSidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center border-b border-border px-4 py-3 md:hidden">
            <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu className="h-6 w-6" />
            </button>
            <span className="ml-3 font-display text-lg font-semibold">Forum500</span>
          </div>
          <main className="flex-1 px-4 py-8 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-[1400px] space-y-8">
              <InforumBanner />
              {children}
            </div>
          </main>
        </div>
      </div>
    </AuthGate>
  );
}

/** Validates the token against /v1/me before rendering member pages. */
function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const me = useMe();
  const unauthorized = me.error instanceof ApiError && me.error.status === 401;

  useEffect(() => {
    if (unauthorized) router.replace("/auth");
  }, [unauthorized, router]);

  if (me.isLoading || unauthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}
