import type {
  Post,
  Page,
  Project,
  Docs,
  SEOData,
  OpenGraphImage,
} from "@/types";
import siteConfig from "@/config";
import {
  getFallbackOGImage,
  optimizePostImagePath,
  optimizeContentImagePath,
} from "./images";

// Helper function to get default OG image
function getDefaultOGImage(): OpenGraphImage {
  return {
    url: "/open-graph.png",
    alt: siteConfig.defaultOgImageAlt,
    width: 1200,
    height: 630,
  };
}

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

// Generate SEO data for posts
export function generatePostSEO(post: Post, url: string): SEOData {
  const { title, description, image, imageOG, tags, date } = post.data;

  let ogImage: OpenGraphImage | undefined;

  if (image && imageOG) {
    // Extract image path from Obsidian bracket syntax if needed
    const imagePath = extractImagePath(image);

    // Handle both local and external image paths
    let imageUrl: string;
    if (imagePath.startsWith("http")) {
      // External URL
      imageUrl = imagePath;
    } else {
      // Use optimizePostImagePath for proper path resolution
      // Pass post.id as both postSlug and postId for folder-based posts
      const optimizedPath = optimizePostImagePath(
        imagePath,
        post.id,
        post.id
      );
      imageUrl = `${siteConfig.site}${optimizedPath}`;
    }
    ogImage = {
      url: imageUrl,
      alt: post.data.imageAlt || `Featured image for post: ${title}`,
      width: 1200,
      height: 630,
    };
  } else {
    // Use default OG image
    ogImage = getDefaultOGImage();
    ogImage = {
      ...ogImage,
      url: `${siteConfig.site}${ogImage.url}`,
    };
  }

  return {
    title: `${title} | ${siteConfig.title}`,
    description: description || `Post: ${title}`,
    canonical: url,
    ogImage,
    ogType: "article",
    publishedTime: date.toISOString(),
    modifiedTime: date.toISOString(),
    tags: tags?.filter((tag) => tag !== null) || undefined,
    noIndex: post.data.noIndex || false, // Add this line
  };
}

// Generate SEO data for pages
export function generatePageSEO(page: Page, url: string): SEOData {
  const { title, description, image } = page.data;

  let ogImage: OpenGraphImage | undefined;

  if (image) {
    // Extract image path from Obsidian bracket syntax if needed
    const imagePath = extractImagePath(image);

    // Handle both local and external image paths
    let imageUrl: string;
    if (imagePath.startsWith("http")) {
      // External URL
      imageUrl = imagePath;
    } else {
      // Use optimizeContentImagePath for proper path resolution
      const optimizedPath = optimizeContentImagePath(
        imagePath,
        "pages",
        page.id,
        page.id
      );
      imageUrl = `${siteConfig.site}${optimizedPath}`;
    }
    ogImage = {
      url: imageUrl,
      alt: page.data.imageAlt || `Featured image for page: ${title}`,
      width: 1200,
      height: 630,
    };
  } else {
    // Use default OG image
    ogImage = getDefaultOGImage();
    ogImage = {
      ...ogImage,
      url: `${siteConfig.site}${ogImage.url}`,
    };
  }

  return {
    title: `${title} | ${siteConfig.title}`,
    description: description || "",
    canonical: url,
    ogImage,
    ogType: "website",
    noIndex: page.data.noIndex || false, // Add this line
  };
}

// Generate SEO data for projects
export function generateProjectSEO(project: Project, url: string): SEOData {
  const { title, description, image, date } = project.data;

  let ogImage: OpenGraphImage | undefined;

  if (image) {
    // Extract image path from Obsidian bracket syntax if needed
    const imagePath = extractImagePath(image);

    // Handle both local and external image paths
    let imageUrl: string;
    if (imagePath.startsWith("http")) {
      // External URL
      imageUrl = imagePath;
    } else {
      // Use optimizeImagePath for proper path resolution
      const optimizedPath = optimizeContentImagePath(
        imagePath,
        "projects",
        project.id,
        project.id
      );
      imageUrl = `${siteConfig.site}${optimizedPath}`;
    }
    ogImage = {
      url: imageUrl,
      alt: project.data.imageAlt || `Featured image for project: ${title}`,
      width: 1200,
      height: 630,
    };
  } else {
    // Use default OG image
    ogImage = getDefaultOGImage();
    ogImage = {
      ...ogImage,
      url: `${siteConfig.site}${ogImage.url}`,
    };
  }

  return {
    title: `${title} | ${siteConfig.title}`,
    description: description || `Project: ${title}`,
    canonical: url,
    ogImage,
    ogType: "article",
    publishedTime: date.toISOString(),
    modifiedTime: date.toISOString(),
    tags: project.data.categories?.filter((cat) => cat !== null) || undefined,
    noIndex: project.data.noIndex || false,
  };
}

// Generate SEO data for documentation
export function generateDocumentationSEO(
  documentation: Docs,
  url: string
): SEOData {
  const { title, description, image, category, version } = documentation.data;

  let ogImage: OpenGraphImage | undefined;

  if (image) {
    // Extract image path from Obsidian bracket syntax if needed
    const imagePath = extractImagePath(image);

    let imageUrl: string;
    if (imagePath.startsWith("http")) {
      // External URL
      imageUrl = imagePath;
    } else {
      // Use optimizeImagePath for proper path resolution
      const optimizedPath = optimizeContentImagePath(
        imagePath,
        "documentation",
        documentation.id,
        documentation.id
      );
      imageUrl = `${siteConfig.site}${optimizedPath}`;
    }
    ogImage = {
      url: imageUrl,
      alt:
        documentation.data.imageAlt ||
        `Featured image for documentation: ${title}`,
      width: 1200,
      height: 630,
    };
  } else {
    // Use default OG image
    ogImage = getDefaultOGImage();
    ogImage = {
      ...ogImage,
      url: `${siteConfig.site}${ogImage.url}`,
    };
  }

  return {
    title: `${title} | ${siteConfig.title}`,
    description: description || `Documentation: ${title}`,
    canonical: url,
    ogImage,
    ogType: "article",
    articleSection: category || undefined,
    keywords: version
      ? [`${category || "Documentation"}`, `version ${version}`]
      : [category || "Documentation"],
    noIndex: documentation.data.noIndex || false,
  };
}

// Generate SEO data for homepage
export function generateHomeSEO(url: string): SEOData {
  let ogImage: OpenGraphImage | undefined;

  // Always use fallback image for homepage
  ogImage = getDefaultOGImage();
  ogImage = {
    ...ogImage,
    url: `${siteConfig.site}${ogImage.url}`,
  };

  return {
    title: siteConfig.title,
    description: siteConfig.description,
    canonical: normalizeCanonicalUrl(url),
    ogImage,
    ogType: "website",
  };
}

// Generate SEO data for tag pages
export function generateTagSEO(
  tag: string,
  site: string,
  currentPage?: number
): SEOData {
  const title = `Posts tagged with "${tag}" | ${siteConfig.title}`;
  const description = `Browse all posts tagged with ${tag} on ${siteConfig.title}`;
  const baseUrl = `${site}/posts/tag/${tag}`;
  const canonical =
    currentPage && currentPage > 1 ? `${baseUrl}/${currentPage}` : baseUrl;

  return {
    title,
    description,
    canonical,
    robots: "index, follow",
    ogType: "website",
    ogImage: getDefaultOGImage(),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image: getDefaultOGImage().url,
    },
  };
}

// Generate SEO data for posts listing pages
export function generatePostsListSEO(
  site: string,
  currentPage?: number
): SEOData {
  const title =
    currentPage && currentPage > 1
      ? `Posts - Page ${currentPage} | ${siteConfig.title}`
      : `Posts | ${siteConfig.title}`;
  const description = `Browse all posts on ${siteConfig.title}`;
  const canonical =
    currentPage && currentPage > 1
      ? `${site}/posts/${currentPage}`
      : `${site}/posts`;

  return {
    title,
    description,
    canonical,
    robots: "index, follow",
    ogType: "website",
    ogImage: getDefaultOGImage(),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image: getDefaultOGImage().url,
    },
  };
}

// Normalize canonical URLs to prevent duplicates
export function normalizeCanonicalUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove trailing slash unless it's the root
    if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.toString();
  } catch {
    return url;
  }
}

// Generate structured data (JSON-LD)
export function generateStructuredData(
  type: "blog" | "article" | "website",
  data: any
) {
  const baseData = {
    "@context": "https://schema.org",
    "@type":
      type === "blog" ? "Blog" : type === "article" ? "BlogPosting" : "WebSite",
    ...data,
  };

  return JSON.stringify(baseData);
}

// Generate meta tags HTML
export function generateMetaTags(seoData: SEOData): string {
  const tags = [
    `<title>${seoData.title}</title>`,
    `<meta name="description" content="${seoData.description}">`,
    seoData.robots && `<meta name="robots" content="${seoData.robots}">`,
    `<link rel="canonical" href="${seoData.canonical}">`,

    // Open Graph
    `<meta property="og:title" content="${seoData.title}">`,
    `<meta property="og:description" content="${seoData.description}">`,
    `<meta property="og:url" content="${seoData.canonical}">`,
    `<meta property="og:type" content="${seoData.ogType}">`,
    `<meta property="og:site_name" content="${siteConfig.title}">`,

    // Twitter Card
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${seoData.title}">`,
    `<meta name="twitter:description" content="${seoData.description}">`,
  ];

  // Add Open Graph image
  if (seoData.ogImage) {
    tags.push(
      `<meta property="og:image" content="${seoData.ogImage.url}">`,
      `<meta property="og:image:alt" content="${seoData.ogImage.alt}">`,
      `<meta property="og:image:width" content="${seoData.ogImage.width}">`,
      `<meta property="og:image:height" content="${seoData.ogImage.height}">`,
      `<meta name="twitter:image" content="${seoData.ogImage.url}">`,
      `<meta name="twitter:image:alt" content="${seoData.ogImage.alt}">`
    );
  }

  // Add article-specific tags
  if (seoData.ogType === "article") {
    if (seoData.publishedTime) {
      tags.push(
        `<meta property="article:published_time" content="${seoData.publishedTime}">`
      );
    }
    if (seoData.modifiedTime) {
      tags.push(
        `<meta property="article:modified_time" content="${seoData.modifiedTime}">`
      );
    }
    if (seoData.tags) {
      seoData.tags.forEach((tag) => {
        tags.push(`<meta property="article:tag" content="${tag}">`);
      });
    }
    if (seoData.articleSection) {
      tags.push(
        `<meta property="article:section" content="${seoData.articleSection}">`
      );
    }
  }

  // Add keywords
  if (seoData.keywords) {
    tags.push(`<meta name="keywords" content="${seoData.keywords}">`);
  }

  // Twitter meta tags

  return tags.filter(Boolean).join("\n");
}

// Check if page should be excluded from sitemap
export function shouldExcludeFromSitemap(slug: string): boolean {
  if (!slug) return false;

  const excludePatterns = ["404", "sitemap", "rss", "api/"];

  return excludePatterns.some((pattern) => slug.includes(pattern));
}

// Generate meta description
export function generateMetaDescription(
  content: string,
  maxLength: number = 160
): string {
  if (!content) return "";

  // Remove markdown formatting and HTML tags
  const cleanContent = content
    .replace(/#+\s/g, "") // Remove headers
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold
    .replace(/\*(.*?)\*/g, "$1") // Remove italic
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Remove links, keep text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }

  // Truncate at word boundary
  const truncated = cleanContent.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + "...";
  }

  return truncated + "...";
}

// Generate robots meta tag
export function generateRobotsMeta(
  index: boolean = true,
  follow: boolean = true
): string {
  const directives = [];

  if (!index) directives.push("noindex");
  if (!follow) directives.push("nofollow");

  if (directives.length === 0) {
    return '<meta name="robots" content="index, follow">';
  }

  return `<meta name="robots" content="${directives.join(", ")}">`;
}

// Create breadcrumb structured data
export function generateBreadcrumbs(
  path: Array<{ name: string; url: string }>
): any {
  const items = path.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

// Validate SEO data
export function validateSEOData(seoData: SEOData): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (seoData.title.length > 60) {
    warnings.push("Title is longer than 60 characters");
  }

  if (seoData.title.length < 30) {
    warnings.push("Title is shorter than 30 characters");
  }

  if (seoData.description.length > 160) {
    warnings.push("Description is longer than 160 characters");
  }

  if (seoData.description.length < 120) {
    warnings.push("Description is shorter than 120 characters");
  }

  if (!seoData.ogImage) {
    warnings.push("No Open Graph image provided");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

// Validate structured data (JSON-LD)
export function validateStructuredData(data: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data["@context"]) {
    errors.push("Missing @context property");
  } else if (data["@context"] !== "https://schema.org") {
    errors.push("Invalid @context value, should be https://schema.org");
  }

  if (!data["@type"]) {
    errors.push("Missing @type property");
  }

  // Validate based on type
  if (data["@type"] === "Blog" || data["@type"] === "WebSite") {
    if (!data.name) errors.push("Missing name property");
    if (!data.description) errors.push("Missing description property");
    if (!data.url) errors.push("Missing url property");
  }

  if (data["@type"] === "BlogPosting") {
    if (!data.headline) errors.push("Missing headline property");
    if (!data.datePublished) errors.push("Missing datePublished property");
    if (!data.author) errors.push("Missing author property");
  }

  // Validate author structure
  if (data.author && typeof data.author === "object") {
    if (!data.author["@type"]) errors.push("Missing author @type");
    if (!data.author.name) errors.push("Missing author name");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
