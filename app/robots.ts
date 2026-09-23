import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: ["/", "/api/projeler/gorseller/"], disallow: ["/admin", "/api/", "/teklif/"] },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
