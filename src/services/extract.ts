import { Page } from 'playwright';
import type { ExtractionResult } from '../types/index.js';

/**
 * Extract main documentation content from a page
 */
export async function extractContent(page: Page, title: string): Promise<ExtractionResult> {
  // Note: The code inside page.evaluate() runs in the browser context
  // where DOM types are available, but TypeScript doesn't know this
  const html = await page.evaluate(() => {
    // Selectors to try for finding the main content
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.docs-content',
      '.docMainContainer',
      '.markdown-body',
      '.documentation',
      '.doc-content',
      '#content',
      '.content'
    ];

    // Selectors to remove (navigation, sidebars, headers, footers)
    const removeSelectors = [
      'nav',
      'header',
      'footer',
      '.navigation',
      '.sidebar',
      '.nav',
      '.header',
      '.footer',
      '.ads',
      '.advertisement',
      '[role="navigation"]',
      '[role="banner"]',
      '[role="contentinfo"]',
      '.cookie-banner',
      '.cookie-consent',
      '#cookie-notice'
    ];

    // Clone the document to avoid modifying the original
    // @ts-ignore - document is available in browser context
    const docClone = document.cloneNode(true);
    // @ts-ignore
    const body = docClone.body;

    // Remove unwanted elements
    removeSelectors.forEach((selector: string) => {
      const elements = body.querySelectorAll(selector);
      elements.forEach((el: any) => el.remove());
    });

    // Try to find the main content container
    let contentElement: any = null;

    for (const selector of contentSelectors) {
      const element = body.querySelector(selector);
      if (element) {
        contentElement = element;
        break;
      }
    }

    // If no specific content container found, try to find the largest text-containing element
    if (!contentElement) {
      const allDivs = Array.from(body.querySelectorAll('div'));
      let maxTextLength = 0;
      let largestDiv: any = null;

      allDivs.forEach((div: any) => {
        const textContent = div.textContent || '';
        const textLength = textContent.trim().length;

        // Check if this div has meaningful content (headings, paragraphs, code blocks)
        const hasHeadings = div.querySelector('h1, h2, h3, h4, h5, h6');
        const hasParagraphs = div.querySelector('p');
        const hasCode = div.querySelector('pre, code');

        if (textLength > maxTextLength && (hasHeadings || hasParagraphs || hasCode)) {
          maxTextLength = textLength;
          largestDiv = div;
        }
      });

      contentElement = largestDiv;
    }

    if (!contentElement) {
      // Last resort: use the body
      contentElement = body;
    }

    // Clean up the content element
    const cleanElement = contentElement.cloneNode(true);

    // Remove script and style tags
    cleanElement.querySelectorAll('script, style, noscript').forEach((el: any) => el.remove());

    // Remove empty elements
    cleanElement.querySelectorAll('div, span, section').forEach((el: any) => {
      if (!el.textContent?.trim() && !el.querySelector('img, svg, code, pre')) {
        el.remove();
      }
    });

    return cleanElement.innerHTML;
  });

  if (!html || html.trim().length === 0) {
    throw new Error('Could not find meaningful documentation content');
  }

  return {
    title,
    html
  };
}
