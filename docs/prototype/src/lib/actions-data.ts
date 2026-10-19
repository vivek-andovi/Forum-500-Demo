import { Eye, CheckCircle2, FileSignature, CreditCard, ClipboardList } from "lucide-react";

export type ActionType = "review" | "approve" | "sign" | "pay" | "fill";

export type ActionItem = {
  id: string;
  type: ActionType;
  title: string;
  detail: string;
  context: string;
  due: string;
  amount?: string;
};

export const typeMeta: Record<ActionType, { label: string; icon: typeof Eye; cta: string }> = {
  review: { label: "Review", icon: Eye, cta: "Review" },
  approve: { label: "Approve", icon: CheckCircle2, cta: "Approve" },
  sign: { label: "Sign", icon: FileSignature, cta: "Sign" },
  pay: { label: "Pay", icon: CreditCard, cta: "Pay now" },
  fill: { label: "Fill", icon: ClipboardList, cta: "Complete" },
};

export const initialActions: ActionItem[] = [
  {
    id: "a1",
    type: "pay",
    title: "Annual membership renewal 2027",
    detail: "Your Forum500 membership renews on 1 January. Settle by card to keep your chapter access uninterrupted.",
    context: "Membership",
    due: "Due 14 Dec",
    amount: "£2,400",
  },
  {
    id: "a2",
    type: "pay",
    title: "Host contribution — New York Autumn Salon",
    detail: "Shared catering contribution for the salon you are co-hosting at Casa Cipriani.",
    context: "Events",
    due: "Due 20 Sep",
    amount: "$850",
  },
  {
    id: "a3",
    type: "pay",
    title: "Sponsorship — Forum Radio season three",
    detail: "Your pledged sponsorship of the next Forum Radio season.",
    context: "Media",
    due: "Due 30 Sep",
    amount: "$5,000",
  },
  {
    id: "a4",
    type: "review",
    title: "Draft interview for the Member Directory",
    detail: "Read the edited version of your five answers before it is published to the directory.",
    context: "Membership",
    due: "Due 12 Sep",
  },
  {
    id: "a5",
    type: "review",
    title: "In:Forum article proof — 'The Quiet Capital'",
    detail: "Final proof of your piece before it goes to the In:Forum editors.",
    context: "Media",
    due: "Due 18 Sep",
  },
  {
    id: "a6",
    type: "approve",
    title: "Guest list for London Winter Dinner",
    detail: "Twelve members and four guests have requested places. Approve the final list.",
    context: "Events",
    due: "Due 10 Sep",
  },
  {
    id: "a7",
    type: "approve",
    title: "Introduction request from Priya Raman",
    detail: "Priya has asked to be introduced to you through Simon.",
    context: "Communications",
    due: "Due 9 Sep",
  },
  {
    id: "a8",
    type: "sign",
    title: "Member code of conduct 2026",
    detail: "Annual acknowledgement of the Forum's discretion and conduct principles.",
    context: "Membership",
    due: "Due 30 Sep",
  },
  {
    id: "a9",
    type: "sign",
    title: "Benefit partner agreement — Plotify",
    detail: "Counter-sign the terms for the 25% Plotify membership offer you are extending to members.",
    context: "Benefits",
    due: "Due 22 Sep",
  },
  {
    id: "a10",
    type: "fill",
    title: "Travel plans for the next six months",
    detail: "Tell us which chapter cities you will be visiting so we can connect you locally.",
    context: "Membership",
    due: "Due 25 Sep",
  },
  {
    id: "a11",
    type: "fill",
    title: "Dietary and access preferences",
    detail: "Used for every dinner and salon you attend.",
    context: "Events",
    due: "Due 25 Sep",
  },
];
