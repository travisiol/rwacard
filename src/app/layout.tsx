import type { Metadata, Viewport } from "next";
import { Figtree, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

// Two faces, two jobs: Figtree 500 for every display line and control label,
// Instrument Sans 400 for body copy. globals.css reads them through
// --font-display / --font-body.
const figtree = Figtree({
  subsets: ["latin"],
  weight: "500",
  display: "swap",
  variable: "--font-figtree",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} | ${site.tagline}`,
  description: site.description,
  openGraph: {
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} | ${site.tagline}`,
    description: site.description,
  },
};

export const viewport: Viewport = {
  themeColor: "#020202",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${instrumentSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
