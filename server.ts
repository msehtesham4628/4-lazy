import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { authRouter } from './src/server/routes/auth.ts';
import { productsRouter } from './src/server/routes/products.ts';
import { ordersRouter } from './src/server/routes/orders.ts';
import { adminRouter } from './src/server/routes/admin.ts';
import { paymentsRouter } from './src/server/routes/payments.ts';
import { getDB } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize DB
  getDB();

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api', productsRouter);
  app.use('/api', ordersRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/payments', paymentsRouter);

  // SEO: Dynamic XML sitemap and robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${req.protocol}://${req.get('host')}/sitemap.xml`);
  });

  app.get('/sitemap.xml', (req, res) => {
    const db = getDB();
    const host = `${req.protocol}://${req.get('host')}`;
    const staticUrls = [
      '/',
      '/shop',
      '/about',
      '/contact',
      '/track-order',
      '/privacy-policy',
      '/terms',
      '/shipping-returns'
    ];
    const productUrls = db.products.filter(p => p.isPublished).map(p => `/products/${p.slug}`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...productUrls].map(url => `  <url>
    <loc>${host}${url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${url === '/' ? '1.0' : url.startsWith('/products/') ? '0.8' : '0.5'}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.type('application/xml');
    res.send(xml);
  });

  // Serve static assets from public
  app.use(express.static(path.resolve(__dirname, 'public')));

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
