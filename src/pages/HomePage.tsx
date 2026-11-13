import React, { useState, useEffect } from 'react';
import { ArrowRight, Shield, RotateCcw, Truck, Flame } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import type { Product } from '../types/index.ts';
import { fallbackProducts } from '../data/fallbackCatalog.ts';
import { CATEGORY_ROUTE_META, resolveCategoryFromSlugOrName } from '../utils/routes.ts';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [settings, setSettings] = useState<any>({
    heroImageUrl: '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
    heroHeading: 'LESS EFFORT.\nMORE STYLE.',
    heroSubhead:
      'Engineered for the relaxed vanguard. 280–320 GSM custom-loomed heavyweight combed cotton T-shirts, architectural collars, and bespoke graphic editions.',
    heroButtonText: 'Shop Trending'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(res => res.json()).catch(() => ({ products: [] })),
      fetch('/api/settings').then(res => res.json()).catch(() => ({ settings: null }))
    ])
      .then(([prodData, setData]) => {
        if (prodData.products && prodData.products.length > 0) {
          setProducts(prodData.products);
        } else {
          setProducts(fallbackProducts);
        }
        if (setData.settings) {
          setSettings({
            heroImageUrl:
              setData.settings.heroImageUrl || '/assets/images/hero_streetwear_campaign_1794056018871.jpg',
            heroHeading: setData.settings.heroHeading || 'LESS EFFORT.\nMORE STYLE.',
            heroSubhead:
              setData.settings.heroSubhead ||
              'Engineered for the relaxed vanguard. 280–320 GSM custom-loomed heavyweight combed cotton T-shirts, architectural collars, and bespoke graphic editions.',
            heroButtonText: 'Shop Trending'
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const heroImg = settings.heroImageUrl || '/assets/images/hero_streetwear_campaign_1794056018871.jpg';
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

  return (
    <div className="space-y-14 sm:space-y-20 pb-16 sm:pb-20">
      {/* 1. Hero Section */}
      <section className="relative min-h-[68vh] sm:min-h-[82vh] flex items-center justify-center overflow-hidden bg-neutral-950">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="4LAAZY T-Shirt Campaign"
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/30" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-14 sm:py-20">
          <p className="mb-3 text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-[#E5A914]">
            HYDERABAD · THE ARCHITECTURAL T-SHIRT HOUSE
          </p>

          <h1 className="font-display text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.96] max-w-4xl mx-auto text-balance whitespace-pre-line">
            {settings.heroHeading || 'LESS EFFORT.\nMORE STYLE.'}
          </h1>

          <p className="mt-4 sm:mt-6 text-xs sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
            {settings.heroSubhead}
          </p>

          <div className="mt-7 sm:mt-8 flex items-center justify-center">
            <button
              onClick={() => onNavigate('shop', { category: 'trending' })}
              className="w-full sm:w-auto max-w-xs bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-8 py-3.5 rounded text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-xl flex items-center justify-center gap-2"
            >
              <span>Shop Trending</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
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
                src={catMeta.heroImage}
                alt={catMeta.name}
                className="w-full h-full object-cover object-center opacity-65 group-hover:scale-[1.03] transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/65 to-transparent" />

              <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-8 lg:p-10 max-w-2xl space-y-3">
                <p className="text-xs sm:text-sm text-neutral-200 line-clamp-2 max-w-xl leading-relaxed">
                  {catMeta.heroDescription}
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
