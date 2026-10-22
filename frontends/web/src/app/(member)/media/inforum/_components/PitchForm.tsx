"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { editorialFieldClass } from "@/components/form";
import { useSections, useSubmitPitch } from "@/features/media/queries";
import { useLookups } from "@/features/site/queries";
import { cn } from "@/lib/utils";

function formatLabel(f: string) {
  const s = f.replace(/_/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "Pitch a story" form shown in a dialog; shows a thank-you state after sending. */
export function PitchForm({ onClose }: { onClose: () => void }) {
  const lookups = useLookups();
  const pitch = useSubmitPitch();
  const sections = useSections();
  const formats = lookups.data?.pitchFormats ?? [];
  const [headline, setHeadline] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [section, setSection] = useState("");
  const [format, setFormat] = useState("article");
  const [dateline, setDateline] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    const h = headline.trim();
    const s = synopsis.trim();
    if (!h) next["headline"] = "Please add a headline.";
    else if (h.length > 120) next["headline"] = "Headline must be under 120 characters.";
    if (!s) next["synopsis"] = "Please add a short synopsis.";
    else if (s.length > 800) next["synopsis"] = "Synopsis must be under 800 characters.";
    if (!section) next["section"] = "Please choose a section.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    pitch.mutate(
      {
        headline: headline.trim(),
        synopsis: synopsis.trim(),
        section,
        format,
        dateline: dateline.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Pitch sent to the editors");
          setSubmitted(true);
        },
      },
    );
  }

  if (submitted) {
    return (
      <div className="space-y-5 py-6 text-center">
        <div className="flex justify-center">
          <CheckCircle2 className="h-12 w-12 text-accent" />
        </div>
        <h3 className="font-display text-xl font-medium">Pitch received</h3>
        <p className="text-sm text-muted-foreground">
          Thank you. Jessica and Simon will review your story and be in touch within a few days.
        </p>
        <Button onClick={onClose} className="mt-2">
          Back to In:Forum
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="pitch-headline" className="block text-sm font-medium text-foreground">
          Proposed headline
        </label>
        <input
          id="pitch-headline"
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={120}
          placeholder="e.g. The new rules of patient capital in Southeast Asia"
          className={editorialFieldClass}
        />
        {errors["headline"] ? <p className="text-xs text-destructive">{errors["headline"]}</p> : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="pitch-section" className="block text-sm font-medium text-foreground">
            Section
          </label>
          <select id="pitch-section" value={section} onChange={(e) => setSection(e.target.value)} className={editorialFieldClass}>
            <option value="">Choose a section</option>
            {(sections.data ?? []).map((s) => (
              <option key={s.id} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          {errors["section"] ? <p className="text-xs text-destructive">{errors["section"]}</p> : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="pitch-format" className="block text-sm font-medium text-foreground">
            Format
          </label>
          <select id="pitch-format" value={format} onChange={(e) => setFormat(e.target.value)} className={editorialFieldClass}>
            {(formats.length ? formats : [format]).map((f) => (
              <option key={f} value={f}>
                {formatLabel(f)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pitch-synopsis" className="block text-sm font-medium text-foreground">
          Synopsis
        </label>
        <textarea
          id="pitch-synopsis"
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={4}
          maxLength={800}
          placeholder="What is the story about, why does it matter, and what would members learn?"
          className={cn(editorialFieldClass, "resize-none")}
        />
        <div className="flex items-center justify-between">
          {errors["synopsis"] ? <p className="text-xs text-destructive">{errors["synopsis"]}</p> : <span />}
          <p className="text-xs text-muted-foreground">{synopsis.length}/800</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="pitch-dateline" className="block text-sm font-medium text-foreground">
            Dateline / city
          </label>
          <input
            id="pitch-dateline"
            type="text"
            value={dateline}
            onChange={(e) => setDateline(e.target.value)}
            maxLength={80}
            placeholder="e.g. London, Singapore, New York"
            className={editorialFieldClass}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="pitch-notes" className="block text-sm font-medium text-foreground">
          Notes for the editors
        </label>
        <textarea
          id="pitch-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={600}
          placeholder="Any sources, timing, photo availability, or questions for Jessica and Simon."
          className={cn(editorialFieldClass, "resize-none")}
        />
        <p className="text-right text-xs text-muted-foreground">{notes.length}/600</p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="inline-flex items-center gap-2" disabled={pitch.isPending}>
          <Send className="h-4 w-4" /> {pitch.isPending ? "Submitting…" : "Submit pitch"}
        </Button>
      </div>
    </form>
  );
}
