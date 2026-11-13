import express from 'express';
import { authRouter } from './routes/auth.ts';
import { productsRouter } from './routes/products.ts';
import { ordersRouter } from './routes/orders.ts';
import { adminRouter } from './routes/admin.ts';
import { paymentsRouter } from './routes/payments.ts';
import { getDB } from './db.ts';
import { initMongoDB } from './mongodb.ts';

export const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS headers for API calls across deployments
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Initialize DB and bootstrap MongoDB Atlas if configured
try {
  const initialData = getDB();
  initMongoDB(initialData).catch(err => {
    console.warn('MongoDB initialization notice:', err?.message || err);
  });
} catch (e) {
  console.warn('Local DB initialization notice:', e);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: '4LAAZY E-Commerce API',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api', productsRouter);
app.use('/api', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);

// Dynamic sitemap and robots.txt
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

export default app;
