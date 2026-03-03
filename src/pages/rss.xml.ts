import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { siteConfig } from "../config";
import { shouldShowPost, sortPostsByDate } from "../utils/markdown";
import { optimizePostImagePath } from "../utils/images";

// Helper function to extract image path from Obsidian bracket syntax
function extractImagePath(image: string): string {
  if (!image || typeof image !== "string") return "";

  // Handle Obsidian bracket syntax: [[path/to/image.jpg]] (unquoted)
  if (image.startsWith("[[") && image.endsWith("]]")) {
    return image.slice(2, -2); // Remove [[ and ]]
  }

  // Handle quoted Obsidian bracket syntax: "[[path/to/image.jpg]]"
  if (image.startsWith('"[[') && image.endsWith(']]"')) {
    return image.slice(3, -3); // Remove "[[ and ]]"
  }

  // Return as-is for regular paths
  return image;
}

function getMimeTypeFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    default:
      // Default to WebP since sync-images.js converts images to WebP
      return "image/webp";
  }
}

// Helper function to normalize siteUrl - ensure it ends with a single slash
function normalizeSiteUrl(url: string): string {
  return url.replace(/\/+$/, '') + '/';
}

export async function GET() {
  // Get all posts
  const posts = await getCollection("posts");

  // Filter and sort posts based on environment (in dev, show all including drafts)
  const isDev = import.meta.env.DEV;
  const visiblePosts = posts.filter(
    (post) => shouldShowPost(post, isDev)
  );
  const sortedPosts = sortPostsByDate(visiblePosts);

  const siteUrl = normalizeSiteUrl(import.meta.env.SITE || siteConfig.site);

  return rss({
    title: siteConfig.title,
    description: siteConfig.description,
    site: siteUrl,
    items: sortedPosts.map((post) => {
      const postUrl = `${siteUrl}posts/${(post as any).id}/`;

      return {
        title: post.data.title,
        description: post.data.description || "",
        pubDate: post.data.date,
        link: postUrl,
        categories: post.data.tags || [],
        author: siteConfig.author,
        // Include image if available and marked for OG
        enclosure:
          post.data.image && post.data.imageOG
            ? {
                url: (() => {
                  const imagePath = extractImagePath(post.data.image);
                  if (typeof imagePath === "string" && imagePath.startsWith("http")) {
                    return imagePath;
                  }
                  // Use optimizePostImagePath to handle folder-based posts and WebP conversion
                  const optimizedPath = optimizePostImagePath(imagePath, (post as any).id, (post as any).id);
                  // optimizedPath always starts with /, so remove it since siteUrl already ends with /
                  return `${siteUrl}${optimizedPath.startsWith('/') ? optimizedPath.slice(1) : optimizedPath}`;
                })(),
                type: getMimeTypeFromPath(extractImagePath(post.data.image)),
                length: 0, // Length is optional
              }
            : undefined,
        customData: [
          post.data.targetKeyword &&
            `<keyword>${post.data.targetKeyword}</keyword>`,
          post.data.image &&
            `<image>${(() => {
              const imagePath = extractImagePath(post.data.image);
              if (typeof imagePath === "string" && imagePath.startsWith("http")) {
                return imagePath;
              }
              // Use optimizePostImagePath to handle folder-based posts and WebP conversion
              const optimizedPath = optimizePostImagePath(imagePath, (post as any).id, (post as any).id);
              // optimizedPath always starts with /, so remove it since siteUrl already ends with /
              return `${siteUrl}${optimizedPath.startsWith('/') ? optimizedPath.slice(1) : optimizedPath}`;
            })()}</image>`,
        ]
          .filter(Boolean)
          .join(""),
      };
    }),

    // RSS 2.0 extensions
    customData: `
      <language>${siteConfig.language}</language>
      <copyright>Copyright © ${new Date().getFullYear()} ${
      siteConfig.author
    }</copyright>
      <managingEditor>${siteConfig.author}</managingEditor>
      <webMaster>${siteConfig.author}</webMaster>
      <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
      <generator>Astro RSS</generator>
      <docs>https://www.rssboard.org/rss-specification</docs>
      <ttl>60</ttl>
    `,

    xmlns: {
      atom: "http://www.w3.org/2005/Atom",
      content: "http://purl.org/rss/1.0/modules/content/",
      dc: "http://purl.org/dc/elements/1.1/",
    },
  });
}
