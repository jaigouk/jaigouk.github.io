import type { APIRoute } from "astro";
import { siteConfig } from "../config";

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE || siteConfig.site;

  const robotsTxt = `User-agent: *
Allow: /

# Sitemaps
Sitemap: ${siteUrl}sitemap.xml

# RSS Feed
# ${siteUrl}rss.xml

# Disallow common non-content paths
Disallow: /api/
Disallow: /_astro/
Disallow: /_image/
Disallow: /admin/
Disallow: /.well-known/

# Allow search engines to crawl images
Allow: /posts/attachments/
Allow: /pages/attachments/

# Crawl delay (optional)
# Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
};
