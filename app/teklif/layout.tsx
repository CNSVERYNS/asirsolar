import type { Metadata } from "next";
import "./quote.css";
export const metadata: Metadata = {
  title: "Size özel teklif · Asır Solar", description: "Asır Solar özel teklif sayfası.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  referrer: "no-referrer", alternates: { canonical: null }, openGraph: null, twitter: null,
};
export default function QuoteLayout({ children }: { children: React.ReactNode }) { return children; }
