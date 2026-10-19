import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CheckCircle, MapPin, User, Users, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/apply")({
  head: () => ({
    meta: [
      { title: "Apply for Membership — Forum500" },
      { name: "description", content: "Apply for membership of Forum500. Membership is by invitation or nomination." },
      { property: "og:title", content: "Apply for Membership — Forum500" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApplyPage,
});

const inputClass =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  id,
  required,
  optional,
  ...props
}: {
  label: string;
  id: string;
  required?: boolean;
  optional?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
        {optional && <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}
      </label>
      <input id={id} required={required} className={inputClass} {...props} />
    </div>
  );
}

function SectionHeading({ icon: Icon, title, hint }: { icon: typeof User; title: string; hint?: string }) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-3">
      <Icon className="h-4 w-4 text-accent" />
      <div>
        <h2 className="font-display text-lg font-medium">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    linkedin: "",
    role: "",
    company: "",
    sector: "",
    city: "",
    country: "",
    travelCities: "",
    recommender: "",
    recommenderRelation: "",
    whyJoin: "",
    contribution: "",
    about: "",
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // Simulate submission; backend integration can be wired later.
    setTimeout(() => {
      setBusy(false);
      setSubmitted(true);
    }, 800);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="text-center">
            <p className="eyebrow">Membership</p>
            <h1 className="mt-2 font-display text-3xl font-semibold">Apply to join Forum500</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Membership is by invitation or nomination. Tell us a little about yourself and the Member recommending
              you, and the membership team will be in touch.
            </p>
          </div>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 font-display text-xl font-medium">Application received</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you, {form.fullName.split(" ")[0] || "there"}. The membership team reviews every application and
                will respond within two weeks.
              </p>
              <Link
                to="/"
                className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 space-y-8 rounded-lg border border-border bg-card p-6 sm:p-8">
              {/* Personal details */}
              <section className="space-y-4">
                <SectionHeading icon={User} title="Personal details" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full name" id="fullName" required value={form.fullName} onChange={set("fullName")} />
                  <Field label="Email" id="email" type="email" required value={form.email} onChange={set("email")} />
                  <Field label="Phone" id="phone" type="tel" optional value={form.phone} onChange={set("phone")} />
                  <Field
                    label="LinkedIn profile"
                    id="linkedin"
                    type="url"
                    optional
                    placeholder="https://linkedin.com/in/…"
                    value={form.linkedin}
                    onChange={set("linkedin")}
                  />
                  <Field
                    label="Role / title"
                    id="role"
                    required
                    placeholder="e.g. Founder & CEO"
                    value={form.role}
                    onChange={set("role")}
                  />
                  <Field
                    label="Company / organisation"
                    id="company"
                    required
                    value={form.company}
                    onChange={set("company")}
                  />
                  <Field
                    label="Sector"
                    id="sector"
                    required
                    placeholder="e.g. Technology, Finance, Hospitality"
                    value={form.sector}
                    onChange={set("sector")}
                  />
                </div>
              </section>

              {/* Location */}
              <section className="space-y-4">
                <SectionHeading
                  icon={MapPin}
                  title="Location"
                  hint="Forum chapters meet across 49 cities — tell us where you're based."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Primary city" id="city" required value={form.city} onChange={set("city")} />
                  <Field label="Country" id="country" required value={form.country} onChange={set("country")} />
                </div>
                <Field
                  label="Cities you travel to often"
                  id="travelCities"
                  optional
                  placeholder="e.g. London, New York, Dubai"
                  value={form.travelCities}
                  onChange={set("travelCities")}
                />
              </section>

              {/* Recommending member */}
              <section className="space-y-4">
                <SectionHeading
                  icon={Users}
                  title="Recommending member"
                  hint="Membership is by nomination — which Forum500 Member is recommending you?"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Member's name"
                    id="recommender"
                    required
                    value={form.recommender}
                    onChange={set("recommender")}
                  />
                  <Field
                    label="How do you know them?"
                    id="recommenderRelation"
                    optional
                    placeholder="e.g. Business partner, friend"
                    value={form.recommenderRelation}
                    onChange={set("recommenderRelation")}
                  />
                </div>
              </section>

              {/* About */}
              <section className="space-y-4">
                <SectionHeading icon={MessageSquare} title="About you" />
                <div>
                  <label className="text-sm font-medium" htmlFor="whyJoin">
                    Why would you like to join Forum500?
                  </label>
                  <textarea
                    id="whyJoin"
                    required
                    rows={3}
                    maxLength={1000}
                    value={form.whyJoin}
                    onChange={set("whyJoin")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="contribution">
                    What could you contribute to the community?
                  </label>
                  <textarea
                    id="contribution"
                    required
                    rows={3}
                    maxLength={1000}
                    value={form.contribution}
                    onChange={set("contribution")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" htmlFor="about">
                    Anything else we should know?
                    <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="about"
                    rows={3}
                    maxLength={1000}
                    value={form.about}
                    onChange={set("about")}
                    className={inputClass}
                  />
                </div>
              </section>

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
