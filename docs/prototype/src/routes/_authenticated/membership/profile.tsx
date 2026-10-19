import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Check, X, ChevronDown, Copy, Download, Linkedin, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { GalleryPhoto } from "@/lib/forum-data";
import { useTaggedGallery } from "@/lib/my-gallery";
import {
  cities,
  sectors,
  forumQuestions,
  myGroups,
  myPublications,
  myAppearances,
  myFeed,
  benefitsIOffer,
} from "@/lib/forum-data";
import galleryLondon from "@/assets/event-london.jpg";
import galleryNassau from "@/assets/event-nassau.jpg";
import gallerySingapore from "@/assets/event-singapore.jpg";
import galleryStockholm from "@/assets/event-stockholm.jpg";
import gallerySalon from "@/assets/hero-salon.jpg";
import galleryLounge from "@/assets/benefits-lounge.jpg";

const myGallery: GalleryPhoto[] = [
  { id: "g1", caption: "On stage at the London Evening Salon", event: "London Evening Salon", date: "February 2026", src: galleryLondon },
  { id: "g2", caption: "Panel conversation, Forum Winter Gathering", event: "Winter Gathering", date: "January 2026", src: galleryStockholm },
  { id: "g3", caption: "Dinner with the Singapore chapter", event: "Singapore Chapter Dinner", date: "November 2025", src: gallerySingapore },
  { id: "g4", caption: "Forum Weekend, Nassau", event: "Forum Weekend", date: "October 2025", src: galleryNassau },
  { id: "g5", caption: "In conversation at the Club", event: "Members' Salon", date: "September 2025", src: gallerySalon },
  { id: "g6", caption: "Members' lounge, New York", event: "New York Chapter", date: "June 2025", src: galleryLounge },
];


export const Route = createFileRoute("/_authenticated/membership/profile")({
  head: () => ({
    meta: [
      { title: "My Member Profile — Forum500" },
      { name: "description", content: "Edit and publish the profile fellow Forum500 Members see in the directory." },
      { property: "og:title", content: "My Member Profile — Forum500" },
      { property: "og:description", content: "Edit and publish the profile fellow Forum500 Members see in the directory." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyMemberProfile,
});

interface ProfileForm {
  full_name: string;
  headline: string;
  company: string;
  city: string;
  sector: string;
  bio: string;
  interests: string;
  travel_cities: string;
  avatar_url: string;
  linkedin_url: string;
  joined_year: string;
  membership_tier: string;
  is_published: boolean;
  question_answers: Record<string, string>;
}

const emptyForm: ProfileForm = {
  full_name: "",
  headline: "",
  company: "",
  city: "",
  sector: "",
  bio: "",
  interests: "",
  travel_cities: "",
  avatar_url: "",
  linkedin_url: "",
  joined_year: "",
  membership_tier: "Member",
  is_published: true,
  question_answers: {},
};

const field =
  "mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <h3 className="font-display text-xl font-medium">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function CollapsiblePanel({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="rounded-lg border border-border bg-card p-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <h3 className="font-display text-xl font-medium">{title}</h3>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </section>
  );
}

async function copyPhoto(photo: GalleryPhoto) {
  try {
    const blob = await (await fetch(photo.src)).blob();
    const png = blob.type === "image/png" ? blob : await toPng(blob);
    await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    toast.success("Photo copied — paste it wherever you need it.");
  } catch {
    toast.error("Your browser blocked copying. Use Download instead.");
  }
}

function toPng(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("no blob"))), "image/png");
    };
    img.onerror = () => reject(new Error("load failed"));
    img.src = URL.createObjectURL(blob);
  });
}

function downloadPhoto(photo: GalleryPhoto) {
  const a = document.createElement("a");
  a.href = photo.src;
  a.download = `${photo.caption.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function MyMemberProfile() {
  const { user } = useAuth();
  const { photos: taggedPhotos, remove: removeTagged } = useTaggedGallery();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingReview, setPendingReview] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setForm({
          full_name: data.full_name ?? "",
          headline: data.headline ?? "",
          company: data.company ?? "",
          city: data.city ?? "",
          sector: data.sector ?? "",
          bio: data.bio ?? "",
          interests: (data.interests ?? []).join(", "),
          travel_cities: (data.travel_cities ?? []).join(", "),
          avatar_url: data.avatar_url ?? "",
          linkedin_url: (data as { linkedin_url?: string | null }).linkedin_url ?? "",
          joined_year: data.joined_year ? String(data.joined_year) : "",
          membership_tier: data.membership_tier ?? "Member",
          is_published: data.is_published ?? true,
          question_answers: (data.question_answers as Record<string, string>) ?? {},
        });
      });
  }, [user]);

  async function save(submitForReview: boolean) {
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
        avatar_url: form.avatar_url || null,
        linkedin_url: form.linkedin_url || null,
        interests: form.interests.split(",").map((s) => s.trim()).filter(Boolean),
        travel_cities: form.travel_cities.split(",").map((s) => s.trim()).filter(Boolean),
        joined_year: form.joined_year ? Number(form.joined_year) : null,
        question_answers: form.question_answers,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile. Please try again.");
      return;
    }
    setEditing(false);
    if (submitForReview) {
      setPendingReview(true);
      toast.success("Submitted for review — the Forum team will approve your changes before Members see them.");
    } else {
      toast.success("Profile saved as a draft. Nothing is visible to Members yet.");
    }
  }

  const name = form.full_name || "Member";
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const interestList = form.interests.split(",").map((s) => s.trim()).filter(Boolean);
  const travelList = form.travel_cities.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Membership Hub"
        title="My Member Profile"
        description="How you appear to fellow Members in the directory — edit it, then send your changes to the Forum team for approval."
        action={
          editing ? (
            <div className="flex gap-2">
              <button
                onClick={() => save(true)}
                disabled={saving}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                <Check className="h-4 w-4" /> {saving ? "Sending…" : "Submit for review"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                <X className="h-4 w-4" /> Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <Pencil className="h-4 w-4" /> Edit profile
            </button>
          )
        }
      />

      {pendingReview && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-foreground">Your profile changes are with the Forum team.</p>
          <p className="mt-1 text-muted-foreground">
            Simon and Jessica review every profile update before it appears in the Member Directory. Members
            still see your last approved profile until then.
          </p>
        </div>
      )}


      <div className="grid gap-10 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {editing ? (
            <section className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-display text-xl font-medium">Profile details</h3>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Full name</label>
                  <input className={field} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Headline</label>
                  <input className={field} placeholder="e.g. Founder & Creative Director" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Where you work</label>
                  <input className={field} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Chapter / where you live</label>
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
                  <label className="text-sm font-medium">Member since (year)</label>
                  <input className={field} inputMode="numeric" value={form.joined_year} onChange={(e) => setForm({ ...form, joined_year: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Interests (comma separated)</label>
                  <input className={field} placeholder="Art, sailing, wine…" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Cities you travel to often (comma separated)</label>
                  <input className={field} placeholder="New York, Singapore…" value={form.travel_cities} onChange={(e) => setForm({ ...form, travel_cities: e.target.value })} />
                </div>
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">About you</label>
                <textarea className={field} rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">Photo link</label>
                <input className={field} placeholder="https://…" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
              </div>
              <div className="mt-5">
                <label className="text-sm font-medium">LinkedIn profile</label>
                <input className={field} placeholder="https://www.linkedin.com/in/…" value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
              </div>
              <div className="mt-8">
                <h4 className="rule-top font-display text-lg font-medium">The five questions</h4>
                <div className="mt-4 space-y-5">
                  {forumQuestions.map((q, i) => (
                    <div key={i}>
                      <label className="text-sm font-medium">{q}</label>
                      <textarea
                        className={field}
                        rows={3}
                        value={form.question_answers[String(i)] ?? ""}
                        onChange={(e) =>
                          setForm({ ...form, question_answers: { ...form.question_answers, [String(i)]: e.target.value } })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => save(false)}
                disabled={saving}
                className="mt-6 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60"
              >
                Save as draft (not sent for review)
              </button>
            </section>
          ) : (
            <>
              <div>
                <h2 className="mt-2 font-display text-4xl font-semibold">{name}</h2>
                <p className="mt-2 text-lg text-muted-foreground">
                  {form.headline || "Member, Forum500"}
                  {form.company ? ` · ${form.company}` : ""}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {pendingReview
                    ? "Changes awaiting Forum approval"
                    : form.is_published
                      ? "Published in the Member Directory"
                      : "Draft — not yet visible to Members"}
                </p>
              </div>

              <CollapsiblePanel title="About">
                <p className="leading-relaxed text-muted-foreground">
                  {form.bio || "Add a short bio so fellow Members can find you in the directory."}
                </p>
              </CollapsiblePanel>

              <CollapsiblePanel title="Interests">
                {interestList.length ? (
                  <div className="flex flex-wrap gap-2">
                    {interestList.map((i) => (
                      <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">{i}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No interests added yet.</p>
                )}
              </CollapsiblePanel>

              <CollapsiblePanel title="My five questions">
                <div className="space-y-5">
                  {forumQuestions.map((q, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium">{q}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {form.question_answers[String(i)] || "Not answered yet — edit your profile to add an answer."}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Edit my answers
                </button>
              </CollapsiblePanel>

              <CollapsiblePanel title="My groups">
                <div className="space-y-3">
                  {myGroups.map((g) => (
                    <div key={g.id} className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.members} Members · {g.note}</p>
                      </div>
                    </div>
                  ))}
                  <Link
                    to="/membership/groups"
                    className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Join a group
                  </Link>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel title="Benefits I'm offering other Members">
                <div className="divide-y divide-border">
                  {benefitsIOffer.map((b) => (
                    <div key={b.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="font-display text-lg font-medium leading-snug">{b.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{b.detail}</p>
                        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{b.status}</p>
                      </div>
                      <Link
                        to="/membership/benefits"
                        search={{ offer: undefined }}
                        className="mt-1 flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </div>
                  ))}
                </div>
                <Link
                  to="/membership/benefits"
                  search={{ offer: "new" }}
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Apply to offer a benefit
                </Link>
              </CollapsiblePanel>

              <CollapsiblePanel title="Articles I have published">
                <div className="divide-y divide-border">
                  {myPublications.map((p) => (
                    <div key={p.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-display text-lg font-medium leading-snug">{p.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {p.outlet} · {p.date} · {p.readTime}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  to="/media/inforum"
                  hash="make-an-idea-happen"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Publish an article
                </Link>
              </CollapsiblePanel>

              <CollapsiblePanel title="Interviews & podcasts">
                <div className="divide-y divide-border">
                  {myAppearances.map((m) => (
                    <div key={m.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-display text-lg font-medium leading-snug">{m.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                        {m.format} · {m.date} · {m.duration}
                      </p>
                    </div>
                  ))}
                </div>
                <Link
                  to="/comms/messages"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Request an interview
                </Link>
              </CollapsiblePanel>


              <CollapsiblePanel title="My gallery">
                <p className="text-sm text-muted-foreground">
                  Photos of you from Forum gatherings — copy or download any of them to share on LinkedIn or elsewhere.
                  Tag photos in the{" "}
                  <Link to="/events/gallery" className="font-medium text-primary underline underline-offset-4">
                    events Gallery
                  </Link>{" "}
                  to add them here.
                </p>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  {[...taggedPhotos, ...myGallery.filter((g) => !taggedPhotos.some((t) => t.src === g.src))].map(
                    (photo) => {
                      const tagged = taggedPhotos.some((t) => t.id === photo.id);
                      return (
                        <figure key={photo.id} className="overflow-hidden rounded-lg border border-border bg-background">
                          <img src={photo.src} alt={photo.caption} loading="lazy" className="h-44 w-full object-cover" />
                          <figcaption className="p-4">
                            <p className="text-sm font-medium leading-snug">{photo.caption}</p>
                            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                              {photo.event} · {photo.date}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => copyPhoto(photo)}
                                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                              >
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadPhoto(photo)}
                                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </button>
                              {tagged && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    removeTagged(photo.id);
                                    toast("Removed from My Gallery");
                                  }}
                                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                                >
                                  <X className="h-3.5 w-3.5" /> Remove
                                </button>
                              )}
                            </div>
                          </figcaption>
                        </figure>
                      );
                    },
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("Photo requests go to the Forum team — they'll add approved gathering photos to your gallery.")}
                  className="mt-5 flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  <ImagePlus className="h-4 w-4" /> Request more photos
                </button>
              </CollapsiblePanel>

              <CollapsiblePanel title="My activity">

                <ol className="space-y-4">
                  {myFeed.map((f) => (
                    <li key={f.id} className="border-l-2 border-border pl-4">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">{f.type} · {f.time}</p>
                      <p className="mt-1 text-sm">{f.text}</p>
                    </li>
                  ))}
                </ol>
                <Link
                  to="/media/newsfeed"
                  className="mt-5 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Share a post
                </Link>
              </CollapsiblePanel>
            </>
          )}
        </div>

        <aside>
          <div className="rounded-lg border border-border bg-card p-6 lg:sticky lg:top-6">
            {form.avatar_url ? (
              <img src={form.avatar_url} alt={`Portrait of ${name}`} className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary font-display text-2xl font-semibold text-secondary-foreground">
                {initials}
              </div>
            )}
            <button
              onClick={() => setEditing(true)}
              className="mt-3 text-xs font-medium text-primary hover:underline"
            >
              Change photo
            </button>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-muted-foreground">Lives in</dt><dd className="font-medium">{form.city || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Works at</dt><dd className="font-medium">{form.company || "—"}</dd></div>
              <div>
                <dt className="text-muted-foreground">Travels often to</dt>
                <dd className="font-medium">{travelList.length ? travelList.join(", ") : "—"}</dd>
              </div>
              <div><dt className="text-muted-foreground">Chapter</dt><dd className="font-medium">{form.city || "—"}</dd></div>
              <div><dt className="text-muted-foreground">Membership</dt><dd className="font-medium">{form.membership_tier}</dd></div>
              <div><dt className="text-muted-foreground">Member since</dt><dd className="font-medium">{form.joined_year || "—"}</dd></div>
            </dl>
            {form.linkedin_url ? (
              <a
                href={form.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
              >
                <Linkedin className="h-4 w-4" /> LinkedIn profile
              </a>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary"
              >
                <Linkedin className="h-4 w-4" /> Connect LinkedIn
              </button>
            )}
            <Link
              to="/membership"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-secondary"
            >
              View Member Directory
            </Link>

          </div>
        </aside>
      </div>
    </div>
  );
}
