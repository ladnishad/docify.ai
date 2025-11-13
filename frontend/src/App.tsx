import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Loader2, FileDown, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface ConvertResponse {
  url: string;
  title: string;
  markdown: string;
  metadata: {
    fetchedAt: string;
    source: string;
    contentLength: number;
  };
}

interface ErrorResponse {
  error: string;
  details?: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const exampleUrls = [
    { label: 'GitHub Docs', url: 'https://docs.github.com/en/get-started/quickstart/hello-world' },
    { label: 'React Docs', url: 'https://react.dev/learn' },
    { label: 'Playwright Docs', url: 'https://playwright.dev/docs/intro' },
    { label: 'Node.js Docs', url: 'https://nodejs.org/en/docs/guides/getting-started-guide' },
  ];

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setMarkdown('');
    setTitle('');

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = (await response.json()) as ConvertResponse | ErrorResponse;

      if (!response.ok) {
        const errorData = data as ErrorResponse;
        throw new Error(errorData.details || errorData.error || 'Conversion failed');
      }

      const successData = data as ConvertResponse;
      setMarkdown(successData.markdown);
      setTitle(successData.title);

      toast({
        title: 'Success!',
        description: `Converted ${successData.metadata.contentLength.toLocaleString()} characters`,
      });
    } catch (error) {
      toast({
        title: 'Conversion Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!markdown) return;

    const filename = sanitizeFilename(title || 'document') + '.md';
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `Saved as ${filename}`,
    });
  };

  const handleCopyAll = async () => {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Markdown copied to clipboard',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const sanitizeFilename = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-10 px-4">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Sparkles className="w-10 h-10 text-purple-600" />
              Docify
            </h1>
            <p className="text-xl text-muted-foreground">
              Convert any documentation URL to clean, AI-friendly Markdown
            </p>
          </div>

          {/* Main Card */}
          <Card>
            <CardHeader>
              <CardTitle>Documentation Converter</CardTitle>
              <CardDescription>
                Enter a documentation URL below to convert it to Markdown format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form */}
              <form onSubmit={handleConvert} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Documentation URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/docs/getting-started"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      'Convert to Markdown'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownload}
                    disabled={!markdown || isLoading}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </form>

              {/* Example URLs */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  Example URLs to try:
                </Label>
                <div className="flex flex-wrap gap-2">
                  {exampleUrls.map((example) => (
                    <Button
                      key={example.url}
                      variant="secondary"
                      size="sm"
                      onClick={() => setUrl(example.url)}
                      disabled={isLoading}
                    >
                      {example.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markdown Preview */}
          {markdown && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Markdown Preview</CardTitle>
                    <CardDescription>
                      {markdown.length.toLocaleString()} characters • Rendered with react-markdown
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAll}
                    className="gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="markdown-preview bg-white border rounded-lg p-6 max-h-[800px] overflow-y-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    className="prose prose-slate max-w-none"
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features */}
          {!markdown && (
            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">JavaScript Rendering</CardTitle>
                  <CardDescription>
                    Uses Playwright to fully render JS-heavy documentation sites
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Smart Extraction</CardTitle>
                  <CardDescription>
                    Intelligently identifies and extracts main documentation content
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Clean Markdown</CardTitle>
                  <CardDescription>
                    Converts to well-structured Markdown with proper formatting
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
