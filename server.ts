import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app } from './src/server/app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Serve static assets from public with direct mounts for /assets and fallback /src/assets
  app.use(express.static(path.resolve(__dirname, 'public')));
  app.use('/assets', express.static(path.resolve(__dirname, 'public', 'assets')));
  app.use('/src/assets', express.static(path.resolve(__dirname, 'public', 'assets')));
  app.use('/src/assets', express.static(path.resolve(__dirname, 'src', 'assets')));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`4 LAZY full-stack e-commerce server active at http://0.0.0.0:${PORT}`);
  });
}

startServer();
