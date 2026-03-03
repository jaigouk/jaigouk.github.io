import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Root, Text } from 'mdast';

/**
 * Remark plugin for processing inline Obsidian tags
 * 
 * Converts inline tags like #quick-start into clickable pill-style links
 * that match the theme's tag styling.
 * 
 * Pattern: #tag-name (must start with #, followed by alphanumeric, hyphens, underscores)
 * Tags are matched when they appear at word boundaries (start of text, after whitespace, or after punctuation)
 */

const remarkInlineTags: Plugin<[], Root> = () => {
  return (tree) => {
    visit(tree, 'text', (node: Text, index, parent) => {
      if (!parent || typeof index !== 'number') return;
      
      const text = node.value;
      // Match #tag-name pattern
      // Tag must start with #, followed by word characters, hyphens, or underscores
      // Must be at word boundary (start of string, after whitespace, or after punctuation)
      const tagPattern = /(?:^|[\s\p{P}])#([\w-]+)/gu;
      const matches: Array<{ tag: string; start: number; end: number; hasPrefix: boolean }> = [];
      
      let match;
      while ((match = tagPattern.exec(text)) !== null) {
        const tag = match[1];
        const fullMatch = match[0]; // Includes the # and any preceding character
        const hasPrefix = fullMatch.length > tag.length + 1; // Has a character before #
        const start = match.index + (hasPrefix ? 1 : 0); // Skip prefix char if present
        const end = start + tag.length + 1; // +1 for the #
        
        matches.push({
          tag,
          start,
          end,
          hasPrefix
        });
      }
      
      // If no matches, continue
      if (matches.length === 0) return;
      
      // Build new children array with text nodes and HTML nodes for tags
      const newChildren: any[] = [];
      let lastIndex = 0;
      
      matches.forEach(({ tag, start, end, hasPrefix }) => {
        // Add text before the tag (including any prefix character)
        if (start > lastIndex) {
          const beforeText = text.slice(lastIndex, start);
          if (beforeText) {
            newChildren.push({
              type: 'text',
              value: beforeText
            });
          }
        }
        
        // Create HTML node for the tag link
        const tagHtml = {
          type: 'html',
          value: `<a href="/posts/tag/${encodeURIComponent(tag)}" class="text-xs text-primary-600 dark:text-primary-300 bg-primary-100 dark:bg-primary-800 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-700 transition-colors hover:bg-highlight-100 dark:hover:bg-highlight-800">#${tag}</a>`
        };
        
        newChildren.push(tagHtml);
        lastIndex = end;
      });
      
      // Add remaining text after the last tag
      if (lastIndex < text.length) {
        const afterText = text.slice(lastIndex);
        if (afterText) {
          newChildren.push({
            type: 'text',
            value: afterText
          });
        }
      }
      
      // Replace the text node with the new children
      if (newChildren.length > 0) {
        parent.children.splice(index, 1, ...newChildren);
      }
    });
  };
};

export default remarkInlineTags;

