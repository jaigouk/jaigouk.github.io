import { getCollection } from "astro:content";
import { shouldShowContent } from "@/utils/markdown";

export async function GET() {
  const isDev = import.meta.env.DEV;
  const projects = await getCollection("projects");

  const visibleProjects = projects
    .filter((project) => shouldShowContent(project, isDev))
    .map((project) => ({
      id: project.id,
      title: project.data.title,
      description: project.data.description,
      url: `/projects/${project.id}`,
      type: "project" as const,
      tags: project.data.categories || [],
      date: project.data.date.toISOString(),
      status: project.data.status,
    }));

  return new Response(JSON.stringify(visibleProjects), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}
