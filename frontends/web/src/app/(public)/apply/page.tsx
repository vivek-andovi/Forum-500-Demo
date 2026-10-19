"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle, MapPin, User, Users, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicPage, useSubmitApplication } from "@/lib/queries";
import { toList } from "@/lib/format";

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

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const apply = useSubmitApplication();
  const page = usePublicPage("apply").data;
  const successBlock = page?.blocks?.find((b) => b.key === "success");
  const busy = apply.isPending;
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
    const opt = (v: string) => (v.trim() ? v.trim() : undefined);
    const travelCities = toList(form.travelCities);
    apply.mutate(
      {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: opt(form.phone),
        linkedin: opt(form.linkedin),
        role: form.role.trim(),
        company: form.company.trim(),
        sector: form.sector.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
        travelCities: travelCities.length ? travelCities : undefined,
        recommenderName: form.recommender.trim(),
        recommenderRelation: opt(form.recommenderRelation),
        whyJoin: form.whyJoin.trim(),
        contribution: form.contribution.trim(),
        about: opt(form.about),
      },
      { onSuccess: () => setSubmitted(true) },
    );
  }

  return (
    <div className="flex flex-1 px-4 py-16">
        <div className="mx-auto w-full max-w-2xl">
          <div className="text-center">
            {page ? (
              <>
                {page.eyebrow && <p className="eyebrow">{page.eyebrow}</p>}
                <h1 className="mt-2 font-display text-3xl font-semibold">{page.title}</h1>
                {page.subtitle && (
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{page.subtitle}</p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            )}
          </div>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-border bg-card p-8 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 font-display text-xl font-medium">{successBlock?.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Thank you, {form.fullName.split(" ")[0] || "there"}. {successBlock?.body}
              </p>
              {successBlock?.ctaLabel && (
                <Link
                  href={successBlock.ctaHref ?? "/"}
                  className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {successBlock.ctaLabel}
                </Link>
              )}
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
                  hint="Forum chapters meet across 49 cities — tell us where you&apos;re based."
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
    </div>
  );
}
