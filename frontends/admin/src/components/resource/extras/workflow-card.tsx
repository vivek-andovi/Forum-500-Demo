import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";

/** The highlighted panel above the form: title + status on the left, action buttons on the right. */
export function WorkflowCard({
  title,
  status,
  children,
  footer,
}: {
  title: string;
  status?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="border-accent/40 bg-accent/5">
      <CardContent className="space-y-3 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <p className="font-display text-lg">{title}</p>
            {status && <StatusBadge value={status} />}
          </div>
          <div className="flex flex-wrap gap-2">{children}</div>
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}
