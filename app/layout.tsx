import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Archivo } from "next/font/google";
import "./globals.css";
import "./brand.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieBanner } from "@/components/CookieBanner";
import { company } from "@/data/company";
import { siteConfig } from "@/lib/site";
import { SiteFrame } from "@/components/SiteFrame";

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
  alternates: { canonical: siteConfig.url },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: siteConfig.name,
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
    url: siteConfig.url,
    images: [{ url: "/images/stock/hero-farm.jpg", width: 2400, height: 1350 }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.defaultTitle,
    description: siteConfig.defaultDescription,
  },
  icons: {
    icon: [
      { url: "/images/brand/asir-logo.jpeg", type: "image/jpeg" },
    ],
    apple: "/images/brand/asir-logo.jpeg",
  },
};

export const viewport: Viewport = {
  themeColor: "#172b24",
  // Lets fixed-position UI (cookie banner) read env(safe-area-inset-*) to
  // clear the home-indicator area on notched iPhones, instead of that
  // env() silently resolving to 0.
  viewportFit: "cover",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: company.legalName,
  alternateName: company.brandName,
  description: siteConfig.defaultDescription,
  telephone: company.phoneDisplay,
  email: company.generalEmail,
  url: siteConfig.url,
  image: `${siteConfig.url}/images/stock/hero-farm.jpg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: company.address.line1,
    addressLocality: "Gebze",
    addressRegion: "Kocaeli",
    addressCountry: "TR",
  },
  areaServed: {
    "@type": "City",
    name: "Gebze / Kocaeli",
  },
  knowsAbout: [
    "Güneş enerjisi sistemleri",
    "Çatı tipi güneş paneli kurulumu",
    "Cephe tipi güneş paneli kurulumu",
    "Güneş enerjisi projelendirme ve mühendislik",
    "Elektrik altyapısı ve pano sistemleri",
    "Güneş enerjisi sistemleri bakım ve teknik destek",
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteFrame header={<Header />} footer={<Footer />} notice={<CookieBanner />}>{children}</SiteFrame>
      </body>
    </html>
  );
}
