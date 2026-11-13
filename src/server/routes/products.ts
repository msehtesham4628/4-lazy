import { Router, type Response } from 'express';
import { getDB, saveDB } from '../db.ts';
import { requireAdmin, optionalAuthenticate, type AuthenticatedRequest } from '../authMiddleware.ts';
import type { Product, ProductVariant, Review } from '../../types/index.ts';

export const productsRouter = Router();

// Public: Get all products with filtering, search, and sorting
productsRouter.get('/products', (req, res) => {
  const db = getDB();
  let list = db.products.filter(p => p.isPublished);

  const { category, search, size, color, minPrice, maxPrice, sort, featured } = req.query;

  if (category && typeof category === 'string' && category !== 'all') {
    const cleanCat = category.toLowerCase().trim();
    if (cleanCat === 'trending') {
      list = list.filter(p => p.isFeatured || p.tags.some(t => t.toLowerCase() === 'trending'));
    } else {
      const catMeta = db.categories.find(
        c => c.slug.toLowerCase() === cleanCat || c.name.toLowerCase() === cleanCat
      );
      const targetName = (catMeta?.name || cleanCat).toLowerCase();
      list = list.filter(
        p =>
          p.category.toLowerCase() === targetName ||
          p.category.toLowerCase().includes(cleanCat.replace(/-/g, ' ')) ||
          p.slug.includes(cleanCat)
      );
    }
  }

  if (featured === 'true') {
    list = list.filter(p => p.isFeatured);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  if (size && typeof size === 'string') {
    list = list.filter(p => p.variants.some(v => v.size.toLowerCase() === size.toLowerCase() && v.stock > 0));
  }

  if (color && typeof color === 'string') {
    list = list.filter(p => p.variants.some(v => v.colorName.toLowerCase() === color.toLowerCase() && v.stock > 0));
  }

  if (minPrice && !isNaN(Number(minPrice))) {
    list = list.filter(p => (p.discountPrice || p.basePrice) >= Number(minPrice));
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    list = list.filter(p => (p.discountPrice || p.basePrice) <= Number(maxPrice));
  }

  // Sorting
  if (sort === 'price_asc') {
    list.sort((a, b) => (a.discountPrice || a.basePrice) - (b.discountPrice || b.basePrice));
  } else if (sort === 'price_desc') {
    list.sort((a, b) => (b.discountPrice || b.basePrice) - (a.discountPrice || a.basePrice));
  } else if (sort === 'popularity') {
    list.sort((a, b) => b.reviewsCount - a.reviewsCount);
  } else {
    // Default newest
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return res.json({
    products: list,
    total: list.length
  });
});

// Public: Get categories
productsRouter.get('/categories', (req, res) => {
  const db = getDB();
  return res.json({ categories: db.categories });
});

// Public: Get store settings (Hero images, headlines, banner text, free shipping threshold)
productsRouter.get('/settings', (req, res) => {
  const db = getDB();
  return res.json({ settings: db.settings });
});

// Public: Get single product by slug
productsRouter.get('/products/:slug', (req, res) => {
  const db = getDB();
  const product = db.products.find(p => p.slug === req.params.slug || p.id === req.params.slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const reviews = db.reviews.filter(r => r.productId === product.id);
  const relatedProducts = db.products
    .filter(p => p.id !== product.id && (p.category === product.category || p.isFeatured))
    .slice(0, 4);

  return res.json({
    product,
    reviews,
    relatedProducts
  });
});

// Customer: Add review
productsRouter.post('/products/:id/reviews', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  const { rating, title, comment, userName } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ error: 'Rating and review comment are required.' });
  }

  const db = getDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const newReview: Review = {
    id: `rev_${Date.now()}`,
    productId: product.id,
    userName: req.user?.name || userName || 'Verified Buyer',
    rating: Math.min(5, Math.max(1, Number(rating))),
    title: title || 'Exceptional craftsmanship',
    comment: comment.trim(),
    verifiedPurchase: true,
    createdAt: new Date().toISOString()
  };

  db.reviews.unshift(newReview);
  product.reviewsCount += 1;
  const productReviews = db.reviews.filter(r => r.productId === product.id);
  const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
  product.rating = Number(avg.toFixed(1));

  saveDB();
  return res.status(201).json({ review: newReview, rating: product.rating, reviewsCount: product.reviewsCount });
});

// Admin: Create product
productsRouter.post('/admin/products', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const data = req.body;
  if (!data.title || !data.category || !data.basePrice) {
    return res.status(400).json({ error: 'Title, category, and base price are required.' });
  }

  const db = getDB();
  const slug = (data.title as string)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    slug: data.slug || slug,
    title: data.title,
    subtitle: data.subtitle || '',
    description: data.description || '',
    category: data.category,
    tags: Array.isArray(data.tags) ? data.tags : ['Streetwear'],
    basePrice: Number(data.basePrice),
    discountPrice: data.discountPrice ? Number(data.discountPrice) : undefined,
    isFeatured: Boolean(data.isFeatured),
    isPublished: data.isPublished !== undefined ? Boolean(data.isPublished) : true,
    colorGroups: data.colorGroups || [],
    variants: data.variants || [],
    details: data.details || {
      fabric: '100% Combed Cotton',
      fit: 'Oversized boxy silhouette',
      care: 'Cold wash'
    },
    rating: 5.0,
    reviewsCount: 0,
    createdAt: new Date().toISOString()
  };

  db.products.unshift(newProduct);
  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'PRODUCT_CREATED',
    details: `Created product "${newProduct.title}" with ${newProduct.variants.length} variants.`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.status(201).json({ product: newProduct });
});

// Admin: Update product
productsRouter.put('/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const data = req.body;
  Object.assign(product, data);

  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'PRODUCT_UPDATED',
    details: `Updated product "${product.title}" (${product.id}).`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ product });
});

// Admin: Delete product
productsRouter.delete('/admin/products/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = getDB();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });

  const removed = db.products.splice(index, 1)[0];
  db.adminLogs.unshift({
    id: `log_${Date.now()}`,
    adminEmail: req.user!.email,
    action: 'PRODUCT_DELETED',
    details: `Deleted product "${removed.title}" (${removed.id}).`,
    timestamp: new Date().toISOString()
  });

  saveDB();
  return res.json({ success: true, message: 'Product deleted.' });
});

// Admin: Bulk import products (CSV or JSON array)
productsRouter.post('/admin/products/bulk-import', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'Valid products array is required.' });
  }

  const db = getDB();
  let importedCount = 0;
  const errors: string[] = [];

  for (const item of products) {
    if (!item.title || !item.basePrice) {
      errors.push(`Row missing title or price: ${JSON.stringify(item).substring(0, 40)}`);
      continue;
    }

    const slug = (item.title as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 5);

    const newProd: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      slug,
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description || 'Premium 4 LAZY streetwear silhouette.',
      category: item.category || 'Round Neck T-Shirt',
      tags: Array.isArray(item.tags) ? item.tags : ['New Arrival'],
      basePrice: Number(item.basePrice),
      discountPrice: item.discountPrice ? Number(item.discountPrice) : undefined,
      isFeatured: false,
      isPublished: true,
      colorGroups: item.colorGroups || [
        { colorName: 'Washed Black', colorHex: '#141416', images: ['/assets/images/product_oversized_heavy_tee_1794056020516.jpg'] }
      ],
      variants: item.variants || [
        {
          id: `var_${Date.now()}_m`,
          colorName: 'Washed Black',
          colorHex: '#141416',
          size: 'M',
          sku: `4L-IMP-${Math.floor(1000 + Math.random() * 9000)}-M`,
          stock: 25,
          images: ['/assets/images/product_oversized_heavy_tee_1794056020516.jpg']
        }
      ],
      details: item.details || {
        fabric: '100% Combed Cotton',
        fit: 'Boxy streetwear fit',
        care: 'Cold wash'
      },
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString()
    };

    db.products.push(newProd);
    importedCount++;
  }

  saveDB();
  return res.json({
    success: true,
    importedCount,
    errors,
    message: `Successfully imported ${importedCount} product(s).`
  });
});
