# Docify

> Turn any public documentation URL into a clean, AI-friendly Markdown file

Docify is a web service that converts JavaScript-heavy documentation sites into structured Markdown files. It uses a headless browser to render pages completely, extracts the main content, and converts it to well-formatted Markdown that can be easily used with AI tools.

## Features

- 🚀 **JavaScript Rendering**: Uses Playwright to fully render JS-heavy documentation sites
- 🎯 **Smart Content Extraction**: Intelligently identifies and extracts main documentation content
- 📝 **Clean Markdown**: Converts HTML to well-structured Markdown with proper formatting
- 🔒 **Security**: Built-in URL validation to prevent access to private networks
- 🌐 **Modern React UI**: Beautiful, responsive interface built with React and shadcn/ui
- 📚 **Site Crawling**: Crawl entire documentation sites with configurable depth and page limits
- 🤖 **MCP Server**: Model Context Protocol server for AI assistant integration (Claude Desktop, etc.)
- 👀 **Live Preview**: Beautiful markdown preview with syntax highlighting using react-markdown
- 🔌 **REST API**: Programmatic access for integration with other tools

## Quick Start

### Prerequisites

- Node.js 18+ or 20+
- npm, pnpm, or yarn

### Installation

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
npm run install:frontend

# Install Playwright browsers
npx playwright install chromium
```

### Development

For development, you'll need to run both the backend and frontend:

```bash
# Terminal 1: Run backend API server (http://localhost:3200)
npm run dev

# Terminal 2: Run frontend dev server with hot reload (http://localhost:5200)
npm run dev:frontend
```

The frontend dev server (port 5200) will proxy API requests to the backend (port 3200).

### Production

```bash
# Build the project
npm run build

# Start the server
npm start
```

The server will start on `http://localhost:3200` by default.

## Usage

### Web UI

1. Open `http://localhost:3200` in your browser
2. Paste a documentation URL
3. Toggle "Crawl entire site" if you want to crawl multiple pages
4. Click "Convert to Markdown"
5. Preview and copy the markdown, or download the `.md` file

### MCP Server (AI Assistant Integration)

Docify includes an MCP server that allows AI assistants like Claude to convert documentation URLs directly within conversations.

**See [MCP_SERVER.md](./MCP_SERVER.md) for detailed setup and usage instructions.**

Quick setup for Claude Desktop:
1. Build the server: `npm run build:backend`
2. Add to `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "docify": {
         "command": "node",
         "args": ["/absolute/path/to/docify.ai/dist/mcp-server.js"]
       }
     }
   }
   ```
3. Restart Claude Desktop

### API

#### Convert Single Page

**Endpoint:** `POST /api/convert`

**Request:**
```json
{
  "url": "https://example.com/docs/page"
}
```

**Response:**
```json
{
  "url": "https://example.com/docs/page",
  "title": "Page Title",
  "markdown": "# Page Title\n\n## Section 1\n...",
  "metadata": {
    "fetchedAt": "2025-11-13T12:34:56.000Z",
    "source": "playwright",
    "contentLength": 12345
  }
}
```

#### Crawl Entire Site

**Endpoint:** `POST /api/convert/site`

**Request:**
```json
{
  "url": "https://example.com/docs",
  "maxPages": 50,
  "maxDepth": 3
}
```

**Response:**
```json
{
  "baseUrl": "https://example.com/docs",
  "pages": [
    {
      "url": "https://example.com/docs/page1",
      "title": "Page 1",
      "markdown": "..."
    }
  ],
  "metadata": {
    "fetchedAt": "2025-11-13T12:34:56.000Z",
    "totalPages": 15,
    "totalCharacters": 45678
  }
}
```

**Error Response:**
```json
{
  "error": "Unable to fetch or parse URL",
  "details": "Timeout after 30s while loading the page"
}
```

### Example with cURL

```bash
curl -X POST http://localhost:3200/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://react.dev/learn"}'
```

### Example with JavaScript

```javascript
const response = await fetch('http://localhost:3200/api/convert', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://docs.github.com/en/get-started'
  })
});

const data = await response.json();
console.log(data.markdown);
```

## Project Structure

```
docify/
├── src/                      # Backend source code
│   ├── index.ts             # Application entry point
│   ├── server.ts            # Express server setup
│   ├── mcp-server.ts        # MCP server for AI assistant integration
│   ├── routes/
│   │   ├── convert.ts       # API route for single page conversion
│   │   └── site.ts          # API route for site crawling
│   ├── services/
│   │   ├── browser.ts       # Playwright browser management
│   │   ├── extract.ts       # Content extraction logic
│   │   ├── markdown.ts      # HTML to Markdown conversion
│   │   └── crawler.ts       # Site crawling with BFS
│   └── types/
│       └── index.d.ts       # TypeScript type definitions
├── frontend/                # React frontend
│   ├── src/
│   │   ├── App.tsx          # Main React component
│   │   ├── main.tsx         # React entry point
│   │   ├── index.css        # Global styles with Tailwind
│   │   └── components/ui/   # shadcn/ui components
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── package.json             # Root package.json
├── tsconfig.json            # Backend TypeScript config
├── README.md
└── MCP_SERVER.md            # MCP server documentation
```

## How It Works

1. **URL Validation**: Validates the input URL and rejects private IPs and invalid protocols
2. **Page Loading**: Uses Playwright's headless Chromium to load and render the page
3. **Content Extraction**: Identifies the main documentation content by looking for common containers
4. **HTML Cleaning**: Removes navigation, headers, footers, and other non-content elements
5. **Markdown Conversion**: Converts the cleaned HTML to Markdown using Turndown
6. **Post-Processing**: Cleans up the Markdown and adds metadata

## Security

Docify includes several security measures:

- ✅ URL validation (HTTP/HTTPS only)
- ✅ Blocks localhost and private IP addresses
- ✅ 30-second timeout for page loading
- ✅ No authentication or persistence (stateless)

## Configuration

You can configure the server using environment variables:

- `PORT`: Server port (default: 3200)

Example:
```bash
PORT=8080 npm start
```

## API Limits

Current implementation:

- 30-second timeout per request
- No rate limiting (consider adding in production)
- No caching (browser instances are reused)

## Supported Documentation Sites

Docify works best with:

- ✅ Modern documentation sites (React, Vue, Next.js based)
- ✅ Static site generators (VuePress, Docusaurus, GitBook)
- ✅ Traditional documentation (Sphinx, MkDocs)
- ✅ GitHub-flavored Markdown sites

## Limitations

- ⚠️ Cannot access authenticated/login-required pages
- ⚠️ May not work with sites that heavily block bots
- ⚠️ Results depend on site structure consistency
- ⚠️ Crawling limited to same-domain links only

## Future Enhancements

- [ ] Custom selector configuration
- [ ] Rate limiting and caching
- [ ] Docker support
- [ ] PDF export option
- [ ] Support for authenticated pages (config-based)
- [ ] Sitemap.xml parsing for crawling

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Acknowledgments

- [Playwright](https://playwright.dev/) - Browser automation
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion
- [Model Context Protocol](https://modelcontextprotocol.io) - AI assistant integration protocol
- [Express](https://expressjs.com/) - Web framework
- [React](https://react.dev/) - UI library
- [shadcn/ui](https://ui.shadcn.com/) - UI component system
- [Vite](https://vitejs.dev/) - Frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [react-markdown](https://github.com/remarkjs/react-markdown) - Markdown preview component
