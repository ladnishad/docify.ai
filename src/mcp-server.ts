#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { loadPage, closeBrowser } from './services/browser.js';
import { extractContent } from './services/extract.js';
import { convertToMarkdown } from './services/markdown.js';
import { crawlSite } from './services/crawler.js';

/**
 * Docify MCP Server
 *
 * Exposes documentation conversion tools for AI agents:
 * - convert_url: Convert a single documentation URL to Markdown
 * - crawl_site: Crawl an entire documentation site and convert to Markdown
 */

// Create the MCP server
const server = new McpServer({
  name: 'docify',
  version: '1.0.0',
});

// Register the convert_url tool
server.registerTool(
  'convert_url',
  {
    title: 'Convert URL to Markdown',
    description: 'Convert a single documentation URL to clean Markdown format. Uses Playwright to render JavaScript, extracts main content, and returns formatted Markdown with frontmatter metadata.',
    inputSchema: {
      url: z.string().url().describe('The documentation URL to convert'),
    },
    outputSchema: {
      title: z.string().describe('The page title'),
      url: z.string().describe('The source URL'),
      markdown: z.string().describe('The converted Markdown content'),
      characterCount: z.number().describe('Number of characters in the markdown'),
    },
  },
  async ({ url }) => {
    try {
      console.error(`[MCP] Converting URL: ${url}`);

      // Load the page with Playwright
      const { page, title } = await loadPage(url);

      try {
        // Extract content
        const extraction = await extractContent(page, title);

        // Convert to Markdown
        const result = convertToMarkdown(extraction, url);

        const output = {
          title: result.title,
          url: url,
          markdown: result.markdown,
          characterCount: result.markdown.length,
        };

        console.error(`[MCP] Successfully converted: ${url} (${output.characterCount} chars)`);

        return {
          content: [
            {
              type: 'text',
              text: `Successfully converted "${result.title}"\n\nURL: ${url}\nCharacters: ${output.characterCount.toLocaleString()}\n\n${result.markdown}`,
            },
          ],
          structuredContent: output,
        };
      } finally {
        await page.close();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MCP] Error converting URL: ${errorMessage}`);

      throw new Error(`Failed to convert URL: ${errorMessage}`);
    }
  }
);

// Register the crawl_site tool
server.registerTool(
  'crawl_site',
  {
    title: 'Crawl Documentation Site',
    description: 'Crawl an entire documentation site starting from a base URL. Follows internal links, extracts content from each page, and returns combined Markdown. Useful for getting complete documentation sets.',
    inputSchema: {
      url: z.string().url().describe('The starting URL for the documentation site'),
      maxPages: z.number().int().min(1).max(100).optional().describe('Maximum number of pages to crawl (default: 10, max: 100)'),
      maxDepth: z.number().int().min(0).max(5).optional().describe('Maximum crawl depth from starting URL (default: 2, max: 5)'),
    },
    outputSchema: {
      baseUrl: z.string().describe('The starting URL'),
      totalPages: z.number().describe('Number of pages crawled'),
      totalCharacters: z.number().describe('Total characters across all pages'),
      pages: z.array(z.object({
        url: z.string(),
        title: z.string(),
        markdown: z.string(),
      })).describe('Array of crawled pages with their markdown content'),
    },
  },
  async ({ url, maxPages, maxDepth }) => {
    try {
      console.error(`[MCP] Crawling site: ${url} (maxPages=${maxPages || 10}, maxDepth=${maxDepth || 2})`);

      // Crawl the site
      const result = await crawlSite(url, {
        maxPages: maxPages || 10,
        maxDepth: maxDepth || 2,
      });

      const output = {
        baseUrl: result.baseUrl,
        totalPages: result.metadata.totalPages,
        totalCharacters: result.metadata.totalCharacters,
        pages: result.pages,
      };

      // Create a combined markdown for the text response
      const combinedMarkdown = result.pages
        .map((page) => `# ${page.title}\n\nSource: ${page.url}\n\n---\n\n${page.markdown}`)
        .join('\n\n---\n\n');

      console.error(`[MCP] Successfully crawled: ${result.metadata.totalPages} pages, ${result.metadata.totalCharacters} chars`);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully crawled ${result.metadata.totalPages} pages from ${new URL(result.baseUrl).hostname}\n\nTotal characters: ${result.metadata.totalCharacters.toLocaleString()}\n\nPages:\n${result.pages.map((p, i) => `${i + 1}. ${p.title} (${p.url})`).join('\n')}\n\n---\n\n${combinedMarkdown}`,
          },
        ],
        structuredContent: output,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[MCP] Error crawling site: ${errorMessage}`);

      throw new Error(`Failed to crawl site: ${errorMessage}`);
    }
  }
);

// Start the server with stdio transport
async function main() {
  console.error('[MCP] Starting Docify MCP Server...');

  const transport = new StdioServerTransport();

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    console.error('[MCP] Shutting down...');
    await closeBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('[MCP] Shutting down...');
    await closeBrowser();
    process.exit(0);
  });

  await server.connect(transport);
  console.error('[MCP] Docify MCP Server is ready');
}

main().catch((error) => {
  console.error('[MCP] Fatal error:', error);
  process.exit(1);
});
