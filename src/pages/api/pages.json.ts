import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { shouldShowContent } from "@/utils/markdown";

export const GET: APIRoute = async () => {
  try {
    const pages = await getCollection("pages");
    const isDev = import.meta.env.DEV;
    const visiblePages = pages.filter((page: any) => {
      return shouldShowContent(page, isDev);
    });

    const result = visiblePages.map((page: any) => ({
      id: page.id,
      title: page.data.title,
      description: page.data.description || "",
      url: `/${page.id}`,
      type: "page" as const,
      lastModified: page.data.lastModified?.toISOString(),
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch pages" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
