# Docify

> Turn any public documentation URL into a clean, AI-friendly Markdown file

Docify is a web service that converts JavaScript-heavy documentation sites into structured Markdown files. It uses a headless browser to render pages completely, extracts the main content, and converts it to well-formatted Markdown that can be easily used with AI tools.

## Features

- 🚀 **JavaScript Rendering**: Uses Playwright to fully render JS-heavy documentation sites
- 🎯 **Smart Content Extraction**: Intelligently identifies and extracts main documentation content
- 📝 **Clean Markdown**: Converts HTML to well-structured Markdown with proper formatting
- 🔒 **Security**: Built-in URL validation to prevent access to private networks
- 🌐 **Modern React UI**: Beautiful, responsive interface built with React and shadcn/ui
- ✏️ **Live Markdown Editor**: Edit and preview converted markdown with syntax highlighting
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
# Terminal 1: Run backend API server (http://localhost:3000)
npm run dev

# Terminal 2: Run frontend dev server with hot reload (http://localhost:5173)
npm run dev:frontend
```

The frontend dev server (port 5173) will proxy API requests to the backend (port 3000).

### Production

```bash
# Build the project
npm run build

# Start the server
npm start
```

The server will start on `http://localhost:3000` by default.

## Usage

### Web UI

1. Open `http://localhost:3000` in your browser
2. Paste a documentation URL
3. Click "Convert to Markdown"
4. Download the resulting `.md` file

### API

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

**Error Response:**
```json
{
  "error": "Unable to fetch or parse URL",
  "details": "Timeout after 30s while loading the page"
}
```

### Example with cURL

```bash
curl -X POST http://localhost:3000/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://react.dev/learn"}'
```

### Example with JavaScript

```javascript
const response = await fetch('http://localhost:3000/api/convert', {
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
│   ├── routes/
│   │   └── convert.ts       # API route for conversion
│   ├── services/
│   │   ├── browser.ts       # Playwright browser management
│   │   ├── extract.ts       # Content extraction logic
│   │   └── markdown.ts      # HTML to Markdown conversion
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
└── README.md
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

- `PORT`: Server port (default: 3000)

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
- ⚠️ Single page conversion only (no crawling)
- ⚠️ Results depend on site structure consistency

## Future Enhancements

- [ ] CLI tool (`docify <url> > output.md`)
- [ ] Batch URL processing
- [ ] Full-site documentation crawling
- [ ] Custom selector configuration
- [ ] Rate limiting and caching
- [ ] Docker support
- [ ] PDF export option

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Acknowledgments

- [Playwright](https://playwright.dev/) - Browser automation
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown conversion
- [Express](https://expressjs.com/) - Web framework
- [React](https://react.dev/) - UI library
- [shadcn/ui](https://ui.shadcn.com/) - UI component system
- [Vite](https://vitejs.dev/) - Frontend build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor) - Markdown editor component
