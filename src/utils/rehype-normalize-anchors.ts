import type { Root, Element } from 'hast';
import { visit } from 'unist-util-visit';

/**
 * Rehype plugin to normalize anchor link hrefs
 * Ensures anchor links like #Choose%20Your%20Workflow are converted to #choose-your-workflow
 */
export function rehypeNormalizeAnchors() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index: number | undefined, parent: any) => {
      if (node.tagName === 'a') {
        // Skip heading anchor links (created by rehypeAutolinkHeadings)
        // These have the 'anchor-link' class and shouldn't get wikilink styling
        const className = node.properties?.className;
        
        // Check for anchor-link class (array or string format)
        let hasAnchorLinkClass = false;
        if (Array.isArray(className)) {
          hasAnchorLinkClass = className.some((c: any) => 
            typeof c === 'string' && c.includes('anchor-link')
          );
        } else if (typeof className === 'string') {
          hasAnchorLinkClass = className.includes('anchor-link');
        }
        
        if (hasAnchorLinkClass) {
          return; // Skip this link - it's a heading anchor link
        }
        
        // Also check if parent is a heading element
        if (parent && typeof parent === 'object' && 'tagName' in parent) {
          const parentTag = String(parent.tagName || '').toLowerCase();
          if (/^h[1-6]$/.test(parentTag)) {
            return; // Skip this link - it's inside a heading
          }
        }
        
        // Get href from properties - could be string or array
        const hrefValue = node.properties?.href;
        let href: string | null = null;
        
        if (typeof hrefValue === 'string') {
          href = hrefValue;
        } else if (Array.isArray(hrefValue) && hrefValue.length > 0 && typeof hrefValue[0] === 'string') {
          href = hrefValue[0];
        }
        
        if (!href) return;
        
        // Handle same-page anchor links (href starts with #)
        if (href.startsWith('#') && href.length > 1) {
          // Final safety check: skip if parent is a heading
          if (parent && typeof parent === 'object' && 'tagName' in parent) {
            const parentTag = String(parent.tagName || '').toLowerCase();
            if (/^h[1-6]$/.test(parentTag)) {
              return; // Skip - this is a heading anchor link
            }
          }
          
          let anchorText = href.substring(1);
          
          // Always normalize - decode URL-encoded characters if present
          try {
            const decoded = decodeURIComponent(anchorText);
            // Only use decoded if it's different (was actually encoded)
            if (decoded !== anchorText) {
              anchorText = decoded;
            }
          } catch {
            // If decoding fails, use as-is
          }
          
          // Create slug from decoded/normalized text
          const anchorSlug = anchorText
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
          
          // Ensure properties exists
          if (!node.properties) {
            node.properties = {};
          }
          
          // Set the normalized href
          const normalizedHref = `#${anchorSlug}`;
          node.properties.href = normalizedHref;
          
          // CRITICAL: ALWAYS add wikilink class
          // Preserve existing className if present (from remark), then add wikilink
          let existingClasses: string[] = [];
          if (node.properties.className) {
            if (Array.isArray(node.properties.className)) {
              existingClasses = node.properties.className.filter((c): c is string => typeof c === 'string');
            } else if (typeof node.properties.className === 'string') {
              existingClasses = node.properties.className.split(/\s+/).filter(Boolean);
            }
          }
          
          // Add wikilink if not already present
          if (!existingClasses.includes('wikilink')) {
            existingClasses.push('wikilink');
          }
          
          // Set as string (required for HTML)
          node.properties.className = existingClasses.join(' ');
        }
      }
    });
  };
}

