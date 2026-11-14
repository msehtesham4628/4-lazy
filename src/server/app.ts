import 'dotenv/config';
import express from 'express';
import { authRouter } from './routes/auth.ts';
import { productsRouter } from './routes/products.ts';
import { ordersRouter } from './routes/orders.ts';
import { adminRouter } from './routes/admin.ts';
import { paymentsRouter } from './routes/payments.ts';
import { paymentRouter } from './routes/payment.ts';
import { getDB, getPendingMongoSync, hydrateDbFromMongo } from './db.ts';
import { getMongoStats, initMongoDB } from './mongodb.ts';

export const app = express();

app.use(
  express.json({
    limit: '50mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    }
  })
);
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

// Initialize local/tmp DB synchronously and prepare MongoDB hydration
let initialData: ReturnType<typeof getDB> | undefined;
try {
  initialData = getDB();
} catch (e) {
  console.warn('Local DB initialization notice:', e);
}

// Kick off background init on Node servers, and await once per cold-start in serverless
function ensureMongoReady(forceRefresh = false) {
  return initMongoDB(initialData || getDB(), hydrateDbFromMongo, forceRefresh).catch(err => {
    console.warn('MongoDB initialization notice:', err?.message || err);
  });
}
ensureMongoReady(false);

app.use('/api', async (req, res, next) => {
  const isMutation = req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS';
  const isAdminRead = req.path.startsWith('/admin');
  await ensureMongoReady(isMutation || isAdminRead);

  if (isMutation) {
    const origJson = res.json.bind(res);
    res.json = ((body: any) => {
      const pending = getPendingMongoSync();
      if (pending) {
        pending.finally(() => {
          if (!res.headersSent) {
            origJson(body);
          }
        });
        return res;
      }
      return origJson(body);
    }) as any;
  }

  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: '4LAAZY E-Commerce API',
    runtime: process.env.VERCEL ? 'vercel' : 'node',
    mongodb: getMongoStats(),
    timestamp: new Date().toISOString()
  });
});

// Mount API Routers
app.use('/api/auth', authRouter);
app.use('/api', productsRouter);
app.use('/api', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/payment', paymentRouter);

// Graceful JSON error middleware for large payloads and offline DB
app.use((err: any, req: any, res: any, next: any) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      error: 'Uploaded photo payload is too large. Please upload smaller images or let auto-compression optimize them.'
    });
  }
  if (err?.name === 'MongooseError' || err?.name === 'MongoNetworkError' || err?.message?.includes('buffering timed out')) {
    console.warn('[AI Studio] Database offline — returning fallback response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Database temporarily unavailable' });
  }
  next(err);
});

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
