import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import "./globals.css";
import "./brand.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { siteConfig, defaultOgImage } from "@/lib/site";
import { SiteFrame } from "@/components/SiteFrame";
import { JsonLd } from "@/components/JsonLd";
import { businessGraph } from "@/lib/structured-data";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.defaultTitle,
    template: siteConfig.titleTemplate,
  },
  description: siteConfig.defaultDescription,
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION?.trim() || undefined },
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: siteConfig.name,
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    url: siteConfig.url,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    images: [defaultOgImage.url],
  },
  icons: {
    icon: [
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#172b24",
  // Lets fixed-position UI (cookie banner) read env(safe-area-inset-*) to
  // clear the home-indicator area on notched iPhones, instead of that
  // env() silently resolving to 0.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="tr" className={archivo.variable}>
      <body>
        <a href="#main" className="skip-link">
          İçeriğe geç
        </a>
        <SiteFrame header={<><JsonLd data={businessGraph} /><Header /></>} footer={<Footer />} notice={<CookieBanner />}>{children}</SiteFrame>
      </body>
    </html>
  );
}
