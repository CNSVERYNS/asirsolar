// Apply private-path exclusions to every explicit bot group as well as '*'.
// Specific groups do not inherit the wildcard group's rules.
export const publicCrawlers = [
  "Googlebot", "Bingbot", "GPTBot", "OAI-SearchBot", "ChatGPT-User",
  "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot",
  "Perplexity-User", "Google-Extended",
];
export const publicCrawlerRules = ["*", ...publicCrawlers].map(userAgent => ({
  userAgent, allow: ["/", "/api/projeler/gorseller/"], disallow: ["/admin", "/api/", "/teklif/"],
}));
