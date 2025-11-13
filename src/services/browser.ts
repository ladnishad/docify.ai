import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;

/**
 * Get or create a singleton browser instance
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }
  return browser;
}

/**
 * Close the browser instance
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Validate URL for security
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    // Only allow HTTP and HTTPS protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        valid: false,
        error: `Invalid protocol: ${parsed.protocol}. Only HTTP and HTTPS are allowed.`
      };
    }

    // Reject localhost and private IP addresses
    const hostname = parsed.hostname.toLowerCase();

    // Check for localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return {
        valid: false,
        error: 'Localhost URLs are not allowed.'
      };
    }

    // Check for private IP ranges
    const privateIpPatterns = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[01])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // 169.254.0.0/16 (link-local)
      /^fc00:/,                   // IPv6 private
      /^fe80:/                    // IPv6 link-local
    ];

    for (const pattern of privateIpPatterns) {
      if (pattern.test(hostname)) {
        return {
          valid: false,
          error: 'Private IP addresses are not allowed.'
        };
      }
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: `Invalid URL format: ${err instanceof Error ? err.message : 'Unknown error'}`
    };
  }
}

/**
 * Load a URL with Playwright and return the page
 */
export async function loadPage(url: string): Promise<{ page: Page; title: string }> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();

  try {
    // Navigate to the URL with a timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for common documentation container elements
    const selectors = [
      'main',
      'article',
      '[role="main"]',
      '.docs-content',
      '.docMainContainer',
      '.markdown-body'
    ];

    // Try to wait for at least one of these selectors (with a shorter timeout)
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        break;
      } catch {
        // Continue to next selector
      }
    }

    // Get the page title
    const title = await page.title();

    return { page, title };
  } catch (err) {
    await page.close();
    throw new Error(
      `Failed to load page: ${err instanceof Error ? err.message : 'Unknown error'}`
    );
  }
}
