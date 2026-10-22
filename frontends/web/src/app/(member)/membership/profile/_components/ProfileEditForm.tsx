"use client";

import type { Dispatch, SetStateAction } from "react";
import { QueryState } from "@/components/QueryState";
import { FormField, inputClass } from "@/components/form";
import type { Chapter, ProfileQuestion, Sector } from "@/features/membership/types";
import type { ProfileForm } from "./profile-form";

/** The "Profile details" editor shown while editing; saving and submitting are handled by the page. */
export function ProfileEditForm({
  form,
  setForm,
  chapterOptions,
  sectors,
  questions,
  questionsLoading,
  questionsError,
  saving,
  savingDraft,
  onSaveDraft,
}: {
  form: ProfileForm;
  setForm: Dispatch<SetStateAction<ProfileForm>>;
  chapterOptions: Chapter[];
  sectors: Sector[];
  questions: ProfileQuestion[];
  questionsLoading: boolean;
  questionsError: unknown;
  saving: boolean;
  savingDraft: boolean;
  onSaveDraft: () => void;
}) {
  return (
        <section className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-display text-xl font-medium">Profile details</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <FormField
              label="Full name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            <FormField
              label="Headline"
              placeholder="e.g. Founder & Creative Director"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
            <FormField
              label="Where you work"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium">Chapter / where you live</label>
              <select
                className={inputClass}
                value={form.chapterId}
                onChange={(e) => setForm({ ...form, chapterId: e.target.value })}
              >
                <option value="">Choose a city</option>
                {chapterOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Sector</label>
              <select
                className={inputClass}
                value={form.sectorId}
                onChange={(e) => setForm({ ...form, sectorId: e.target.value })}
              >
                <option value="">Choose a sector</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <FormField
              label="Member since (year)"
              inputMode="numeric"
              value={form.joinedYear}
              onChange={(e) => setForm({ ...form, joinedYear: e.target.value.replace(/[^0-9]/g, "").slice(0, 4) })}
            />
            <FormField
              label="Interests (comma separated)"
              placeholder="Art, sailing, wine…"
              value={form.interests}
              onChange={(e) => setForm({ ...form, interests: e.target.value })}
            />
            <FormField
              label="Cities you travel to often (comma separated)"
              placeholder="New York, Singapore…"
              value={form.travelCities}
              onChange={(e) => setForm({ ...form, travelCities: e.target.value })}
            />
          </div>
          <div className="mt-5">
            <label className="text-sm font-medium">About you</label>
            <textarea
              className={inputClass}
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>
          <div className="mt-5">
            <label className="text-sm font-medium">Photo link</label>
            <input
              className={inputClass}
              placeholder="https://…"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
            />
          </div>
          <div className="mt-5">
            <label className="text-sm font-medium">LinkedIn profile</label>
            <input
              className={inputClass}
              placeholder="https://www.linkedin.com/in/…"
              value={form.linkedinUrl}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
            />
          </div>
          <div className="mt-8">
            <h4 className="rule-top font-display text-lg font-medium">The five questions</h4>
            <div className="mt-4 space-y-5">
              <QueryState isLoading={questionsLoading} error={questionsError} empty={questions.length === 0} emptyText="No questions configured yet.">
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="text-sm font-medium">{q.text}</label>
                    <textarea
                      className={inputClass}
                      rows={3}
                      value={form.answers[q.id] ?? ""}
                      onChange={(e) => setForm({ ...form, answers: { ...form.answers, [q.id]: e.target.value } })}
                    />
                  </div>
                ))}
              </QueryState>
            </div>
          </div>
          <button
            onClick={onSaveDraft}
            disabled={saving}
            className="mt-6 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
          >
            {savingDraft ? "Saving…" : "Save draft"}
          </button>
        </section>
  );
}
