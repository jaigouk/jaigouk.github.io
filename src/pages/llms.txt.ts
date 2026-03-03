import type { APIRoute } from "astro";
import { siteConfig } from "../config";

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE || siteConfig.site;

  const llmsTxt = `# ${siteConfig.title}

> ${siteConfig.description}

This site is built with Astro and contains a blog with posts about technology, development, and various topics.

## Site Information

- **Site**: ${siteUrl}
- **Author**: ${siteConfig.author}
- **Language**: ${siteConfig.language}
- **RSS Feed**: ${siteUrl}rss.xml
- **Sitemap**: ${siteUrl}sitemap.xml

## Content Structure

The site contains:
- Blog posts at /posts/
- Static pages (about, etc.)
- Tag-based organization
- Reading time and word count for posts

## Features

- Markdown content with MDX support
- Image optimization and galleries
- Table of contents generation
- Search functionality
- Tag system
- RSS feed
- Responsive design

## Technical Details

- Framework: Astro
- Styling: Tailwind CSS
- Content: Markdown/MDX files
- Deployment: Netlify

For more information, visit ${siteUrl}about or contact ${siteConfig.author}.
`;

  return new Response(llmsTxt, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400", // Cache for 24 hours
    },
  });
};
