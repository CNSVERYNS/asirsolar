import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { publicCrawlerRules } from "@/lib/crawlers";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: publicCrawlerRules,
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
