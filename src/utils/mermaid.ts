/**
 * Optimized Mermaid utility with lazy loading, caching, and performance improvements
 */

import mermaid from "mermaid";

// Mermaid configuration
const mermaidConfig = {
  startOnLoad: false,
  securityLevel: "loose" as const,
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
  },
};

// Cache for rendered diagrams to avoid re-rendering on theme changes
const diagramCache = new Map<string, { svg: string; theme: string }>();

// Intersection Observer for lazy loading
let intersectionObserver: IntersectionObserver | null = null;

// Initialize Mermaid with current theme
function initializeMermaid(): void {
  const isDark = document.documentElement.classList.contains("dark");
  const theme = isDark ? "dark" : "default";

  mermaid.initialize({
    ...mermaidConfig,
    theme: theme,
  });
}

// Create intersection observer for lazy loading
function createIntersectionObserver(): IntersectionObserver {
  if (intersectionObserver) {
    return intersectionObserver;
  }

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const diagram = entry.target as HTMLElement;
          renderDiagram(diagram);
          intersectionObserver?.unobserve(diagram);
        }
      });
    },
    {
      rootMargin: "50px", // Start loading 50px before entering viewport
      threshold: 0.1,
    }
  );

  return intersectionObserver;
}

// Render a single diagram with caching
async function renderDiagram(diagram: HTMLElement): Promise<void> {
  const source = diagram.getAttribute("data-mermaid-source");
  if (!source) return;

  const decodedSource = decodeURIComponent(source);
  const currentTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "default";
  const cacheKey = `${decodedSource}-${currentTheme}`;

  // Check cache first
  if (diagramCache.has(cacheKey)) {
    const cached = diagramCache.get(cacheKey)!;
    const contentDiv = diagram.querySelector(".mermaid-diagram-content");
    if (contentDiv) {
      contentDiv.innerHTML = cached.svg;
    }
    return;
  }

  // Show loading state
  const contentDiv = diagram.querySelector(".mermaid-diagram-content");
  if (contentDiv) {
    contentDiv.innerHTML = `
      <div class="mermaid-loading-skeleton">
        <div class="animate-pulse bg-primary-100 dark:bg-primary-800 rounded h-32 flex items-center justify-center">
          <div class="text-primary-500 dark:text-primary-400 text-sm">Loading diagram...</div>
        </div>
      </div>
    `;
  }

  try {
    // Initialize Mermaid with current theme
    initializeMermaid();

    const diagramId = `mermaid-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const { svg } = await mermaid.render(diagramId, decodedSource);

    // Cache the rendered diagram
    diagramCache.set(cacheKey, { svg, theme: currentTheme });

    // Insert the rendered SVG
    if (contentDiv) {
      contentDiv.innerHTML = svg;
    }
  } catch (error) {
    if (contentDiv) {
      contentDiv.innerHTML = `
        <div class="p-4 border border-red-200 dark:border-red-800 rounded bg-red-50 dark:bg-red-900/20">
          <p class="text-red-600 dark:text-red-400 text-sm">Diagram rendering failed</p>
          <details class="mt-2">
            <summary class="text-red-500 dark:text-red-400 text-xs cursor-pointer">Show source</summary>
            <pre class="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">${decodedSource}</pre>
          </details>
        </div>
      `;
    }
  }
}

// Render all diagrams with lazy loading
async function renderAllDiagrams(): Promise<void> {
  const diagrams = document.querySelectorAll(
    ".mermaid-diagram[data-mermaid-source]"
  );

  if (diagrams.length === 0) {
    return;
  }

  // Initialize Mermaid
  initializeMermaid();

  // Set up intersection observer for lazy loading
  const observer = createIntersectionObserver();

  diagrams.forEach((diagram) => {
    observer.observe(diagram);
  });
}

// Handle theme changes with caching
function handleThemeChange(): void {
  const diagrams = document.querySelectorAll(
    ".mermaid-diagram[data-mermaid-source]"
  );
  const currentTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "default";

  diagrams.forEach((diagram) => {
    const source = diagram.getAttribute("data-mermaid-source");
    if (!source) return;

    const decodedSource = decodeURIComponent(source);
    const cacheKey = `${decodedSource}-${currentTheme}`;

    // Check if we have a cached version for this theme
    if (diagramCache.has(cacheKey)) {
      const cached = diagramCache.get(cacheKey)!;
      const contentDiv = diagram.querySelector(".mermaid-diagram-content");
      if (contentDiv) {
        contentDiv.innerHTML = cached.svg;
      }
    } else {
      // Re-render if no cache available
      renderDiagram(diagram as HTMLElement);
    }
  });
}

// Clear cache (useful for development)
function clearCache(): void {
  diagramCache.clear();
}

// Initialize Mermaid when DOM is ready
function initializeMermaidOnLoad(): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAllDiagrams);
  } else {
    renderAllDiagrams();
  }
}

// Export functions for global access
export {
  initializeMermaid,
  renderAllDiagrams,
  handleThemeChange,
  initializeMermaidOnLoad,
  clearCache,
};

// Make functions globally available for Swup compatibility
if (typeof window !== "undefined") {
  (window as any).initializeMermaid = renderAllDiagrams;
  (window as any).handleMermaidThemeChange = handleThemeChange;
  (window as any).clearMermaidCache = clearCache;
}
