import { Router, Request, Response } from 'express';
import { crawlSite } from '../services/crawler.js';
import type { ErrorResponse } from '../types/index.js';

const router = Router();

interface SiteCrawlRequest {
  url: string;
  options?: {
    maxPages?: number;
    maxDepth?: number;
  };
}

/**
 * POST /api/convert/site
 * Crawl and convert an entire documentation site to Markdown
 */
router.post('/site', async (req: Request, res: Response) => {
  try {
    const { url, options } = req.body as SiteCrawlRequest;

    // Validate request
    if (!url) {
      const errorResponse: ErrorResponse = {
        error: 'Missing required field: url'
      };
      return res.status(400).json(errorResponse);
    }

    if (typeof url !== 'string') {
      const errorResponse: ErrorResponse = {
        error: 'Invalid field type: url must be a string'
      };
      return res.status(400).json(errorResponse);
    }

    // Validate options
    const maxPages = Math.min(options?.maxPages || 10, 100); // Cap at 100 pages
    const maxDepth = Math.min(options?.maxDepth || 2, 5); // Cap at depth 5

    console.log(`Site crawl request: ${url} (maxPages: ${maxPages}, maxDepth: ${maxDepth})`);

    // Crawl the site
    const result = await crawlSite(url, {
      maxPages,
      maxDepth,
    });

    res.json(result);
  } catch (err) {
    console.error('Error crawling site:', err);

    const errorResponse: ErrorResponse = {
      error: 'Unable to crawl site',
      details: err instanceof Error ? err.message : 'Unknown error'
    };

    res.status(500).json(errorResponse);
  }
});

export default router;
