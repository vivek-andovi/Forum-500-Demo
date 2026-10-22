"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { editorialFieldClass } from "@/components/form";
import { useAddRecommendation } from "@/features/media/queries";
import { useLookups } from "@/features/site/queries";
import { cn } from "@/lib/utils";

/** "Share a recommendation" form shown in a dialog; closes itself on success. */
export function RecommendationForm({ onClose }: { onClose: () => void }) {
  const lookups = useLookups();
  const add = useAddRecommendation();
  const categories = lookups.data?.recommendationCategories ?? [];
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cat = category || categories[0]?.id || "";
    if (!cat || !title.trim()) {
      setError("Please choose a category and add a name.");
      return;
    }
    setError("");
    add.mutate(
      { category: cat, title: title.trim(), place: place.trim() || undefined, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Thank you — your recommendation is in review and will appear once approved.");
          onClose();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="rec-category" className="block text-sm font-medium text-foreground">
            Category
          </label>
          <select
            id="rec-category"
            value={category || categories[0]?.id || ""}
            onChange={(e) => setCategory(e.target.value)}
            className={editorialFieldClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="rec-place" className="block text-sm font-medium text-foreground">
            Place / city
          </label>
          <input
            id="rec-place"
            type="text"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            maxLength={80}
            placeholder="e.g. Lisbon"
            className={editorialFieldClass}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="rec-title" className="block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          id="rec-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="The table, hotel, trip or book"
          className={editorialFieldClass}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="rec-note" className="block text-sm font-medium text-foreground">
          Why you recommend it
        </label>
        <textarea
          id="rec-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="A line or two for fellow members."
          className={cn(editorialFieldClass, "resize-none")}
        />
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" className="inline-flex items-center gap-2" disabled={add.isPending}>
          <Send className="h-4 w-4" /> {add.isPending ? "Sending…" : "Share recommendation"}
        </Button>
      </div>
    </form>
  );
}
