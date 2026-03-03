import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { shouldShowPost } from "@/utils/markdown";

export const GET: APIRoute = async () => {
  try {
    // Get all posts
    const posts = await getCollection("posts");

    // Filter visible posts based on environment
    const isDev = import.meta.env.DEV;
    const visiblePosts = posts.filter((post: any) =>
      shouldShowPost(post, isDev)
    );

    // Map to command palette format
    const commandPaletteData = visiblePosts.map((post: any) => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      url: `/posts/${post.id}`,
      type: "post" as const,
      date: post.data.date,
      tags: post.data.tags || [],
    }));

    // Sort by date (newest first)
    commandPaletteData.sort(
      (a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return new Response(JSON.stringify(commandPaletteData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400", // Cache for 1 hour, stale for 24 hours
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch posts" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
