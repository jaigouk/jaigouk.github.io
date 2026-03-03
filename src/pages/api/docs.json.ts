import { getCollection } from "astro:content";
import { shouldShowContent } from "@/utils/markdown";

export async function GET() {
  try {
    const docs = await getCollection("docs");
    const isDev = import.meta.env.DEV;
    const visibleDocs = docs
      .filter((doc) => {
        return shouldShowContent(doc, isDev);
      })
      .map((doc) => ({
        id: doc.id,
        title: doc.data.title,
        description: doc.data.description || "",
        url: `/docs/${doc.id}`,
        type: "docs" as const,
        tags: [doc.data.category || "General"],
        category: doc.data.category || "General",
        version: doc.data.version || "1.0.0",
        order: doc.data.order || 0,
        lastModified: doc.data.lastModified?.toISOString(),
      }));

    return new Response(JSON.stringify(visibleDocs), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch docs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
