import { Page } from 'playwright';
import { loadPage, validateUrl } from './browser.js';
import { extractContent } from './extract.js';
import { convertToMarkdown } from './markdown.js';

interface CrawlOptions {
  maxPages?: number;
  maxDepth?: number;
}

interface CrawledPage {
  url: string;
  title: string;
  markdown: string;
  depth: number;
}

interface CrawlResult {
  baseUrl: string;
  pages: Array<{
    url: string;
    title: string;
    markdown: string;
  }>;
  metadata: {
    fetchedAt: string;
    totalPages: number;
    totalCharacters: number;
  };
}

/**
 * Extract all internal links from a page that belong to the same documentation site
 */
async function extractLinks(page: Page, baseUrl: string): Promise<string[]> {
  const links = await page.evaluate((base) => {
    // @ts-ignore - document is available in browser context
    const anchorElements = Array.from(document.querySelectorAll('a[href]'));
    const currentUrl = new URL(base);
    const uniqueLinks = new Set<string>();

    anchorElements.forEach((anchor: any) => {
      try {
        const href = anchor.getAttribute('href');
        if (!href) return;

        // Resolve relative URLs
        const absoluteUrl = new URL(href, base);

        // Only include links from the same host
        if (absoluteUrl.hostname !== currentUrl.hostname) return;

        // Remove hash fragments
        absoluteUrl.hash = '';

        // Skip non-documentation URLs (common patterns to exclude)
        const path = absoluteUrl.pathname.toLowerCase();
        if (
          path.includes('/blog/') ||
          path.includes('/changelog/') ||
          path.includes('/about/') ||
          path.includes('/contact/') ||
          path.match(/\.(pdf|zip|tar|gz|jpg|png|gif|svg|ico)$/)
        ) {
          return;
        }

        uniqueLinks.add(absoluteUrl.toString());
      } catch {
        // Invalid URL, skip
      }
    });

    return Array.from(uniqueLinks);
  }, baseUrl);

  return links;
}

/**
 * Check if a URL is within the documentation bounds of the base URL
 */
function isWithinDocsBounds(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);

    // Must be same host
    if (urlObj.hostname !== baseObj.hostname) return false;

    // If base URL has a path, the new URL should start with that path
    const basePath = baseObj.pathname.split('/').filter(Boolean)[0];
    if (basePath) {
      const urlPath = urlObj.pathname.split('/').filter(Boolean)[0];
      return basePath === urlPath;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Crawl a documentation site starting from a base URL
 */
export async function crawlSite(
  startUrl: string,
  options: CrawlOptions = {}
): Promise<CrawlResult> {
  const {
    maxPages = 10,
    maxDepth = 2,
  } = options;

  // Validate start URL
  const validation = validateUrl(startUrl);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const visited = new Set<string>();
  const pages: CrawledPage[] = [];
  const queue: Array<{ url: string; depth: number }> = [{ url: startUrl, depth: 0 }];

  console.log(`Starting crawl from ${startUrl} (max ${maxPages} pages, max depth ${maxDepth})`);

  while (queue.length > 0 && pages.length < maxPages) {
    const { url, depth } = queue.shift()!;

    // Skip if already visited
    if (visited.has(url)) continue;

    // Skip if depth exceeded
    if (depth > maxDepth) continue;

    visited.add(url);

    try {
      console.log(`Crawling [${pages.length + 1}/${maxPages}] depth=${depth}: ${url}`);

      // Load and convert the page
      const { page, title } = await loadPage(url);

      try {
        // Extract content
        const extraction = await extractContent(page, title);

        // Convert to Markdown
        const result = convertToMarkdown(extraction, url);

        // Add to results
        pages.push({
          url,
          title: result.title,
          markdown: result.markdown,
          depth,
        });

        // Extract links for further crawling (only if not at max depth)
        if (depth < maxDepth && pages.length < maxPages) {
          const links = await extractLinks(page, url);

          // Filter and queue new links
          for (const link of links) {
            if (
              !visited.has(link) &&
              isWithinDocsBounds(link, startUrl) &&
              pages.length + queue.length < maxPages
            ) {
              queue.push({ url: link, depth: depth + 1 });
            }
          }
        }
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error(`Failed to crawl ${url}:`, error);
      // Continue with next URL even if one fails
    }
  }

  // Calculate total characters
  const totalCharacters = pages.reduce((sum, page) => sum + page.markdown.length, 0);

  console.log(`Crawl complete: ${pages.length} pages, ${totalCharacters} characters`);

  return {
    baseUrl: startUrl,
    pages: pages.map(({ url, title, markdown }) => ({ url, title, markdown })),
    metadata: {
      fetchedAt: new Date().toISOString(),
      totalPages: pages.length,
      totalCharacters,
    },
  };
}
