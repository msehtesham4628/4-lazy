import type { Product, Category } from '../types/index.ts';

const heroImg = '/assets/images/hero_streetwear_campaign_1794056018871.jpg';
const teeImg = '/assets/images/product_oversized_heavy_tee_1794056020516.jpg';
const poloImg = '/assets/images/tshirt_polo_neck_1794456301588.jpg';
const customPrintImg = '/assets/images/tshirt_custom_print_1794456303137.jpg';
const roundNeckImg = '/assets/images/tshirt_round_neck_1794456303307.jpg';
const acidWashImg = '/assets/images/tshirt_acid_wash_1794456303446.jpg';
const lookbookImg = '/assets/images/campaign_editorial_lookbook_1794056022183.jpg';

export const fallbackCategories: Category[] = [
  {
    id: 'cat_round_neck',
    slug: 'round-neck-t-shirt',
    name: 'Round Neck T-Shirt',
    description: 'Essential 280–320 GSM combed cotton crewnecks with reinforced anti-collapse ribbed collars.',
    image: roundNeckImg,
    heroImage: roundNeckImg,
    itemCount: 4
  },
  {
    id: 'cat_polo_neck',
    slug: 'polo-neck-t-shirt',
    name: 'Polo Neck T-Shirt',
    description: 'Structured knit polo tees, quarter-zips, and crisp collar silhouettes in 290–300 GSM cotton.',
    image: poloImg,
    heroImage: poloImg,
    itemCount: 4
  },
  {
    id: 'cat_down_shoulder',
    slug: 'down-shoulder-t-shirt',
    name: 'Down Shoulder T-Shirt',
    description: 'Exaggerated boxy silhouettes with lowered shoulder seams and heavyweight street drape.',
    image: teeImg,
    heroImage: teeImg,
    itemCount: 4
  },
  {
    id: 'cat_customise',
    slug: 'customise-t-shirt',
    name: 'Customise T-Shirt',
    description: 'Design your own 3D T-shirt with custom artwork uploads, typography, and puff or screen prints.',
    image: customPrintImg,
    heroImage: customPrintImg,
    itemCount: 4
  },
  {
    id: 'cat_laazy_designs',
    slug: 'laazy-designs',
    name: 'Laazy Designs',
    description: 'Signature in-house graphic prints, mineral acid washes, and expressive editorial tees.',
    image: acidWashImg,
    heroImage: acidWashImg,
    itemCount: 4
  },
  {
    id: 'cat_limited_design',
    slug: 'limited-design',
    name: 'Limited Design',
    description: 'Numbered small-batch collector drops and heavyweight capsule releases—never restocked.',
    image: lookbookImg,
    heroImage: lookbookImg,
    itemCount: 4
  }
];

const SLIDE_POOL = [
  roundNeckImg,
  teeImg,
  poloImg,
  customPrintImg,
  acidWashImg,
  lookbookImg,
  heroImg
];

function fourSlides(primary: string, secondary: string): string[] {
  const result = [primary, secondary];
  for (const candidate of SLIDE_POOL) {
    if (result.length >= 4) break;
    if (!result.includes(candidate)) {
      result.push(candidate);
    }
  }
  return result.slice(0, 4);
}

function makeVariants(prefix: string, colorName: string, colorHex: string, images: string[], stockBase = 24) {
  const slides = fourSlides(images[0] || teeImg, images[1] || lookbookImg);
  return (['S', 'M', 'L', 'XL'] as const).map((size, idx) => ({
    id: `var_${prefix}_${size.toLowerCase()}`,
    colorName,
    colorHex,
    size,
    sku: `4L-${prefix.toUpperCase()}-${size}`,
    stock: Math.max(4, stockBase - idx * 3),
    images: slides
  }));
}

const rawFallbackProducts: Product[] = [
  // 1. ROUND NECK T-SHIRT (4 products)
  {
    id: 'prod_round_01',
    slug: 'signature-heavy-combed-round-neck-tee',
    title: 'Signature Heavy Combed Round Neck T-Shirt',
    subtitle: '280 GSM Pure Cotton · Thick Ribbed Collar · Pre-Shrunk',
    description: 'Cut from substantial 280 GSM ringspun cotton with a high, snug round neckline and balanced sleeves that retain shape wash after wash.',
    category: 'Round Neck T-Shirt',
    tags: ['Trending', 'Round Neck', '280 GSM'],
    basePrice: 1799,
    discountPrice: 1499,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Slate Charcoal', colorHex: '#2f3136', images: [roundNeckImg, teeImg] },
      { colorName: 'Pitch Black', colorHex: '#111112', images: [teeImg, roundNeckImg] },
      { colorName: 'Pure White', colorHex: '#f5f5f5', images: [customPrintImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('RN01-SC', 'Slate Charcoal', '#2f3136', [roundNeckImg, teeImg], 28),
      ...makeVariants('RN01-PB', 'Pitch Black', '#111112', [teeImg, roundNeckImg], 22)
    ],
    details: { fabric: '100% Ringspun Heavyweight Cotton', gsm: 280, fit: 'Relaxed modern crewneck', care: 'Cold gentle wash', modelStats: '6\'0" wearing size M' },
    rating: 5.0,
    reviewsCount: 62,
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'prod_round_02',
    slug: 'monolith-320gsm-thick-collar-crewneck',
    title: 'Monolith 320 GSM Round Neck Blank',
    subtitle: 'Ultra-Dense 320 GSM Jersey · 1.5" Ribbed Neckline',
    description: 'Our heaviest round neck blank woven with dual-twisted 320 GSM yarn for sculptural structure and zero wrinkling.',
    category: 'Round Neck T-Shirt',
    tags: ['Round Neck', '320 GSM', 'Blank'],
    basePrice: 2099,
    discountPrice: 1799,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Pure White', colorHex: '#f5f5f7', images: [roundNeckImg, customPrintImg] },
      { colorName: 'Washed Black', colorHex: '#18181a', images: [teeImg, poloImg] }
    ],
    variants: [
      ...makeVariants('RN02-PW', 'Pure White', '#f5f5f7', [roundNeckImg, customPrintImg], 24),
      ...makeVariants('RN02-WB', 'Washed Black', '#18181a', [teeImg, poloImg], 20)
    ],
    details: { fabric: '320 GSM Heavy Combed Cotton', gsm: 320, fit: 'Square box cut', care: 'Wash cold. Air dry.', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 37,
    createdAt: '2026-02-28T15:00:00Z'
  },
  {
    id: 'prod_round_03',
    slug: 'essential-sandstone-round-neck-tee',
    title: 'Sandstone Bio-Wash Round Neck Tee',
    subtitle: '260 GSM Peached Cotton · Soft-Touch Crewneck',
    description: 'Enzyme bio-washed for a suede-like hand feel with reinforced shoulder taping and zero-twist collar elasticity.',
    category: 'Round Neck T-Shirt',
    tags: ['Round Neck', 'Bio-Wash', 'Daily'],
    basePrice: 1699,
    discountPrice: 1399,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Sandstone Bone', colorHex: '#d9d2c5', images: [customPrintImg, roundNeckImg] },
      { colorName: 'Obsidian Black', colorHex: '#141416', images: [teeImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('RN03-SB', 'Sandstone Bone', '#d9d2c5', [customPrintImg, roundNeckImg], 26),
      ...makeVariants('RN03-OB', 'Obsidian Black', '#141416', [teeImg, roundNeckImg], 18)
    ],
    details: { fabric: '260 GSM Bio-Washed Combed Cotton', gsm: 260, fit: 'Classic tailored streetwear fit', care: 'Gentle cold wash', modelStats: '5\'11" wearing size M' },
    rating: 4.8,
    reviewsCount: 29,
    createdAt: '2026-02-24T12:00:00Z'
  },
  {
    id: 'prod_round_04',
    slug: 'studio-graphite-micro-rib-round-neck-tee',
    title: 'Graphite Micro-Rib Round Neck T-Shirt',
    subtitle: '290 GSM Compact Knit · Tonal Stitch Framing',
    description: 'Dense compact cotton jersey finished with twin-needle flatlock seams and an elevated mock-height ribbed crewneck.',
    category: 'Round Neck T-Shirt',
    tags: ['Round Neck', 'Micro-Rib'],
    basePrice: 1899,
    discountPrice: 1599,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Graphite Slate', colorHex: '#3c3e42', images: [roundNeckImg, acidWashImg] },
      { colorName: 'Vintage Bone', colorHex: '#ebe7df', images: [customPrintImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('RN04-GS', 'Graphite Slate', '#3c3e42', [roundNeckImg, acidWashImg], 22),
      ...makeVariants('RN04-VB', 'Vintage Bone', '#ebe7df', [customPrintImg, roundNeckImg], 19)
    ],
    details: { fabric: '290 GSM Compact Cotton', gsm: 290, fit: 'Relaxed regular drape', care: 'Machine wash cold', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 21,
    createdAt: '2026-02-21T10:00:00Z'
  },

  // 2. POLO NECK T-SHIRT (4 products)
  {
    id: 'prod_polo_01',
    slug: 'brutalist-boxy-knit-polo-tee',
    title: 'Brutalist Boxy Knit Polo T-Shirt',
    subtitle: 'Structured Knit Collar · 290 GSM Interlock · Horn Placket',
    description: 'Elevated luxury meets relaxed streetwear with high-density 290 GSM interlock cotton and a structured knit collar.',
    category: 'Polo Neck T-Shirt',
    tags: ['Trending', 'Polo', 'Collared'],
    basePrice: 2499,
    discountPrice: 2199,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Black', colorHex: '#18181a', images: [poloImg, teeImg] },
      { colorName: 'Vintage Bone', colorHex: '#e5e1d7', images: [roundNeckImg, poloImg] }
    ],
    variants: [
      ...makeVariants('PL01-WB', 'Washed Black', '#18181a', [poloImg, teeImg], 25),
      ...makeVariants('PL01-VB', 'Vintage Bone', '#e5e1d7', [roundNeckImg, poloImg], 20)
    ],
    details: { fabric: '290 GSM Combed Cotton Interlock', gsm: 290, fit: 'Boxy streetwear polo', care: 'Gentle cold wash. Flat dry.', modelStats: '6\'2" wearing size L' },
    rating: 4.9,
    reviewsCount: 35,
    createdAt: '2026-02-20T14:00:00Z'
  },
  {
    id: 'prod_polo_02',
    slug: 'quarter-zip-french-terry-polo-tee',
    title: 'Quarter-Zip French Terry Polo T-Shirt',
    subtitle: 'YKK Metal Half-Zip · Stand-Up Collar · 300 GSM Terry',
    description: 'Industrial gunmetal quarter-zip polo allowing dynamic styling from crisp fold-down collar to funnel neck.',
    category: 'Polo Neck T-Shirt',
    tags: ['Polo', 'Zip Collar'],
    basePrice: 2699,
    discountPrice: 2299,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Obsidian Black', colorHex: '#121214', images: [poloImg, lookbookImg] },
      { colorName: 'Muted Taupe', colorHex: '#545048', images: [roundNeckImg, poloImg] }
    ],
    variants: [
      ...makeVariants('PL02-OB', 'Obsidian Black', '#121214', [poloImg, lookbookImg], 18),
      ...makeVariants('PL02-MT', 'Muted Taupe', '#545048', [roundNeckImg, poloImg], 16)
    ],
    details: { fabric: '300 GSM Loopback French Terry', gsm: 300, fit: 'Boxy dropped-shoulder polo', care: 'Zip closed before cold wash', modelStats: '6\'2" wearing size L' },
    rating: 4.8,
    reviewsCount: 29,
    createdAt: '2026-02-25T11:00:00Z'
  },
  {
    id: 'prod_polo_03',
    slug: 'open-placket-waffle-polo-tshirt',
    title: 'Open-Placket Honeycomb Polo T-Shirt',
    subtitle: 'Buttonless V-Placket · 280 GSM Breathable Waffle Knit',
    description: 'Clean buttonless open-placket collar with dimensional waffle texture for breezy resort-streetwear elegance.',
    category: 'Polo Neck T-Shirt',
    tags: ['Polo', 'Waffle Knit'],
    basePrice: 2399,
    discountPrice: 1999,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Chalk Ivory', colorHex: '#efece6', images: [poloImg, customPrintImg] },
      { colorName: 'Pitch Black', colorHex: '#111112', images: [poloImg, teeImg] }
    ],
    variants: [
      ...makeVariants('PL03-CI', 'Chalk Ivory', '#efece6', [poloImg, customPrintImg], 22),
      ...makeVariants('PL03-PB', 'Pitch Black', '#111112', [poloImg, teeImg], 20)
    ],
    details: { fabric: '280 GSM Cotton Waffle Knit', gsm: 280, fit: 'Relaxed open collar drape', care: 'Lay flat to dry', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 24,
    createdAt: '2026-02-27T10:00:00Z'
  },
  {
    id: 'prod_polo_04',
    slug: 'contrast-piped-atelier-polo-tee',
    title: 'Contrast Piped Atelier Polo T-Shirt',
    subtitle: 'Tipped Jacquard Collar · 285 GSM Combed Pique Cotton',
    description: 'Fine honeycomb pique cotton paired with subtle architectural collar tipping and split-tail vented side hems.',
    category: 'Polo Neck T-Shirt',
    tags: ['Polo', 'Pique'],
    basePrice: 2499,
    discountPrice: 2099,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Noir Gold', colorHex: '#19191b', images: [poloImg, heroImg] },
      { colorName: 'Sage Concrete', colorHex: '#4b534b', images: [poloImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('PL04-NG', 'Noir Gold', '#19191b', [poloImg, heroImg], 20),
      ...makeVariants('PL04-SC', 'Sage Concrete', '#4b534b', [poloImg, roundNeckImg], 16)
    ],
    details: { fabric: '285 GSM Heavy Combed Pique', gsm: 285, fit: 'Structured boxy polo', care: 'Cold delicate wash', modelStats: '6\'0" wearing size M' },
    rating: 4.8,
    reviewsCount: 19,
    createdAt: '2026-03-02T09:00:00Z'
  },

  // 3. DOWN SHOULDER T-SHIRT (4 products)
  {
    id: 'prod_drop_01',
    slug: 'architectural-drop-shoulder-box-tee',
    title: 'Architectural Down Shoulder T-Shirt',
    subtitle: '280 GSM Combed Cotton · Exaggerated Low Shoulder · Boxy Fit',
    description: 'The flagship 4LAAZY silhouette with lowered shoulder seams, generous sleeve length, and zero-curl 1.25" ribbed collar.',
    category: 'Down Shoulder T-Shirt',
    tags: ['Trending', 'Bestseller', 'Down Shoulder'],
    basePrice: 1999,
    discountPrice: 1699,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Black', colorHex: '#1c1b1f', images: [teeImg, heroImg] },
      { colorName: 'Vintage Bone', colorHex: '#ebe7df', images: [roundNeckImg, heroImg] },
      { colorName: 'Charcoal Grey', colorHex: '#3b3b40', images: [acidWashImg, teeImg] }
    ],
    variants: [
      ...makeVariants('DS01-WB', 'Washed Black', '#1c1b1f', [teeImg, heroImg], 35),
      ...makeVariants('DS01-VB', 'Vintage Bone', '#ebe7df', [roundNeckImg, heroImg], 26)
    ],
    details: { fabric: '100% Combed Compact Cotton', gsm: 280, fit: 'Boxy oversized down-shoulder cut', care: 'Machine wash cold inside out', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 48,
    createdAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'prod_drop_02',
    slug: 'monochrome-raw-edge-down-shoulder-tee',
    title: 'Monochrome Raw-Edge Down Shoulder Tee',
    subtitle: 'Exaggerated Drape · Raw Laser Cut Cuff & Hem · 280 GSM',
    description: 'Dropped shoulder seam resting 4 inches below the natural shoulder blade with treated raw-cut sleeve openings.',
    category: 'Down Shoulder T-Shirt',
    tags: ['Down Shoulder', 'Raw Edge'],
    basePrice: 1999,
    discountPrice: 1699,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Charcoal', colorHex: '#353538', images: [teeImg, acidWashImg] },
      { colorName: 'Bone Chalk', colorHex: '#eae7e1', images: [roundNeckImg, customPrintImg] }
    ],
    variants: [
      ...makeVariants('DS02-WC', 'Washed Charcoal', '#353538', [teeImg, acidWashImg], 24),
      ...makeVariants('DS02-BC', 'Bone Chalk', '#eae7e1', [roundNeckImg, customPrintImg], 18)
    ],
    details: { fabric: '280 GSM Egyptian Cotton', gsm: 280, fit: 'Relaxed down-shoulder slouch', care: 'Gentle machine wash', modelStats: '6\'1" wearing size L' },
    rating: 4.8,
    reviewsCount: 31,
    createdAt: '2026-03-03T10:00:00Z'
  },
  {
    id: 'prod_drop_03',
    slug: 'heavy-cube-boxy-down-shoulder-tshirt',
    title: 'Heavy Cube 310 GSM Down Shoulder Tee',
    subtitle: '310 GSM Structured Loopback · Cropped Boxy Length',
    description: 'Slightly cropped boxy body paired with extended wide sleeves for clean proportions over relaxed cargos or denims.',
    category: 'Down Shoulder T-Shirt',
    tags: ['Down Shoulder', '310 GSM', 'Heavyweight'],
    basePrice: 2199,
    discountPrice: 1849,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Pitch Black', colorHex: '#101012', images: [teeImg, lookbookImg] },
      { colorName: 'Olive Sage', colorHex: '#464d44', images: [teeImg, heroImg] }
    ],
    variants: [
      ...makeVariants('DS03-PB', 'Pitch Black', '#101012', [teeImg, lookbookImg], 26),
      ...makeVariants('DS03-OS', 'Olive Sage', '#464d44', [teeImg, heroImg], 20)
    ],
    details: { fabric: '310 GSM Custom Loopback Cotton', gsm: 310, fit: 'Wide boxy down-shoulder', care: 'Cold wash inside out', modelStats: '6\'2" wearing size L' },
    rating: 4.9,
    reviewsCount: 41,
    createdAt: '2026-03-04T11:00:00Z'
  },
  {
    id: 'prod_drop_04',
    slug: 'seam-detail-slouch-down-shoulder-tee',
    title: 'Reverse-Seam Down Shoulder T-Shirt',
    subtitle: 'Exposed Overlock Shoulder Seams · 290 GSM Combed Jersey',
    description: 'Architectural exposed shoulder stitching emphasizes the wide down-shoulder silhouette in tonal thread.',
    category: 'Down Shoulder T-Shirt',
    tags: ['Down Shoulder', 'Architectural'],
    basePrice: 2099,
    discountPrice: 1749,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Concrete Ash', colorHex: '#55565a', images: [teeImg, roundNeckImg] },
      { colorName: 'Pure White', colorHex: '#f5f5f5', images: [customPrintImg, teeImg] }
    ],
    variants: [
      ...makeVariants('DS04-CA', 'Concrete Ash', '#55565a', [teeImg, roundNeckImg], 22),
      ...makeVariants('DS04-PW', 'Pure White', '#f5f5f5', [customPrintImg, teeImg], 20)
    ],
    details: { fabric: '290 GSM Ringspun Cotton', gsm: 290, fit: 'Relaxed down-shoulder fit', care: 'Wash inside out', modelStats: '6\'0" wearing size M' },
    rating: 4.8,
    reviewsCount: 18,
    createdAt: '2026-03-04T16:00:00Z'
  },

  // 4. CUSTOMISE T-SHIRT (4 products)
  {
    id: 'prod_custom_01',
    slug: 'bespoke-custom-print-streetwear-tee',
    title: 'Bespoke Custom Print Streetwear Tee',
    subtitle: 'Upload Your Print Image · Sample Fit & Finish Shown · 280 GSM Heavyweight',
    description: 'Browse our 4 sample product photos to see the final print quality and fit, then upload your image before adding to bag.',
    category: 'Customise T-Shirt',
    tags: ['Trending', 'Customise'],
    basePrice: 2299,
    discountPrice: 1999,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Pure White', colorHex: '#fbfbfe', images: [customPrintImg, roundNeckImg] },
      { colorName: 'Pitch Black', colorHex: '#111112', images: [teeImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('CS01-PW', 'Pure White', '#fbfbfe', [customPrintImg, roundNeckImg], 45),
      ...makeVariants('CS01-PB', 'Pitch Black', '#111112', [teeImg, roundNeckImg], 35)
    ],
    details: { fabric: '280 GSM Print-Ready Heavy Cotton', gsm: 280, fit: 'Oversized down-shoulder print blank', care: 'Cold wash inside out', modelStats: '6\'1" wearing size L' },
    rating: 5.0,
    reviewsCount: 84,
    createdAt: '2026-03-01T12:00:00Z'
  },
  {
    id: 'prod_custom_02',
    slug: 'custom-3d-puff-print-oversized-blank',
    title: '3D Silicone Puff Customise T-Shirt',
    subtitle: 'Upload Print Image · Sample Print Reference · 300 GSM',
    description: 'High-relief 3D silicone puff ink pressed onto a 300 GSM boxy down-shoulder blank using your uploaded graphic.',
    category: 'Customise T-Shirt',
    tags: ['Customise', '3D Puff'],
    basePrice: 2499,
    discountPrice: 2149,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Pure White', colorHex: '#ffffff', images: [customPrintImg, teeImg] },
      { colorName: 'Vintage Bone', colorHex: '#ebe7df', images: [customPrintImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('CS02-PW', 'Pure White', '#ffffff', [customPrintImg, teeImg], 30),
      ...makeVariants('CS02-VB', 'Vintage Bone', '#ebe7df', [customPrintImg, roundNeckImg], 24)
    ],
    details: { fabric: '300 GSM Heavy Ringspun Cotton', gsm: 300, fit: 'Boxy studio print fit', care: 'Do not iron directly over puff print', modelStats: '6\'2" wearing size L' },
    rating: 4.9,
    reviewsCount: 53,
    createdAt: '2026-03-02T11:00:00Z'
  },
  {
    id: 'prod_custom_03',
    slug: 'custom-back-canvas-statement-tee',
    title: 'Full Back Canvas Customise T-Shirt',
    subtitle: 'Upload Artwork · Sample Back Print Shots · 280 GSM',
    description: 'Oversized back canvas customisation printed to match the sample print photos shown across our 4 product slides.',
    category: 'Customise T-Shirt',
    tags: ['Customise', 'Back Print'],
    basePrice: 2399,
    discountPrice: 2049,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Pitch Black', colorHex: '#121214', images: [teeImg, customPrintImg] },
      { colorName: 'Pure White', colorHex: '#fbfbfe', images: [customPrintImg, teeImg] }
    ],
    variants: [
      ...makeVariants('CS03-PB', 'Pitch Black', '#121214', [teeImg, customPrintImg], 28),
      ...makeVariants('CS03-PW', 'Pure White', '#fbfbfe', [customPrintImg, teeImg], 28)
    ],
    details: { fabric: '280 GSM Combed Cotton', gsm: 280, fit: 'Boxy streetwear cut', care: 'Gentle cold wash', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 39,
    createdAt: '2026-03-03T13:00:00Z'
  },
  {
    id: 'prod_custom_04',
    slug: 'custom-team-agency-pack-polo-or-tee',
    title: 'Metallic Gold Foil Customise T-Shirt',
    subtitle: 'Upload Custom Graphic · Sample Foil Finish · 290 GSM',
    description: 'Studio vacuum metallic gold or chrome foil press on custom 290 GSM black or white heavyweight tees.',
    category: 'Customise T-Shirt',
    tags: ['Customise', 'Gold Foil'],
    basePrice: 2599,
    discountPrice: 2249,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Pitch Black', colorHex: '#111112', images: [customPrintImg, lookbookImg] },
      { colorName: 'Pure White', colorHex: '#fbfbfe', images: [customPrintImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('CS04-PB', 'Pitch Black', '#111112', [customPrintImg, lookbookImg], 24),
      ...makeVariants('CS04-PW', 'Pure White', '#fbfbfe', [customPrintImg, roundNeckImg], 20)
    ],
    details: { fabric: '290 GSM Combed Cotton', gsm: 290, fit: 'Relaxed studio fit', care: 'Hand wash inside out', modelStats: '6\'0" wearing size M' },
    rating: 5.0,
    reviewsCount: 27,
    createdAt: '2026-03-04T09:00:00Z'
  },

  // 5. LAAZY DESIGNS (4 products)
  {
    id: 'prod_laazy_01',
    slug: 'laazy-designs-mineral-acid-wash-tee',
    title: 'Laazy Designs Acid Wash Signature Tee',
    subtitle: '300 GSM Heavyweight · Hand Mineral Patina · Raw Hem',
    description: 'Signature atelier acid-washed cotton tee with organic charcoal marbling and distressed neckline detailing.',
    category: 'Laazy Designs',
    tags: ['Trending', 'Laazy Designs', 'Acid Wash'],
    basePrice: 2199,
    discountPrice: 1899,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Acid Charcoal', colorHex: '#2b2c30', images: [acidWashImg, teeImg] },
      { colorName: 'Acid Sand', colorHex: '#787368', images: [teeImg, acidWashImg] }
    ],
    variants: [
      ...makeVariants('LD01-AC', 'Acid Charcoal', '#2b2c30', [acidWashImg, teeImg], 28),
      ...makeVariants('LD01-AS', 'Acid Sand', '#787368', [teeImg, acidWashImg], 20)
    ],
    details: { fabric: '300 GSM Mineral Washed Cotton', gsm: 300, fit: 'Wide streetwear cut', care: 'Wash cold with dark garments', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 52,
    createdAt: '2026-02-22T13:00:00Z'
  },
  {
    id: 'prod_laazy_02',
    slug: 'subversive-archive-typography-laazy-design-tee',
    title: 'Subversive Typography Laazy Design Tee',
    subtitle: 'Dual-Side 3D Puff Screen Graphic · 280 GSM Oversized',
    description: 'In-house constructivist typography across the chest in raised 3D puff ink paired with a nape monogram.',
    category: 'Laazy Designs',
    tags: ['Trending', 'Laazy Designs', 'Graphic'],
    basePrice: 2199,
    discountPrice: 1799,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Vintage Bone', colorHex: '#ebe7df', images: [customPrintImg, lookbookImg] },
      { colorName: 'Washed Black', colorHex: '#141416', images: [acidWashImg, teeImg] }
    ],
    variants: [
      ...makeVariants('LD02-VB', 'Vintage Bone', '#ebe7df', [customPrintImg, lookbookImg], 26),
      ...makeVariants('LD02-WB', 'Washed Black', '#141416', [acidWashImg, teeImg], 22)
    ],
    details: { fabric: '280 GSM Ringspun Cotton', gsm: 280, fit: 'Exaggerated streetwear fit', care: 'Turn inside out before washing', modelStats: '6\'2" wearing size L' },
    rating: 5.0,
    reviewsCount: 46,
    createdAt: '2026-03-02T16:00:00Z'
  },
  {
    id: 'prod_laazy_03',
    slug: 'brutalist-blueprint-back-graphic-laazy-tee',
    title: 'Brutalist Blueprint Back-Print Tee',
    subtitle: 'Architectural Grid Artwork · 290 GSM Boxy Cut',
    description: 'High-contrast tonal blueprint schematic printed across the full back with subtle chest coordinates.',
    category: 'Laazy Designs',
    tags: ['Laazy Designs', 'Back Print'],
    basePrice: 2299,
    discountPrice: 1899,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Obsidian Ink', colorHex: '#131316', images: [acidWashImg, customPrintImg] },
      { colorName: 'Chalk Grey', colorHex: '#949599', images: [teeImg, acidWashImg] }
    ],
    variants: [
      ...makeVariants('LD03-OI', 'Obsidian Ink', '#131316', [acidWashImg, customPrintImg], 22),
      ...makeVariants('LD03-CG', 'Chalk Grey', '#949599', [teeImg, acidWashImg], 18)
    ],
    details: { fabric: '290 GSM Heavy Cotton', gsm: 290, fit: 'Relaxed down-shoulder fit', care: 'Cold gentle cycle', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 33,
    createdAt: '2026-03-03T15:00:00Z'
  },
  {
    id: 'prod_laazy_04',
    slug: 'less-effort-manifesto-heavy-tee',
    title: 'Less Effort Manifesto Statement Tee',
    subtitle: 'Soft-Wash DTG Graphic · 280 GSM Pre-Shrunk Jersey',
    description: 'Our signature ethos rendered in sharp editorial type that softens seamlessly into the combed cotton weave.',
    category: 'Laazy Designs',
    tags: ['Laazy Designs', 'Manifesto'],
    basePrice: 2099,
    discountPrice: 1699,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Washed Black', colorHex: '#1a1a1d', images: [acidWashImg, heroImg] },
      { colorName: 'Pure White', colorHex: '#f5f5f5', images: [customPrintImg, roundNeckImg] }
    ],
    variants: [
      ...makeVariants('LD04-WB', 'Washed Black', '#1a1a1d', [acidWashImg, heroImg], 26),
      ...makeVariants('LD04-PW', 'Pure White', '#f5f5f5', [customPrintImg, roundNeckImg], 24)
    ],
    details: { fabric: '280 GSM Combed Cotton', gsm: 280, fit: 'Modern relaxed boxy cut', care: 'Machine wash cold', modelStats: '6\'0" wearing size M' },
    rating: 4.8,
    reviewsCount: 25,
    createdAt: '2026-03-04T12:00:00Z'
  },

  // 6. LIMITED DESIGN (4 products)
  {
    id: 'prod_limited_01',
    slug: 'numbered-capsule-04-limited-design-tee',
    title: 'Capsule 04 Numbered Limited Design Tee',
    subtitle: 'Edition of 100 · Gold Foil Crest · 320 GSM Honeycomb Knit',
    description: 'Strictly limited numbered collector edition—never restocked. Crafted from 320 GSM textured cotton with metallic gold foil crest.',
    category: 'Limited Design',
    tags: ['Trending', 'Limited Design', 'Numbered'],
    basePrice: 2999,
    discountPrice: 2599,
    isFeatured: true,
    isPublished: true,
    colorGroups: [
      { colorName: 'Obsidian Gold', colorHex: '#151517', images: [lookbookImg, heroImg] },
      { colorName: 'Sage Concrete', colorHex: '#525a52', images: [teeImg, lookbookImg] }
    ],
    variants: [
      ...makeVariants('LM01-OG', 'Obsidian Gold', '#151517', [lookbookImg, heroImg], 10),
      ...makeVariants('LM01-SC', 'Sage Concrete', '#525a52', [teeImg, lookbookImg], 8)
    ],
    details: { fabric: '320 GSM Architectural Cotton Knit', gsm: 320, fit: 'Sculpted boxy cut with woven edition tag', care: 'Gentle hand wash inside out', modelStats: '6\'1" wearing size L' },
    rating: 5.0,
    reviewsCount: 28,
    createdAt: '2026-03-05T09:00:00Z'
  },
  {
    id: 'prod_limited_02',
    slug: 'monolith-atelier-embossed-limited-tee',
    title: 'Monolith Embossed Collector T-Shirt',
    subtitle: 'Edition of 75 · Heat-Debossed Chest Relief · 320 GSM',
    description: 'Blind heat-embossed 4LAAZY relief across ultra-dense 320 GSM loopback jersey with satin internal serial numbering.',
    category: 'Limited Design',
    tags: ['Limited Design', 'Embossed', 'Collector'],
    basePrice: 3199,
    discountPrice: 2799,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Carbon Noir', colorHex: '#121213', images: [lookbookImg, poloImg] },
      { colorName: 'Raw Travertine', colorHex: '#dcd7cc', images: [roundNeckImg, lookbookImg] }
    ],
    variants: [
      ...makeVariants('LM02-CN', 'Carbon Noir', '#121213', [lookbookImg, poloImg], 8),
      ...makeVariants('LM02-RT', 'Raw Travertine', '#dcd7cc', [roundNeckImg, lookbookImg], 7)
    ],
    details: { fabric: '320 GSM Loopback Cotton', gsm: 320, fit: 'Architectural oversized silhouette', care: 'Cold wash inside out', modelStats: '6\'2" wearing size L' },
    rating: 5.0,
    reviewsCount: 19,
    createdAt: '2026-03-05T14:00:00Z'
  },
  {
    id: 'prod_limited_03',
    slug: 'archive-silver-foil-runway-edition-tee',
    title: 'Silver Foil Runway Archive Tee',
    subtitle: 'Edition of 50 · Chrome Foil Back Coordinates · 300 GSM',
    description: 'Runway release featuring liquid silver foil back typography over sun-faded mineral black cotton.',
    category: 'Limited Design',
    tags: ['Limited Design', 'Runway', 'Archive'],
    basePrice: 3299,
    discountPrice: 2899,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Faded Obsidian', colorHex: '#1f2023', images: [heroImg, lookbookImg] },
      { colorName: 'Pitch Black', colorHex: '#0f0f11', images: [lookbookImg, acidWashImg] }
    ],
    variants: [
      ...makeVariants('LM03-FO', 'Faded Obsidian', '#1f2023', [heroImg, lookbookImg], 7),
      ...makeVariants('LM03-PB', 'Pitch Black', '#0f0f11', [lookbookImg, acidWashImg], 6)
    ],
    details: { fabric: '300 GSM Washed Cotton', gsm: 300, fit: 'Drop-shoulder runway cut', care: 'Hand wash cold only', modelStats: '6\'1" wearing size L' },
    rating: 4.9,
    reviewsCount: 16,
    createdAt: '2026-03-06T10:00:00Z'
  },
  {
    id: 'prod_limited_04',
    slug: 'founder-series-hand-distressed-edition-tee',
    title: 'Founder Series Woven Jacquard Edition Tee',
    subtitle: 'Edition of 60 · Custom Woven Tape & Heavy Collar · 320 GSM',
    description: 'Signed Founder Series capsule cut from heavyweight jacquard weave with metallic brass collar clasp.',
    category: 'Limited Design',
    tags: ['Limited Design', 'Founder Series'],
    basePrice: 3499,
    discountPrice: 2999,
    isFeatured: false,
    isPublished: true,
    colorGroups: [
      { colorName: 'Espresso Noir', colorHex: '#201c1a', images: [lookbookImg, teeImg] },
      { colorName: 'Bone Ivory', colorHex: '#e6e2d8', images: [heroImg, lookbookImg] }
    ],
    variants: [
      ...makeVariants('LM04-EN', 'Espresso Noir', '#201c1a', [lookbookImg, teeImg], 8),
      ...makeVariants('LM04-BI', 'Bone Ivory', '#e6e2d8', [heroImg, lookbookImg], 6)
    ],
    details: { fabric: '320 GSM Jacquard Cotton', gsm: 320, fit: 'Structured oversized box cut', care: 'Dry clean or cold hand wash', modelStats: '6\'2" wearing size L' },
    rating: 5.0,
    reviewsCount: 14,
    createdAt: '2026-03-06T16:00:00Z'
  }
];

export const fallbackProducts: Product[] = rawFallbackProducts.map(product => ({
  ...product,
  colorGroups: product.colorGroups.map(cg => ({
    ...cg,
    images: fourSlides(cg.images[0] || teeImg, cg.images[1] || lookbookImg)
  }))
}));
