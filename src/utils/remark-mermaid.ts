import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Code } from 'mdast';

/**
 * Remark plugin for processing Mermaid diagrams
 * 
 * This plugin detects code blocks with language "mermaid" and transforms them
 * into HTML containers with class "mermaid-diagram" that can be processed by
 * the client-side Mermaid library.
 * 
 * Follows the same pattern as existing plugins like remarkCallouts and remarkWikilinks.
 */

const remarkMermaid: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'code', (node: Code, index, parent) => {
      // Check if this is a mermaid code block
      if (node.lang !== 'mermaid') {
        return;
      }

      // Validate that we have content
      if (!node.value || typeof node.value !== 'string') {
        return;
      }

      // Create a unique ID for this diagram
      const diagramId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

      // Transform the code block into a mermaid diagram container
      const mermaidHtml: any = {
        type: 'html',
        value: `<div class="mermaid-diagram" data-mermaid-id="${diagramId}" data-mermaid-source="${encodeURIComponent(node.value)}">
          <div class="mermaid-diagram-content">
            <pre class="mermaid-diagram-source"><code>${node.value.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
          </div>
        </div>`
      };

      // Replace the code block with the mermaid container
      if (parent && typeof index === 'number') {
        parent.children.splice(index, 1, mermaidHtml);
      }
    });
  };
};

export default remarkMermaid;
