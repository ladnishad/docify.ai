export interface ConvertRequest {
  url: string;
}

export interface ConvertResponse {
  url: string;
  title: string;
  markdown: string;
  metadata: {
    fetchedAt: string;
    source: string;
    contentLength: number;
  };
}

export interface ErrorResponse {
  error: string;
  details?: string;
}

export interface ExtractionResult {
  title: string;
  html: string;
}

export interface MarkdownResult {
  title: string;
  markdown: string;
}
