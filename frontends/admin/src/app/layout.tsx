import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const karla = Karla({ subsets: ["latin"], variable: "--font-karla", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Forum500 Admin", template: "%s · Forum500 Admin" },
  description: "Forum500 administration portal",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
