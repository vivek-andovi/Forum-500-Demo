import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Mail } from "lucide-react";

const emails = [
  { id: "e1", subject: "Autumn Salon — London", sender: "Forum Team", preview: "Save the date for our annual autumn salon at the ICA.", time: "Yesterday", unread: true },
  { id: "e2", subject: "New York chapter dinner", sender: "New York Committee", preview: "We are hosting an intimate dinner on the 14th.", time: "Tuesday", unread: false },
  { id: "e3", subject: "In:Forum contributor invitation", sender: "Jessica", preview: "Would love your thoughts on the next Forecast piece.", time: "Last week", unread: false },
  { id: "e4", subject: "Member benefit: Plotify update", sender: "Anish Malhotra", preview: "Preferred access is now open to all members.", time: "Last week", unread: false },
];

export const Route = createFileRoute("/_authenticated/comms/emails")({
  component: Emails,
});

function Emails() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Emails"
        description="Forum newsletters, chapter updates and member correspondence."
      />
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {emails.map((email) => (
          <button
            key={email.id}
            className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-secondary/40"
          >
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className={`truncate text-sm ${email.unread ? "font-bold" : "font-medium"}`}>{email.subject}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{email.time}</span>
              </div>
              <p className="text-xs text-muted-foreground">{email.sender}</p>
              <p className={`mt-1 truncate text-sm ${email.unread ? "text-foreground" : "text-muted-foreground"}`}>
                {email.preview}
              </p>
            </div>
            {email.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}
