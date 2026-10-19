import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MemberSidebar } from "@/components/MemberSidebar";
import { InforumBanner } from "@/components/InforumBanner";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: MemberLayout,
});

function MemberLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <MemberSidebar />
        </div>
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <MemberSidebar />
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
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
