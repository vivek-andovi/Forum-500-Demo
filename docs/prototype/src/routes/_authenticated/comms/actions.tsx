import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CalendarPlus,
  PenLine,
  Users,
  Gift,
  Eye,
  CheckCircle2,
  FileSignature,
  CreditCard,
  ClipboardList,
  Clock,
} from "lucide-react";
import { initialActions, typeMeta, type ActionItem, type ActionType } from "@/lib/actions-data";

export const Route = createFileRoute("/_authenticated/comms/actions")({
  component: Actions,
});

function Actions() {
  const [actions, setActions] = useState(initialActions);
  const [payItem, setPayItem] = useState<ActionItem | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: actions.length };
    for (const a of actions) c[a.type] = (c[a.type] ?? 0) + 1;
    return c;
  }, [actions]);

  const complete = (item: ActionItem) => {
    setActions((prev) => prev.filter((a) => a.id !== item.id));
    toast.success(`${typeMeta[item.type].label} complete`, { description: item.title });
  };

  const handleAction = (item: ActionItem) => {
    if (item.type === "pay") {
      setPayItem(item);
      return;
    }
    complete(item);
  };

  const confirmPay = () => {
    if (!payItem) return;
    complete(payItem);
    setPayItem(null);
  };

  const renderList = (items: ActionItem[]) => {
    if (items.length === 0) {
      return (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nothing waiting on you here.
        </p>
      );
    }
    return (
      <ul className="space-y-3">
        {items.map((item) => {
          const meta = typeMeta[item.type];
          const Icon = meta.icon;
          return (
            <li
              key={item.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[11px] uppercase tracking-wide">
                    {meta.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.context}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.due}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-medium">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
                {item.amount ? <span className="font-display text-lg">{item.amount}</span> : null}
                <Button
                  onClick={() => handleAction(item)}
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {meta.cta}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const tabs: { value: string; label: string }[] = [
    { value: "all", label: "See all" },
    { value: "review", label: "Review" },
    { value: "approve", label: "Approve" },
    { value: "sign", label: "Sign" },
    { value: "pay", label: "Pay" },
    { value: "fill", label: "Fill" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Actions"
        description="Everything waiting on you — to review, approve, sign, pay or complete."
      />

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto flex-wrap justify-start gap-1">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="gap-2">
              {t.label}
              <span className="text-xs text-muted-foreground">{counts[t.value] ?? 0}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {renderList(actions)}
        </TabsContent>
        {(["review", "approve", "sign", "pay", "fill"] as ActionType[]).map((type) => (
          <TabsContent key={type} value={type} className="mt-6">
            {renderList(actions.filter((a) => a.type === type))}
          </TabsContent>
        ))}
      </Tabs>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-medium">Start something</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <CalendarPlus className="h-6 w-6 text-accent" />
            <h3 className="mt-3 font-display text-lg font-medium">Organize an event</h3>
            <p className="mt-1 text-sm text-muted-foreground">Host a salon, dinner or gathering for fellow members.</p>
            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/events/my-events">Request to organize</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <PenLine className="h-6 w-6 text-accent" />
            <h3 className="mt-3 font-display text-lg font-medium">Publish an article</h3>
            <p className="mt-1 text-sm text-muted-foreground">Contribute to In:Forum or share a member article.</p>
            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/media/inforum" hash="make-an-idea-happen">Submit article</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <Users className="h-6 w-6 text-accent" />
            <h3 className="mt-3 font-display text-lg font-medium">Request an introduction</h3>
            <p className="mt-1 text-sm text-muted-foreground">Ask Simon or Jessica to introduce you to another member.</p>
            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/comms/introductions">Request introduction</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <Gift className="h-6 w-6 text-accent" />
            <h3 className="mt-3 font-display text-lg font-medium">Offer a benefit</h3>
            <p className="mt-1 text-sm text-muted-foreground">Share a preferred rate or service with the community.</p>
            <Button asChild className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/membership/benefits" search={{ offer: "new" }}>Offer a benefit</Link>
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={payItem !== null} onOpenChange={(open) => !open && setPayItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{payItem?.title}</DialogTitle>
            <DialogDescription>{payItem?.detail}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount due</span>
              <span className="font-display text-xl">{payItem?.amount}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Card payments will be taken securely by Stripe. This is a placeholder checkout until payments are switched on.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayItem(null)}>
              Cancel
            </Button>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={confirmPay}>
              Pay {payItem?.amount}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
