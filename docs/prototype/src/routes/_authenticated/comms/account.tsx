import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cities, sectors } from "@/lib/forum-data";

export const Route = createFileRoute("/_authenticated/comms/account")({
  component: Account,
});

function Account() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    headline: "",
    company: "",
    city: "",
    sector: "",
    bio: "",
    interests: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, headline, company, city, sector, bio, interests")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            full_name: data.full_name ?? "",
            headline: data.headline ?? "",
            company: data.company ?? "",
            city: data.city ?? "",
            sector: data.sector ?? "",
            bio: data.bio ?? "",
            interests: (data.interests ?? []).join(", "),
          });
        }
      });
  }, [user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        headline: form.headline,
        company: form.company,
        city: form.city || null,
        sector: form.sector || null,
        bio: form.bio,
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error("Could not save your profile. Please try again.");
    else toast.success("Profile saved.");
  }

  const field =
    "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communications Hub"
        title="Account & Profile"
        description="What fellow members see in the directory. Keep it current — good introductions start here."
      />
      <form onSubmit={save} className="max-w-2xl space-y-5 rounded-lg border border-border bg-card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Full name</label>
            <input className={field} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Headline</label>
            <input className={field} placeholder="e.g. Founder & Creative Director" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Company</label>
            <input className={field} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Chapter city</label>
            <select className={field} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
              <option value="">Choose a city</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Sector</label>
            <select className={field} value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })}>
              <option value="">Choose a sector</option>
              {sectors.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Interests (comma separated)</label>
            <input className={field} placeholder="Art, sailing, wine…" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">About you</label>
          <textarea
            className={field}
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
