import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

// Recursively list all files under src/content
function listAllFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const entry of entries) {
    // Skip Obsidian internals
    if (entry.name === '.obsidian') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listAllFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

export const GET: APIRoute = async () => {
  try {
    const contentRoot = path.join(process.cwd(), 'src', 'content');
    const files = listAllFiles(contentRoot)
      .filter((p) => !p.includes(`${path.sep}bases${path.sep}`))
      .map((p) => {
        const base = path.basename(p);
        if (base.toLowerCase().endsWith('.md')) {
          // Remove .md to match Obsidian “file name” display for notes
          return base.slice(0, -3);
        }
        return base; // keep extension for assets (png, wav, pdf, etc.)
      })
      .sort((a, b) => a.localeCompare(b));

    // Return as a simple array of names (duplicates allowed)
    return new Response(JSON.stringify(files), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed to enumerate files' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


