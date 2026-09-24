import { company } from "../data/company.ts";
import { services, type Service } from "../data/services.ts";
import { siteConfig } from "./site.ts";
import type { Graph, Place, Service as SchemaService, WithContext } from "schema-dts";
import { businessEvidence } from "../data/business-evidence.ts";
import { verifiedBusinessProperties } from "./schema-builders.ts";

export const organizationId = `${siteConfig.url}/#organization`;
export const websiteId = `${siteConfig.url}/#website`;
export const serviceArea: Place[] = [
  { "@type": "City", name: "Gebze" },
  { "@type": "AdministrativeArea", name: "Kocaeli" },
];

export function serviceSchema(service: Service): WithContext<SchemaService> {
  const url = `${siteConfig.url}/hizmetler/${service.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: service.title,
    serviceType: service.title,
    description: service.summary,
    url,
    provider: { "@id": organizationId },
    areaServed: serviceArea,
    availableChannel: { "@type": "ServiceChannel", serviceUrl: `${siteConfig.url}/iletisim` },
  };
}

export const businessGraph: Graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": organizationId,
      name: company.brandName,
      legalName: company.legalName,
      alternateName: company.secondaryBrand,
      description: siteConfig.defaultDescription,
      url: siteConfig.url,
      logo: `${siteConfig.url}/images/brand/asir-logo.jpeg`,
      image: `${siteConfig.url}/images/brand/asir-logo.jpeg`,
      telephone: company.phoneHref.replace("tel:", ""),
      email: company.generalEmail,
      address: {
        "@type": "PostalAddress",
        streetAddress: company.address.line1,
        addressLocality: "Gebze",
        addressRegion: "Kocaeli",
        addressCountry: "TR",
      },
      hasMap: company.address.mapsHref,
      ...verifiedBusinessProperties(businessEvidence),
      areaServed: serviceArea,
      contactPoint: company.emails.map(person => ({
        "@type": "ContactPoint", name: person.name, email: person.email,
        contactType: "Keşif ve proje görüşmesi", availableLanguage: "tr",
        url: `${siteConfig.url}/iletisim`,
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog", name: "Güneş enerjisi ve elektrik hizmetleri",
        itemListElement: services.map(service => ({
          "@type": "Offer", itemOffered: {
            "@type": "Service", "@id": `${siteConfig.url}/hizmetler/${service.slug}#service`,
            name: service.title, url: `${siteConfig.url}/hizmetler/${service.slug}`,
          },
        })),
      },
    },
    {
      "@type": "Organization", "@id": organizationId,
      name: company.brandName, legalName: company.legalName,
      url: siteConfig.url, logo: `${siteConfig.url}/images/brand/asir-logo.jpeg`,
      telephone: company.phoneHref.replace("tel:", ""), email: company.generalEmail,
    },
    {
      "@type": "WebSite", "@id": websiteId, name: company.brandName,
      url: siteConfig.url, inLanguage: "tr-TR", publisher: { "@id": organizationId },
    },
  ],
};
