import type { Product, Category } from '../types/index.ts';

const heroImg = '/assets/images/hero_streetwear_campaign_1794056018871.jpg';
const teeImg = '/assets/images/product_oversized_heavy_tee_1794056020516.jpg';
const hoodieImg = '/assets/images/product_streetwear_hoodie_1794056020931.jpg';
const cargoImg = '/assets/images/product_cargo_trousers_1794056021752.jpg';
const lookbookImg = '/assets/images/campaign_editorial_lookbook_1794056022183.jpg';
const joggersImg = '/assets/images/streetwear_sweatpants_joggers_1794058915788.jpg';
const overshirtImg = '/assets/images/minimalist_overshirt_jacket_1794058915149.jpg';
const logoImg = '/assets/aistudio/Picsart_25-05-26_04-50-01-827_3ef209bd.png';

export const fallbackCategories: Category[] = [
  { id: 'cat_oversized_tees', slug: 'oversized-t-shirts', name: 'Oversized T-Shirts', description: '280–300 GSM combed luxury cotton with exaggerated drop-shoulder drape.', image: teeImg, itemCount: 18 },
  { id: 'cat_hoodies', slug: 'hoodies-sweatshirts', name: 'Hoodies & Sweatshirts', description: '500 GSM custom-knit French Terry boxy hoodies engineered for structure.', image: hoodieImg, itemCount: 12 },
  { id: 'cat_trousers', slug: 'trousers-cargo', name: 'Trousers & Cargo', description: 'Tailored utilitarian cargos and relaxed wide-leg trousers.', image: cargoImg, itemCount: 10 },
  { id: 'cat_jackets', slug: 'jackets-outerwear', name: 'Jackets & Outerwear', description: 'Brutalist minimalist zip jackets, chore coats, and overshirts.', image: overshirtImg, itemCount: 8 },
  { id: 'cat_joggers', slug: 'joggers-sweatpants', name: 'Joggers & Sweatpants', description: 'Heavyweight cuffed sweatpants with custom ribbed hems and deep pockets.', image: joggersImg, itemCount: 7 },
  { id: 'cat_shirts', slug: 'shirts', name: 'Shirts', description: 'Heavyweight architectural utility shackets and boxy overshirts.', image: overshirtImg, itemCount: 6 },
  { id: 'cat_coords', slug: 'co-ord-sets', name: 'Co-ord Sets', description: 'Monochrome two-piece streetwear silhouettes crafted from matched yarn.', image: lookbookImg, itemCount: 5 },
  { id: 'cat_accessories', slug: 'accessories', name: 'Accessories', description: 'Tactical crossbody pouches, beanies, and solid brass accessories.', image: logoImg, itemCount: 4 }
];

export const fallbackProducts: Product[] = [
  {
    id: 'prod_heavy_tee_01',
    slug: 'heavyweight-oversized-box-tee',
    title: 'Heavyweight Oversized Box Tee',
    subtitle: '280 GSM Combed Cotton · Drop-Shoulder Silhouette',
    description: 'The definitive everyday streetwear silhouette. Crafted from custom-knit 280 GSM combed cotton jersey, pre-shrunk with a vintage garment wash. Features an exaggerated drop-shoulder cut, structured rib collar that retains its shape, and clean double-needle hems.',
    category: 'Oversized T-Shirts',
    tags: ['Bestseller', 'Heavyweight', 'Oversized', 'Streetwear'],
    basePrice: 1999,
    discountPrice: 1699,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Black', colorHex: '#1c1b1f', images: [teeImg, heroImg] },
      { colorName: 'Vintage Bone', colorHex: '#ebe7df', images: [cargoImg, heroImg] },
      { colorName: 'Charcoal Grey', colorHex: '#3b3b40', images: [hoodieImg, teeImg] }
    ],
    variants: [
      { id: 'var_tee_wb_s', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'S', sku: '4L-TEE-WB-S', stock: 24, images: [teeImg, heroImg] },
      { id: 'var_tee_wb_m', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'M', sku: '4L-TEE-WB-M', stock: 38, images: [teeImg, heroImg] },
      { id: 'var_tee_wb_l', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'L', sku: '4L-TEE-WB-L', stock: 42, images: [teeImg, heroImg] },
      { id: 'var_tee_wb_xl', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'XL', sku: '4L-TEE-WB-XL', stock: 18, images: [teeImg, heroImg] },
      { id: 'var_tee_wb_xxl', colorName: 'Washed Black', colorHex: '#1c1b1f', size: 'XXL', sku: '4L-TEE-WB-XXL', stock: 9, images: [teeImg, heroImg] },
      { id: 'var_tee_vb_m', colorName: 'Vintage Bone', colorHex: '#ebe7df', size: 'M', sku: '4L-TEE-VB-M', stock: 28, images: [cargoImg, heroImg] },
      { id: 'var_tee_vb_l', colorName: 'Vintage Bone', colorHex: '#ebe7df', size: 'L', sku: '4L-TEE-VB-L', stock: 30, images: [cargoImg, heroImg] }
    ],
    details: {
      fabric: '100% Combed Compact Cotton',
      gsm: 280,
      fit: 'Boxy, oversized drop-shoulder cut. True to streetwear fit.',
      care: 'Machine wash cold inside out with like colors. Hang dry or tumble dry low.',
      modelStats: 'Model is 6\'1" (185 cm) wearing size L.'
    },
    rating: 4.9,
    reviewsCount: 38,
    createdAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'prod_hoodie_01',
    slug: '500gsm-french-terry-boxy-hoodie',
    title: '500 GSM French Terry Boxy Hoodie',
    subtitle: 'Heavyweight Custom Terry · Double Layer Hood · Zero Drawstrings',
    description: 'Engineered for sculptural presence and tactile comfort. Made with our heaviest 500 GSM custom-looped French Terry cotton. Designed without drawstrings for a pure minimalist neckline, deep kangaroo pocket, and rib-knit side gussets for mobility.',
    category: 'Hoodies & Sweatshirts',
    tags: ['Flagship', 'Heavyweight', 'Winter Essential'],
    basePrice: 4299,
    discountPrice: 3899,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Vintage Charcoal', colorHex: '#323237', images: [hoodieImg, heroImg] },
      { colorName: 'Washed Black', colorHex: '#141416', images: [teeImg, hoodieImg] }
    ],
    variants: [
      { id: 'var_hood_vc_s', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'S', sku: '4L-HD-VC-S', stock: 16, images: [hoodieImg, heroImg] },
      { id: 'var_hood_vc_m', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'M', sku: '4L-HD-VC-M', stock: 25, images: [hoodieImg, heroImg] },
      { id: 'var_hood_vc_l', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'L', sku: '4L-HD-VC-L', stock: 29, images: [hoodieImg, heroImg] },
      { id: 'var_hood_vc_xl', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'XL', sku: '4L-HD-VC-XL', stock: 14, images: [hoodieImg, heroImg] }
    ],
    details: {
      fabric: '100% Cotton 500 GSM Loopback French Terry',
      gsm: 500,
      fit: 'Structured oversized fit with wide chest and relaxed sleeves.',
      care: 'Dry clean recommended or gentle cold machine wash.',
      modelStats: 'Model is 6\'2" wearing size L.'
    },
    rating: 5.0,
    reviewsCount: 52,
    createdAt: '2026-01-20T11:00:00Z'
  },
  {
    id: 'prod_cargo_01',
    slug: 'relaxed-pleated-cargo-trousers',
    title: 'Relaxed Pleated Cargo Trousers',
    subtitle: 'Tailored Heavy Twill · Magnetic Pocket Flaps · Straight Wide Leg',
    description: 'The intersection of sartorial tailoring and utilitarian functionalism. High-density cotton twill featuring tailored double-front pleats, flush-mount 3D cargo pockets with hidden magnetic closures, and adjustable cinch hems.',
    category: 'Trousers & Cargo',
    tags: ['Tailored', 'Utility', 'New Arrival'],
    basePrice: 3799,
    discountPrice: 3299,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Bone Off-White', colorHex: '#e5e1d7', images: [cargoImg, heroImg] },
      { colorName: 'Pitch Black', colorHex: '#111112', images: [lookbookImg, cargoImg] }
    ],
    variants: [
      { id: 'var_crg_bo_s', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'S', sku: '4L-CG-BO-S', stock: 12, images: [cargoImg, heroImg] },
      { id: 'var_crg_bo_m', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'M', sku: '4L-CG-BO-M', stock: 22, images: [cargoImg, heroImg] },
      { id: 'var_crg_bo_l', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'L', sku: '4L-CG-BO-L', stock: 26, images: [cargoImg, heroImg] },
      { id: 'var_crg_bo_xl', colorName: 'Bone Off-White', colorHex: '#e5e1d7', size: 'XL', sku: '4L-CG-BO-XL', stock: 10, images: [cargoImg, heroImg] }
    ],
    details: {
      fabric: '100% High-Density Cotton Twill',
      gsm: 340,
      fit: 'Relaxed wide-leg with tailored waist.',
      care: 'Machine wash gentle or dry clean.',
      modelStats: 'Model is 6\'0" wearing size 32 (M).'
    },
    rating: 4.8,
    reviewsCount: 29,
    createdAt: '2026-02-05T14:00:00Z'
  },
  {
    id: 'prod_jacket_01',
    slug: 'brutalist-minimalist-zip-jacket',
    title: 'Brutalist Minimalist Zip Jacket',
    subtitle: 'Brushed Heavy Canvas · Gunmetal Hardware · Boxy Silhouette',
    description: 'A heavyweight architectural layering anchor. Fabricated from custom 420 GSM washed cotton canvas. Features a heavy-gauge two-way YKK gunmetal zipper, sharp spread collar, and hidden in-seam hand warmer pockets.',
    category: 'Jackets & Outerwear',
    tags: ['Outerwear', 'Statement', 'Limited Edition'],
    basePrice: 5499,
    discountPrice: 4799,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Muted Taupe', colorHex: '#524b43', images: [overshirtImg, lookbookImg] },
      { colorName: 'Obsidian Black', colorHex: '#18181a', images: [hoodieImg, cargoImg] }
    ],
    variants: [
      { id: 'var_jkt_mt_s', colorName: 'Muted Taupe', colorHex: '#524b43', size: 'S', sku: '4L-JK-MT-S', stock: 8, images: [overshirtImg, lookbookImg] },
      { id: 'var_jkt_mt_m', colorName: 'Muted Taupe', colorHex: '#524b43', size: 'M', sku: '4L-JK-MT-M', stock: 15, images: [overshirtImg, lookbookImg] },
      { id: 'var_jkt_mt_l', colorName: 'Muted Taupe', colorHex: '#524b43', size: 'L', sku: '4L-JK-MT-L', stock: 18, images: [overshirtImg, lookbookImg] },
      { id: 'var_jkt_mt_xl', colorName: 'Muted Taupe', colorHex: '#524b43', size: 'XL', sku: '4L-JK-MT-XL', stock: 6, images: [overshirtImg, lookbookImg] }
    ],
    details: {
      fabric: '420 GSM 100% Washed Cotton Duck Canvas with Cupro Lining',
      gsm: 420,
      fit: 'Cropped boxy cut designed for structured layering.',
      care: 'Specialist dry clean only.',
      modelStats: 'Model is 6\'2" wearing size L.'
    },
    rating: 4.9,
    reviewsCount: 19,
    createdAt: '2026-02-18T16:00:00Z'
  },
  {
    id: 'prod_joggers_01',
    slug: '500gsm-heavy-loopback-sweatpants',
    title: '500 GSM Heavy Loopback Sweatpants',
    subtitle: 'Custom French Terry · Relaxed Straight Drape · Concealed Zipper Pockets',
    description: 'Built to match the substance of our flagship hoodies. Crafted from unbrushed 500 GSM loopback cotton terry with an elastic waistband and tonal thick cotton drawcord. Includes concealed zipper side pockets.',
    category: 'Joggers & Sweatpants',
    tags: ['Heavyweight', 'Comfort', 'Essential'],
    basePrice: 3499,
    discountPrice: 2999,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Vintage Charcoal', colorHex: '#323237', images: [joggersImg, hoodieImg] },
      { colorName: 'Washed Black', colorHex: '#141416', images: [joggersImg, teeImg] }
    ],
    variants: [
      { id: 'var_jog_vc_s', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'S', sku: '4L-JG-VC-S', stock: 14, images: [joggersImg, hoodieImg] },
      { id: 'var_jog_vc_m', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'M', sku: '4L-JG-VC-M', stock: 20, images: [joggersImg, hoodieImg] },
      { id: 'var_jog_vc_l', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'L', sku: '4L-JG-VC-L', stock: 22, images: [joggersImg, hoodieImg] },
      { id: 'var_jog_vc_xl', colorName: 'Vintage Charcoal', colorHex: '#323237', size: 'XL', sku: '4L-JG-VC-XL', stock: 11, images: [joggersImg, hoodieImg] }
    ],
    details: {
      fabric: '100% Cotton 500 GSM French Terry',
      gsm: 500,
      fit: 'Relaxed straight drape through leg with cinchable hem toggle.',
      care: 'Machine wash cold inside out.',
      modelStats: 'Model is 6\'1" wearing size M.'
    },
    rating: 4.8,
    reviewsCount: 31,
    createdAt: '2026-02-12T10:00:00Z'
  },
  {
    id: 'prod_overshirt_01',
    slug: 'architectural-boxy-utility-overshirt',
    title: 'Architectural Boxy Utility Overshirt',
    subtitle: '320 GSM Heavy Twill · Flap Utility Pockets · Matte Snap Closures',
    description: 'A versatile transitional shacket cut with exaggerated width and dropped shoulder seams. Structured 320 GSM cotton twill with dual gusseted chest flap pockets and tonal matte rubberized snap buttons.',
    category: 'Shirts',
    tags: ['Shacket', 'Utility', 'Modern Minimal'],
    basePrice: 3899,
    discountPrice: 3499,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Olive Drab', colorHex: '#3c4033', images: [overshirtImg, lookbookImg] },
      { colorName: 'Bone Off-White', colorHex: '#e5e1d7', images: [overshirtImg, cargoImg] }
    ],
    variants: [
      { id: 'var_ovs_od_s', colorName: 'Olive Drab', colorHex: '#3c4033', size: 'S', sku: '4L-OS-OD-S', stock: 10, images: [overshirtImg, lookbookImg] },
      { id: 'var_ovs_od_m', colorName: 'Olive Drab', colorHex: '#3c4033', size: 'M', sku: '4L-OS-OD-M', stock: 18, images: [overshirtImg, lookbookImg] },
      { id: 'var_ovs_od_l', colorName: 'Olive Drab', colorHex: '#3c4033', size: 'L', sku: '4L-OS-OD-L', stock: 24, images: [overshirtImg, lookbookImg] },
      { id: 'var_ovs_od_xl', colorName: 'Olive Drab', colorHex: '#3c4033', size: 'XL', sku: '4L-OS-OD-XL', stock: 9, images: [overshirtImg, lookbookImg] }
    ],
    details: {
      fabric: '100% Structured Cotton Compact Twill',
      gsm: 320,
      fit: 'Oversized boxy overshirt with straight hem.',
      care: 'Machine wash cold with like colors.',
      modelStats: 'Model is 6\'2" wearing size L.'
    },
    rating: 4.9,
    reviewsCount: 22,
    createdAt: '2026-02-14T15:00:00Z'
  },
  {
    id: 'prod_tee_02',
    slug: 'vanguard-raw-hem-acid-wash-tee',
    title: 'Vanguard Raw Hem Acid Wash Tee',
    subtitle: '300 GSM Heavy Jersey · Mineral Distressed Wash · Raw Edge Finishes',
    description: 'Each piece is individually mineral-treated for a unique vintage marbled patina. Finished with subtle distressing along the neckband and raw unfinished sleeve edges.',
    category: 'Oversized T-Shirts',
    tags: ['Vintage', 'Acid Wash', 'Heavyweight'],
    basePrice: 2299,
    discountPrice: 1899,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Acid Charcoal', colorHex: '#2a2b2f', images: [teeImg, lookbookImg] },
      { colorName: 'Acid Sand', colorHex: '#8c8577', images: [lookbookImg, teeImg] }
    ],
    variants: [
      { id: 'var_vng_ac_s', colorName: 'Acid Charcoal', colorHex: '#2a2b2f', size: 'S', sku: '4L-VG-AC-S', stock: 15, images: [teeImg, lookbookImg] },
      { id: 'var_vng_ac_m', colorName: 'Acid Charcoal', colorHex: '#2a2b2f', size: 'M', sku: '4L-VG-AC-M', stock: 25, images: [teeImg, lookbookImg] },
      { id: 'var_vng_ac_l', colorName: 'Acid Charcoal', colorHex: '#2a2b2f', size: 'L', sku: '4L-VG-AC-L', stock: 32, images: [teeImg, lookbookImg] },
      { id: 'var_vng_ac_xl', colorName: 'Acid Charcoal', colorHex: '#2a2b2f', size: 'XL', sku: '4L-VG-AC-XL', stock: 14, images: [teeImg, lookbookImg] }
    ],
    details: {
      fabric: '100% Combed Compact Cotton with Mineral Acid Wash',
      gsm: 300,
      fit: 'Wide drop-shoulder box cut with slight elongation.',
      care: 'Hand wash or gentle cold machine wash.',
      modelStats: 'Model is 6\'1" wearing size L.'
    },
    rating: 5.0,
    reviewsCount: 44,
    createdAt: '2026-02-22T13:00:00Z'
  },
  {
    id: 'prod_hoodie_02',
    slug: 'dual-zipper-heavyweight-boxy-hoodie',
    title: 'Dual-Zipper Heavyweight Boxy Hoodie',
    subtitle: '500 GSM Loopback Fleece · Two-Way Raccagni Zipper · Dropped Shoulder',
    description: 'An architectural re-engineering of the classic zip hoodie. 500 GSM loopback cotton fleece with a heavy-duty two-way zipper allowing custom flare and silhouette adjustments at the hem.',
    category: 'Hoodies & Sweatshirts',
    tags: ['Zip Hoodie', 'Two-Way Zip', 'Heavyweight'],
    basePrice: 4699,
    discountPrice: 4199,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Black', colorHex: '#141416', images: [hoodieImg, teeImg] },
      { colorName: 'Bone Heather', colorHex: '#d8d3c5', images: [hoodieImg, cargoImg] }
    ],
    variants: [
      { id: 'var_dz_wb_s', colorName: 'Washed Black', colorHex: '#141416', size: 'S', sku: '4L-DZ-WB-S', stock: 12, images: [hoodieImg, teeImg] },
      { id: 'var_dz_wb_m', colorName: 'Washed Black', colorHex: '#141416', size: 'M', sku: '4L-DZ-WB-M', stock: 18, images: [hoodieImg, teeImg] },
      { id: 'var_dz_wb_l', colorName: 'Washed Black', colorHex: '#141416', size: 'L', sku: '4L-DZ-WB-L', stock: 22, images: [hoodieImg, teeImg] },
      { id: 'var_dz_wb_xl', colorName: 'Washed Black', colorHex: '#141416', size: 'XL', sku: '4L-DZ-WB-XL', stock: 8, images: [hoodieImg, teeImg] }
    ],
    details: {
      fabric: '100% Heavy French Terry Loopback Cotton',
      gsm: 500,
      fit: 'Boxy streetwear fit with substantial sleeve stack.',
      care: 'Dry clean or cold wash inside out.',
      modelStats: 'Model is 6\'2" wearing size L.'
    },
    rating: 4.9,
    reviewsCount: 16,
    createdAt: '2026-02-25T11:00:00Z'
  },
  {
    id: 'prod_trousers_02',
    slug: 'tailored-wide-leg-pleated-trousers',
    title: 'Tailored Wide-Leg Pleated Trousers',
    subtitle: 'Wool-Cotton Suiting Blend · Double Forward Pleats · Flowing Drape',
    description: 'Elevated brutalism for evening wear and modern tailoring. Custom wool-cotton blend with deep forward double pleats, slanted pockets, and clean rear welt pockets with horn buttons.',
    category: 'Trousers & Cargo',
    tags: ['Tailored', 'Formal Streetwear', 'Pleated'],
    basePrice: 4299,
    discountPrice: 3799,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Midnight Navy', colorHex: '#1b2230', images: [cargoImg, lookbookImg] },
      { colorName: 'Charcoal Black', colorHex: '#212124', images: [cargoImg, overshirtImg] }
    ],
    variants: [
      { id: 'var_tw_mn_s', colorName: 'Midnight Navy', colorHex: '#1b2230', size: 'S', sku: '4L-TW-MN-S', stock: 10, images: [cargoImg, lookbookImg] },
      { id: 'var_tw_mn_m', colorName: 'Midnight Navy', colorHex: '#1b2230', size: 'M', sku: '4L-TW-MN-M', stock: 16, images: [cargoImg, lookbookImg] },
      { id: 'var_tw_mn_l', colorName: 'Midnight Navy', colorHex: '#1b2230', size: 'L', sku: '4L-TW-MN-L', stock: 20, images: [cargoImg, lookbookImg] },
      { id: 'var_tw_mn_xl', colorName: 'Midnight Navy', colorHex: '#1b2230', size: 'XL', sku: '4L-TW-MN-XL', stock: 7, images: [cargoImg, lookbookImg] }
    ],
    details: {
      fabric: '65% Cotton, 35% Merino Wool Tailored Suiting',
      gsm: 310,
      fit: 'Dramatic wide leg with fluid drape and clean break.',
      care: 'Dry clean recommended.',
      modelStats: 'Model is 6\'1" wearing size 32 (M).'
    },
    rating: 4.9,
    reviewsCount: 14,
    createdAt: '2026-03-01T12:00:00Z'
  },
  {
    id: 'prod_coord_01',
    slug: 'monochrome-brutalist-co-ord-set',
    title: 'Monochrome Brutalist Co-ord Set',
    subtitle: 'Matching 450 GSM Oversized Crewneck & Relaxed Sweatpants',
    description: 'Complete sartorial ease in one monochromatic package. Features our 450 GSM heavyweight box crewneck paired with matched relaxed straight-leg sweatpants, knit from the identical dye-lot yarn.',
    category: 'Co-ord Sets',
    tags: ['Co-ord', 'Set', 'Limited Drop'],
    basePrice: 6999,
    discountPrice: 5999,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Concrete', colorHex: '#484b52', images: [lookbookImg, hoodieImg] },
      { colorName: 'Deep Onyx', colorHex: '#0f0f10', images: [teeImg, joggersImg] }
    ],
    variants: [
      { id: 'var_co_wc_s', colorName: 'Washed Concrete', colorHex: '#484b52', size: 'S', sku: '4L-CO-WC-S', stock: 8, images: [lookbookImg, hoodieImg] },
      { id: 'var_co_wc_m', colorName: 'Washed Concrete', colorHex: '#484b52', size: 'M', sku: '4L-CO-WC-M', stock: 14, images: [lookbookImg, hoodieImg] },
      { id: 'var_co_wc_l', colorName: 'Washed Concrete', colorHex: '#484b52', size: 'L', sku: '4L-CO-WC-L', stock: 16, images: [lookbookImg, hoodieImg] },
      { id: 'var_co_wc_xl', colorName: 'Washed Concrete', colorHex: '#484b52', size: 'XL', sku: '4L-CO-WC-XL', stock: 5, images: [lookbookImg, hoodieImg] }
    ],
    details: {
      fabric: '100% Premium Combed Cotton French Terry',
      gsm: 450,
      fit: 'Matching relaxed drop-shoulder set.',
      care: 'Machine wash cold inside out.',
      modelStats: 'Model is 6\'2" wearing size L.'
    },
    rating: 5.0,
    reviewsCount: 27,
    createdAt: '2026-03-02T16:00:00Z'
  }
];
