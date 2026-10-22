import type { ContentStatus } from "@/lib/types/common";
import type { Member } from "@/features/membership/types";

/** The profile editor's form state: every field is a string so inputs stay controlled. */
export interface ProfileForm {
  fullName: string;
  headline: string;
  company: string;
  chapterId: string;
  sectorId: string;
  bio: string;
  interests: string;
  travelCities: string;
  avatarUrl: string;
  linkedinUrl: string;
  joinedYear: string;
  answers: Record<string, string>;
}

export const emptyForm: ProfileForm = {
  fullName: "",
  headline: "",
  company: "",
  chapterId: "",
  sectorId: "",
  bio: "",
  interests: "",
  travelCities: "",
  avatarUrl: "",
  linkedinUrl: "",
  joinedYear: "",
  answers: {},
};

/** Form values from the live profile, with any saved draft (unsubmitted edits) on top. */
export function formFromMember(live: Member): ProfileForm {
  const { answers: draftAnswers, ...draft } = live.profileDraft ?? {};
  const m = { ...live, ...draft };
  const answers: Record<string, string> = {};
  for (const a of live.answers ?? []) answers[a.questionId] = a.answer ?? "";
  for (const a of draftAnswers ?? []) answers[a.questionId] = a.answer;
  return {
    fullName: m.fullName ?? "",
    headline: m.headline ?? "",
    company: m.company ?? "",
    chapterId: m.chapterId ?? "",
    sectorId: m.sectorId ?? "",
    bio: m.bio ?? "",
    interests: (m.interests ?? []).join(", "),
    travelCities: (m.travelCities ?? []).join(", "),
    avatarUrl: m.avatarUrl ?? "",
    linkedinUrl: m.linkedinUrl ?? "",
    joinedYear: m.joinedYear ? String(m.joinedYear) : "",
    answers,
  };
}

/** Labels for the status of a benefit the member offers. */
export const statusLabel: Record<ContentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  scheduled: "Scheduled",
  published: "Live",
  archived: "Archived",
  rejected: "Not approved",
};
