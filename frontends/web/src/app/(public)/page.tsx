import type { Metadata } from "next";
import { publicPageMetadata } from "@/lib/page-metadata";
import { HomeContent } from "./HomeContent";

export function generateMetadata(): Promise<Metadata> {
  return publicPageMetadata("home");
}

export default function HomePage() {
  return <HomeContent />;
}
