# Docify MCP Server

The Docify MCP (Model Context Protocol) server enables AI assistants like Claude to convert documentation URLs to Markdown format directly within conversations.

## What is MCP?

The Model Context Protocol (MCP) is an open standard by Anthropic that allows AI assistants to connect to external tools and data sources. Think of it like a USB-C port for AI applications - it provides a standardized way to extend AI capabilities.

## Available Tools

The Docify MCP server exposes two tools:

### 1. `convert_url`

Convert a single documentation URL to clean Markdown format.

**Parameters:**
- `url` (string, required): The documentation URL to convert

**Returns:**
- `title`: The page title
- `url`: The source URL
- `markdown`: The converted Markdown content with frontmatter
- `characterCount`: Number of characters in the markdown

**Example usage in Claude:**
```
Use the convert_url tool to convert https://docs.example.com/guide to markdown
```

### 2. `crawl_site`

Crawl an entire documentation site and convert all pages to Markdown.

**Parameters:**
- `url` (string, required): The starting URL for the documentation site
- `maxPages` (number, optional): Maximum number of pages to crawl (default: 10, max: 100)
- `maxDepth` (number, optional): Maximum crawl depth from starting URL (default: 2, max: 5)

**Returns:**
- `baseUrl`: The starting URL
- `totalPages`: Number of pages crawled
- `totalCharacters`: Total characters across all pages
- `pages`: Array of crawled pages with their markdown content

**Example usage in Claude:**
```
Use the crawl_site tool to crawl https://docs.example.com with maxPages=50 and maxDepth=3
```

## Installation & Setup

### For Claude Desktop

1. **Build the server:**
   ```bash
   npm run build:backend
   ```

2. **Add to Claude Desktop config:**

   Edit your Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   Add the Docify MCP server:
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

   Replace `/absolute/path/to/docify.ai` with the actual path to your Docify installation.

3. **Restart Claude Desktop**

   After restarting, Claude will have access to the `convert_url` and `crawl_site` tools.

### For Other MCP Clients

The Docify MCP server uses stdio transport and follows the MCP specification, so it should work with any MCP-compatible client.

**Command to run:**
```bash
node /path/to/docify.ai/dist/mcp-server.js
```

Or if installed globally:
```bash
npm install -g .
docify-mcp
```

## Usage Examples

### Converting a Single Page

In Claude Desktop or another MCP client, you can simply ask:

> "Can you convert https://react.dev/reference/react/useState to markdown?"

Claude will use the `convert_url` tool automatically and return the markdown content.

### Crawling a Documentation Site

> "Please crawl https://docs.python.org/3/tutorial/ and get all the tutorial pages (up to 30 pages)"

Claude will use the `crawl_site` tool with appropriate parameters.

### Saving to Files

> "Convert https://docs.example.com/api to markdown and save it to a file"

Claude will use the tool and then save the returned markdown to a file.

## Development

### Running in Development Mode

```bash
npm run dev:mcp
```

This uses `tsx` to run the TypeScript source directly with hot reloading.

### Testing the Server

You can test the MCP server manually using stdio communication:

```bash
npm run build:backend
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/mcp-server.js
```

### Debugging

The MCP server logs diagnostic information to stderr, which won't interfere with the stdio JSON-RPC communication on stdout. You can see these logs in the MCP client's console.

## Technical Details

- **Protocol**: Model Context Protocol (MCP) via stdio transport
- **SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK)
- **Communication**: JSON-RPC over stdin/stdout
- **Browser Automation**: Playwright (Chromium)
- **Content Extraction**: Smart selectors for documentation containers
- **Markdown Conversion**: Turndown with GitHub Flavored Markdown support

## Security

The Docify MCP server includes security measures:
- URL validation (only HTTP/HTTPS protocols)
- Blocks localhost and private IP addresses
- Configurable crawl limits (max pages, max depth)
- No file system access beyond reading documentation URLs

## Troubleshooting

### Server won't start
- Ensure Node.js is installed (v18+ recommended)
- Run `npm run build:backend` to compile the TypeScript
- Check that Playwright browsers are installed: `npx playwright install chromium`

### Tools not appearing in Claude
- Verify the path in `claude_desktop_config.json` is absolute and correct
- Restart Claude Desktop completely
- Check Claude Desktop's logs for MCP connection errors

### Crawling fails or times out
- Some sites may block automated crawlers
- Try reducing `maxPages` or `maxDepth`
- Check your internet connection
- Some sites require authentication (not supported)

## License

MIT
