import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/page-metadata";
import { InforumPublic } from "./InforumPublic";

export function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata("inforum");
}

export default function InforumPage() {
  return <InforumPublic />;
}
