import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Montserrat } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";
import { LANDING } from "@/config/copy";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });

/**
 * No share card and no OG result images: these are personal answers about sex,
 * death and money, and the results page is `noindex` (SPEC §2, §7.5).
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "The Taboo Test", template: "%s · The Taboo Test" },
  description: LANDING.intro,
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
