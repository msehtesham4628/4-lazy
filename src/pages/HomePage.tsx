import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, RotateCcw, Truck, Flame } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import type { Product, HeroSlide, Category } from '../types/index.ts';
import { fallbackProducts } from '../data/fallbackCatalog.ts';
import { CATEGORY_ROUTE_META, resolveCategoryFromSlugOrName } from '../utils/routes.ts';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero_slide_1',
    imageUrl: '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
    eyebrow: 'HYDERABAD · THE ARCHITECTURAL T-SHIRT HOUSE',
    heading: 'LESS EFFORT.\nMORE STYLE.',
    subhead:
      '280–320 GSM heavyweight combed cotton Round Neck T-shirts engineered for an everyday crisp collar.',
    linkType: 'category',
    linkTarget: 'Round Neck T-Shirt'
  },
  {
    id: 'hero_slide_2',
    imageUrl: '/assets/images/campaign_editorial_lookbook_1794056022183.jpg',
    eyebrow: 'DROP SHOULDER ARCHITECTURE',
    heading: 'DOWN SHOULDER\nSILHOUETTES.',
    subhead:
      'Boxy dropped-shoulder drapes with clean garment-washed pigments built for effortless layering.',
    linkType: 'category',
    linkTarget: 'Down Shoulder T-Shirt'
  },
  {
    id: 'hero_slide_3',
    imageUrl: '/assets/images/tshirt_polo_neck_1794456301588.jpg',
    eyebrow: 'INTERLOCK KNIT COLLARS',
    heading: 'PRECISION\nKNIT POLOS.',
    subhead:
      'Structured 290 GSM interlock knit Polo Neck T-shirts that hold architectural form all day.',
    linkType: 'category',
    linkTarget: 'Polo Neck T-Shirt'
  },
  {
    id: 'hero_slide_4',
    imageUrl: '/assets/images/tshirt_acid_wash_1794456303446.jpg',
    eyebrow: 'SMALL-BATCH COLLECTOR DROP',
    heading: 'LIMITED\nARCHIVE PIECES.',
    subhead:
      'Numbered acid-wash and limited graphic editions crafted in micro production runs.',
    linkType: 'category',
    linkTarget: 'Limited Design'
  },
  {
    id: 'hero_slide_5',
    imageUrl: '/assets/images/tshirt_custom_print_1794456303137.jpg',
    eyebrow: 'CUSTOM PRINT STUDIO',
    heading: 'YOUR ARTWORK.\nOUR HEAVY BLANK.',
    subhead:
      'Preview how the print settles across 4 sample angles and upload your own graphic directly.',
    linkType: 'category',
    linkTarget: 'Customise T-Shirt'
  }
];

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [apiCategories, setApiCategories] = useState<Category[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(DEFAULT_HERO_SLIDES);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()).catch(() => ({ products: [] })),
      fetch('/api/settings').then(res => res.json()).catch(() => ({ settings: null })),
      fetch('/api/categories').then(res => res.json()).catch(() => ({ categories: [] }))
    ])
      .then(([prodData, setData, catData]) => {
        if (prodData.products && prodData.products.length > 0) {
          setProducts(prodData.products);
        } else {
          setProducts(fallbackProducts);
        }
        if (catData.categories && catData.categories.length > 0) {
          setApiCategories(catData.categories);
        }
        if (setData.settings) {
          const s = setData.settings;
          if (Array.isArray(s.heroSlides) && s.heroSlides.length > 0) {
            const validSlides = s.heroSlides.filter((sl: HeroSlide) => sl && sl.imageUrl);
            if (validSlides.length > 0) {
              setHeroSlides(validSlides);
              return;
            }
          }
          if (Array.isArray(s.heroImages) && s.heroImages.length > 0) {
            setHeroSlides(
              s.heroImages.filter(Boolean).map((imgUrl: string, idx: number) => ({
                ...(DEFAULT_HERO_SLIDES[idx] || DEFAULT_HERO_SLIDES[0]),
                id: `hero_slide_${idx + 1}`,
                imageUrl: imgUrl
              }))
            );
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveHeroSlide(prev => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (activeHeroSlide >= heroSlides.length) {
      setActiveHeroSlide(0);
    }
  }, [heroSlides.length, activeHeroSlide]);

  const currentSlide = heroSlides[activeHeroSlide] || DEFAULT_HERO_SLIDES[0];

  const handleHeroSlideClick = () => {
    if (!currentSlide || currentSlide.linkType === 'none' || !currentSlide.linkTarget) return;
    if (currentSlide.linkType === 'product') {
      onNavigate('product', { slug: currentSlide.linkTarget });
    } else if (currentSlide.linkType === 'category') {
      onNavigate('shop', { category: currentSlide.linkTarget });
    }
  };

  const lookbookImg = '/assets/images/campaign_editorial_lookbook_1794056022183.jpg';

  const trendingProducts = [...products]
    .sort((a, b) => ((b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)) || (b.reviewsCount || 0) - (a.reviewsCount || 0))
    .slice(0, 4);

  const getCategoryProducts = (categoryName: string) => {
    const matched = products.filter(
      p => resolveCategoryFromSlugOrName(p.category).toLowerCase() === categoryName.toLowerCase()
    );
    return matched.slice(0, 4);
  };

  const isCurrentSlideClickable = Boolean(
    currentSlide && currentSlide.linkType !== 'none' && currentSlide.linkTarget
  );

  return (
    <div className="space-y-14 sm:space-y-20 pb-16 sm:pb-20">
      {/* 1. Hero Section — Auto-Sliding Images, Per-Slide Matter & Category/Product Links, Zero Buttons */}
      <section
        onClick={handleHeroSlideClick}
        className={`relative min-h-[68vh] sm:min-h-[82vh] flex items-center justify-center overflow-hidden bg-neutral-950 ${
          isCurrentSlideClickable ? 'cursor-pointer' : ''
        }`}
      >
        <div className="absolute inset-0">
          {heroSlides.map((slide, idx) => (
            <img
              key={slide.id || `${slide.imageUrl}_${idx}`}
              src={slide.imageUrl}
              alt={slide.heading || `4LAAZY Slide ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                idx === activeHeroSlide ? 'opacity-100' : 'opacity-0'
              }`}
              referrerPolicy="no-referrer"
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/30" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-14 sm:py-20">
          {currentSlide.eyebrow && (
            <p className="mb-3 text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-[#E5A914]">
              {currentSlide.eyebrow}
            </p>
          )}

          <h1 className="font-display text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.96] max-w-4xl mx-auto text-balance whitespace-pre-line">
            {currentSlide.heading || 'LESS EFFORT.\nMORE STYLE.'}
          </h1>

          {currentSlide.subhead && (
            <p className="mt-4 sm:mt-6 text-xs sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
              {currentSlide.subhead}
            </p>
          )}
        </div>

        <div className="absolute bottom-4 inset-x-0 hidden md:flex justify-center gap-8 text-[11px] uppercase tracking-wider text-neutral-400 font-semibold z-10">
          <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#E5A914]" /> Free Express Shipping Over ₹1,999</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#E5A914]" /> Cashfree Verified Gateway</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-[#E5A914]" /> Hassle-Free 7-Day Exchanges</span>
        </div>
      </section>

      {/* 2. Trending Products Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        <div className="border-b border-neutral-800 pb-4">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#E5A914] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            MOST WANTED NOW
          </span>
          <h2 className="font-display text-xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
            Trending Products
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="aspect-[3/4] bg-neutral-900/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {trendingProducts.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => onNavigate('shop', { category: 'trending' })}
                className="border border-neutral-700 hover:border-[#E5A914] bg-neutral-900 hover:bg-[#E5A914] text-white hover:text-black font-bold px-8 py-3 rounded text-xs uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>View more</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3–8. Category Name -> Banner -> Products -> Centered View More */}
      {CATEGORY_ROUTE_META.map((catMeta) => {
        const catProducts = getCategoryProducts(catMeta.name);
        if (catProducts.length === 0) return null;
        const matchedCat = apiCategories.find(
          c => c.slug === catMeta.slug || c.name.toLowerCase() === catMeta.name.toLowerCase()
        );
        const bannerImage = matchedCat?.image || catMeta.heroImage;
        const bannerDescription = matchedCat?.description || catMeta.heroDescription;

        return (
          <section key={catMeta.slug} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
            {/* Category Name Heading ONLY (no category numbers, no top View more) */}
            <div className="border-b border-neutral-800 pb-3">
              <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {catMeta.name}
              </h2>
            </div>

            {/* Category Banner */}
            <div
              onClick={() => onNavigate('shop', { category: catMeta.name })}
              className="group relative h-48 sm:h-64 lg:h-72 rounded-xl overflow-hidden border border-neutral-800 cursor-pointer bg-neutral-950"
            >
              <img
                src={bannerImage}
                alt={catMeta.name}
                className="w-full h-full object-cover object-center opacity-65 group-hover:scale-[1.03] transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/65 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-8 lg:p-10 max-w-2xl space-y-3">
                <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-xl leading-relaxed">
                  {bannerDescription}
                </p>
                <div>
                  <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#E5A914] group-hover:text-white transition-colors">
                    <span>Explore {catMeta.name}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical 4-Product Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {catProducts.map(product => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>

            {/* Centered View More Button in the Middle */}
            <div className="flex justify-center pt-1">
              <button
                onClick={() => onNavigate('shop', { category: catMeta.name })}
                className="border border-neutral-700 hover:border-[#E5A914] bg-neutral-900 hover:bg-[#E5A914] text-white hover:text-black font-bold px-8 py-3 rounded text-xs uppercase tracking-widest transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>View more</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        );
      })}

      {/* Editorial Brand Ethos */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden p-5 sm:p-10">
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              THE 4LAAZY ETHOS · HYDERABAD
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
              THE SCIENCE OF THE PERFECT T-SHIRT
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              Born in Hyderabad, 4LAAZY crafts T-shirts exclusively — zero distractions. Every 280–320 GSM combed cotton silhouette is bio-washed and engineered so collars never sag.
            </p>
            <div className="space-y-2.5 text-xs text-neutral-400">
              <p><strong className="text-white">· Anti-Collapse 1.25&quot; Rib Collar:</strong> High-density 2x2 ribbing holds shape wash after wash.</p>
              <p><strong className="text-white">· Architectural Drape:</strong> Structured Round Neck, Knit Polo, and Down Shoulder blocks.</p>
              <p><strong className="text-white">· Heavyweight Cotton:</strong> Zero transparency, bio-washed combed cotton built for everyday wear.</p>
            </div>
            <button
              onClick={() => onNavigate('about')}
              className="bg-white hover:bg-neutral-200 text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest transition-colors"
            >
              Read Full Manifesto
            </button>
          </div>

          <div className="lg:col-span-7 h-[360px] sm:h-[480px] rounded-lg overflow-hidden border border-neutral-800">
            <img
              src={lookbookImg}
              alt="4LAAZY Lookbook Model"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
