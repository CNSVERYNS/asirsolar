import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  outputFileTracingIncludes: { "/admin/*": ["./supabase/migrations/*.sql"], "/api/*": ["./supabase/migrations/*.sql"] },
  outputFileTracingExcludes: { "/*": ["./.local-tools/**", "./.local-backups/**", "./.data/**", "./.env*", "./.git/**", "./.claude/**"] },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Keep cached pages/crawlers using the former icon URLs on the company logo.
    return [
      { source: "/favicon.svg", destination: "/icon.png", permanent: true },
      { source: "/icon-32.png", destination: "/favicon.ico", permanent: true },
      { source: "/apple-touch-icon.png", destination: "/apple-icon.png", permanent: true },
    ];
  },
  // Page HTML was shipping with only `s-maxage` (no `max-age`), which
  // only constrains shared/CDN caches — a browser (especially an in-app
  // WebView reusing the same tab) is left to its own heuristics and can
  // hold on to a stale copy across visits. Every real page fix in this
  // project ships as a new deploy, so page documents should never be
  // cached client-side; static assets under /_next/static are unaffected
  // (they're content-hashed and keep their own long-lived caching).
  async headers() {
    return [
      {
        // The image route validates visibility before allowing a cached image
        // to be reused, and must retain its own conditional-response headers.
        source: "/:path((?!api/projeler/gorseller/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/videos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
