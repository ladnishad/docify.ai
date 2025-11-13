import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import type { ExtractionResult, MarkdownResult } from '../types/index.js';

/**
 * Convert HTML to Markdown using Turndown
 */
export function convertToMarkdown(extraction: ExtractionResult, url: string): MarkdownResult {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '*',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full'
  });

  // Add GitHub Flavored Markdown support (tables, strikethrough, etc.)
  turndownService.use(gfm);

  // Custom rule for code blocks with language detection
  turndownService.addRule('fencedCodeBlock', {
    filter: (node) => {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: (content, node) => {
      const codeElement = (node as any).firstChild;
      const className = codeElement?.className || '';
      const language = className.match(/language-(\w+)/)?.[1] || '';

      const code = codeElement?.textContent || '';
      return '\n\n```' + language + '\n' + code + '\n```\n\n';
    }
  });

  // Convert HTML to Markdown
  let markdown = turndownService.turndown(extraction.html);

  // Post-processing
  markdown = postProcessMarkdown(markdown, extraction.title, url);

  return {
    title: extraction.title,
    markdown
  };
}

/**
 * Post-process the Markdown to clean it up
 */
function postProcessMarkdown(markdown: string, title: string, url: string): string {
  // Clean up excessive blank lines (more than 2 consecutive)
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // Ensure single root title if not present
  const hasH1 = markdown.match(/^#\s/m);
  if (!hasH1 && title) {
    markdown = `# ${title}\n\n${markdown}`;
  }

  // Add metadata as YAML frontmatter
  const now = new Date().toISOString();
  const frontmatter = `---
source: "${url}"
fetchedAt: "${now}"
title: "${title.replace(/"/g, '\\"')}"
---

`;

  markdown = frontmatter + markdown;

  // Trim leading/trailing whitespace
  markdown = markdown.trim();

  // Ensure file ends with a newline
  markdown += '\n';

  return markdown;
}
