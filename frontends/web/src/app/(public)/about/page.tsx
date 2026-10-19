import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/page-metadata";
import { AboutContent } from "./AboutContent";

export function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata("about");
}

export default function AboutPage() {
  return <AboutContent />;
}
