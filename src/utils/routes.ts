export interface CategoryRouteMeta {
  slug: string;
  name: string;
  shortLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
}

export const CATEGORY_ROUTE_META: CategoryRouteMeta[] = [
  {
    slug: 'round-neck-t-shirt',
    name: 'Round Neck T-Shirt',
    shortLabel: 'Round Neck',
    heroTitle: 'Round Neck T-Shirts',
    heroDescription: 'Essential 280–320 GSM combed cotton crewnecks built with reinforced anti-collapse ribbed collars and architectural drape.',
    heroImage: '/assets/images/tshirt_round_neck_1794456303307.jpg'
  },
  {
    slug: 'polo-neck-t-shirt',
    name: 'Polo Neck T-Shirt',
    shortLabel: 'Polo Neck',
    heroTitle: 'Polo Neck T-Shirts',
    heroDescription: 'Structured knit polo collars, quarter-zip necklines, and crisp 290–300 GSM tailored streetwear silhouettes.',
    heroImage: '/assets/images/tshirt_polo_neck_1794456301588.jpg'
  },
  {
    slug: 'down-shoulder-t-shirt',
    name: 'Down Shoulder T-Shirt',
    shortLabel: 'Down Shoulder',
    heroTitle: 'Down Shoulder T-Shirts',
    heroDescription: 'Exaggerated boxy silhouettes with lowered shoulder seams, generous sleeve drop, and heavyweight 280–310 GSM street drape.',
    heroImage: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg'
  },
  {
    slug: 'customise-t-shirt',
    name: 'Customise T-Shirt',
    shortLabel: 'Customise',
    heroTitle: 'Customise T-Shirts',
    heroDescription: 'Upload your artwork or custom typography on rotatable 3D heavyweight blanks with 3D Silicone Puff, Foil, or HD Screen Prints.',
    heroImage: '/assets/images/tshirt_custom_print_1794456303137.jpg'
  },
  {
    slug: 'laazy-designs',
    name: 'Laazy Designs',
    shortLabel: 'Laazy Designs',
    heroTitle: 'Laazy Designs Atelier',
    heroDescription: 'Signature in-house graphic releases, mineral acid washes, puff-ink back prints, and editorial archive tees.',
    heroImage: '/assets/images/tshirt_acid_wash_1794456303446.jpg'
  },
  {
    slug: 'limited-design',
    name: 'Limited Design',
    shortLabel: 'Limited Design',
    heroTitle: 'Limited Design Capsule',
    heroDescription: 'Numbered small-batch collector editions crafted in small runs and never restocked once sold out.',
    heroImage: '/assets/images/campaign_editorial_lookbook_1794056022183.jpg'
  }
];

export const VALID_DASHBOARD_TABS = [
  'overview',
  'products',
  'inventory',
  'notify-requests',
  'orders',
  'payments',
  'returns',
  'customers',
  'tally',
  'content',
  'coupons',
  'settings',
  'emails'
] as const;

export function toSlug(input: string): string {
  return (input || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function resolveCategoryFromSlugOrName(input?: string): string {
  if (!input || input === 'all') return 'all';
  const clean = input.trim().toLowerCase();
  if (clean === 'trending') return 'trending';

  const matched = CATEGORY_ROUTE_META.find(
    m =>
      m.slug === clean ||
      m.name.toLowerCase() === clean ||
      m.shortLabel.toLowerCase() === clean ||
      clean.replace(/-/g, ' ') === m.name.toLowerCase()
  );
  if (matched) return matched.name;

  if (clean === 'polo' || clean === 'polo-t-shirt' || clean === 'polo-neck') {
    return 'Polo Neck T-Shirt';
  }
  if (clean === 'down-shoulder' || clean === 'drop-shoulder') {
    return 'Down Shoulder T-Shirt';
  }
  if (clean === 'customise' || clean === 'customize' || clean === 'custom-print') {
    return 'Customise T-Shirt';
  }
  if (clean === 'round-neck') {
    return 'Round Neck T-Shirt';
  }
  return input;
}

export function categoryToSlug(categoryName?: string): string {
  if (!categoryName || categoryName === 'all') return 'all';
  if (categoryName.toLowerCase() === 'trending') return 'trending';
  const resolved = resolveCategoryFromSlugOrName(categoryName);
  const meta = CATEGORY_ROUTE_META.find(m => m.name.toLowerCase() === resolved.toLowerCase());
  return meta ? meta.slug : toSlug(categoryName);
}

export function getCategoryMeta(categoryName?: string): CategoryRouteMeta | null {
  if (!categoryName || categoryName === 'all') return null;
  const resolved = resolveCategoryFromSlugOrName(categoryName);
  return CATEGORY_ROUTE_META.find(m => m.name.toLowerCase() === resolved.toLowerCase()) || null;
}
