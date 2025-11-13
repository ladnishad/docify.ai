import { Router, Request, Response } from 'express';
import { loadPage } from '../services/browser.js';
import { extractContent } from '../services/extract.js';
import { convertToMarkdown } from '../services/markdown.js';
import type { ConvertRequest, ConvertResponse, ErrorResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/convert
 * Convert a documentation URL to Markdown
 */
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as ConvertRequest;

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

    // Load the page
    const { page, title } = await loadPage(url);

    try {
      // Extract content
      const extraction = await extractContent(page, title);

      // Convert to Markdown
      const result = convertToMarkdown(extraction, url);

      // Prepare response
      const response: ConvertResponse = {
        url,
        title: result.title,
        markdown: result.markdown,
        metadata: {
          fetchedAt: new Date().toISOString(),
          source: 'playwright',
          contentLength: result.markdown.length
        }
      };

      res.json(response);
    } finally {
      // Always close the page
      await page.close();
    }
  } catch (err) {
    console.error('Error converting URL:', err);

    const errorResponse: ErrorResponse = {
      error: 'Unable to fetch or parse URL',
      details: err instanceof Error ? err.message : 'Unknown error'
    };

    res.status(500).json(errorResponse);
  }
});

export default router;
