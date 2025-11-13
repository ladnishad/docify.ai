import express, { Application } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import convertRouter from './routes/convert.js';
import siteRouter from './routes/site.js';
import { closeBrowser } from './services/browser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API routes (before static files to give them priority)
  app.use('/api', convertRouter);
  app.use('/api/convert', siteRouter);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve React frontend static files
  const frontendPath = join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendPath));

  // Serve index.html for all other routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
  });

  return app;
}

export function startServer(port: number = 3000): void {
  const app = createApp();

  const server = app.listen(port, () => {
    console.log(`✨ Docify server running on http://localhost:${port}`);
    console.log(`📝 API endpoints:`);
    console.log(`   - Single page: http://localhost:${port}/api/convert`);
    console.log(`   - Site crawl:  http://localhost:${port}/api/convert/site`);
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
