import express, { Application } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import convertRouter from './routes/convert.js';
import { closeBrowser } from './services/browser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from public directory
  const publicPath = join(__dirname, '..', 'public');
  app.use(express.static(publicPath));

  // API routes
  app.use('/api', convertRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Root endpoint - serve the UI
  app.get('/', (req, res) => {
    res.sendFile(join(publicPath, 'index.html'));
  });

  return app;
}

export function startServer(port: number = 3000): void {
  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`✨ Docify server running on http://localhost:${port}`);
    console.log(`📝 API endpoint: http://localhost:${port}/api/convert`);
    console.log(`🌐 Web UI: http://localhost:${port}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n🔄 Shutting down gracefully...');
    server.close(async () => {
      await closeBrowser();
      console.log('✅ Server closed');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('⚠️  Forcing shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}
