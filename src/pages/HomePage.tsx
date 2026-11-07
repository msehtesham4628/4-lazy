import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Shield, RotateCcw, Truck } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import { Product } from '../types/index.ts';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
      })
      .catch(err => console.error('Error fetching home products:', err))
      .finally(() => setLoading(false));
  }, []);

  const heroImg = '/src/assets/images/hero_streetwear_campaign_1794056018871.jpg';
  const lookbookImg = '/src/assets/images/campaign_editorial_lookbook_1794056022183.jpg';

  const categories = [
    {
      title: 'Oversized T-Shirts',
      desc: '280 GSM Combed Cotton · Drop Shoulder',
      image: '/src/assets/images/product_oversized_heavy_tee_1794056020516.jpg',
      category: 'Oversized T-Shirts'
    },
    {
      title: '500 GSM Boxy Hoodies',
      desc: 'Custom Loopback French Terry · Sculptural Hood',
      image: '/src/assets/images/product_streetwear_hoodie_1794056020931.jpg',
      category: 'Hoodies & Sweatshirts'
    },
    {
      title: 'Pleated Utility Cargos',
      desc: '340 GSM High Density Twill · Magnetic Flaps',
      image: '/src/assets/images/product_cargo_trousers_1794056021752.jpg',
      category: 'Trousers & Cargo'
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section – Full-Screen Luxury Fashion Campaign */}
      <section className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden bg-neutral-950">
        {/* Background Image with Measured Contrast Scrim */}
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="4 LAZY Autumn Winter Campaign"
            className="w-full h-full object-cover object-center scale-100 animate-fade-in"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/30" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-20">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded border border-neutral-700/80 text-[11px] font-bold tracking-widest uppercase text-[#E5A914]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DROP 04 // THE BRUTALIST HEAVYWEIGHTS</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight uppercase leading-[0.95] max-w-4xl mx-auto text-balance">
            LESS EFFORT. <br className="hidden sm:inline" />
            MORE STYLE.
          </h1>

          <p className="mt-6 text-sm sm:text-base lg:text-lg text-neutral-300 max-w-2xl mx-auto font-normal leading-relaxed text-balance">
            Engineered for the relaxed vanguard. 280–500 GSM custom-loomed heavyweight textiles, architectural drop-shoulder geometry, and minimalist everyday confidence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('shop')}
              className="w-full sm:w-auto bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-8 py-3.5 rounded text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-xl flex items-center justify-center gap-2"
            >
              Shop Collection
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="w-full sm:w-auto bg-neutral-900/80 hover:bg-neutral-800 text-white border border-neutral-700 px-8 py-3.5 rounded text-xs uppercase tracking-widest transition-all duration-200 backdrop-blur-sm"
            >
              The 4 LAZY Manifesto
            </button>
          </div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="absolute bottom-4 inset-x-0 hidden md:flex justify-center gap-8 text-[11px] uppercase tracking-wider text-neutral-400 font-semibold z-10">
          <span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#E5A914]" /> Free Express Shipping Over ₹1,999</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#E5A914]" /> Verified Secure Gateway & COD</span>
          <span>·</span>
          <span className="flex items-center gap-1.5"><RotateCcw className="w-4 h-4 text-[#E5A914]" /> Hassle-Free 7-Day Exchanges</span>
        </div>
      </section>

      {/* Featured Collection: New Arrivals Drop 04 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 border-b border-neutral-800 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              AUTUMN / WINTER 2026
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
              Drop 04 New Arrivals
            </h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-semibold uppercase tracking-widest text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors group"
          >
            <span>View All ({products.length} Pieces)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-96 bg-neutral-900/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* Shop by Silhouette / Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
            ARCHITECTURAL FOUNDATIONS
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
            Shop By Silhouette
          </h2>
          <p className="text-xs text-neutral-400 mt-2">
            Every garment is constructed from custom heavyweight yarn, specifically weighted to hold dramatic boxy proportions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.title}
              onClick={() => onNavigate('shop', { category: cat.category })}
              className="group relative h-[420px] rounded-lg overflow-hidden border border-neutral-800 cursor-pointer bg-neutral-900"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                <span className="text-[10px] uppercase tracking-widest font-mono text-[#E5A914] mb-1">
                  CATEGORY
                </span>
                <h3 className="font-display text-xl font-bold text-white uppercase">
                  {cat.title}
                </h3>
                <p className="text-xs text-neutral-300 mt-1 line-clamp-1">
                  {cat.desc}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white group-hover:text-[#E5A914] transition-colors">
                  <span>Explore Silhouette</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brutalist Editorial Lookbook Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-neutral-900/60 border border-neutral-800 rounded-xl overflow-hidden p-6 sm:p-10 lg:p-12">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              THE 4 LAZY ETHOS
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight leading-tight">
              REDEFINING EFFORTLESS STREETWEAR
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              We reject the friction of over-complicated styling. <strong>4 LAZY</strong> was born from a singular obsession: to build wardrobe anchors so impeccably cut that throwing them on guarantees an immaculate silhouette in seconds.
            </p>
            <div className="space-y-3 pt-2 text-xs text-neutral-400">
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5A914] mt-1.5 shrink-0" />
                <p><strong className="text-white">Custom Loopback French Terry:</strong> 500 GSM fleece woven from high-twist yarn prevents distortion after washing.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5A914] mt-1.5 shrink-0" />
                <p><strong className="text-white">Architectural Drop-Shoulder:</strong> Boxy cut creates clean linear angles without swallowing your frame.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E5A914] mt-1.5 shrink-0" />
                <p><strong className="text-white">Vintage Pigment Garment Dye:</strong> Muted earthy industrial hues with soft micro-texture.</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onNavigate('about')}
                className="bg-white hover:bg-neutral-200 text-black font-extrabold px-6 py-3 rounded text-xs uppercase tracking-widest transition-colors"
              >
                Read Full Manifesto
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 h-[460px] sm:h-[540px] rounded-lg overflow-hidden border border-neutral-800">
            <img
              src={lookbookImg}
              alt="4 LAZY Lookbook Model"
              className="w-full h-full object-cover object-top"
              referrerPolicy="no-referrer"
            />
          </div>

        </div>
      </section>

      {/* Customer Acclaim Strip */}
      <section className="border-y border-neutral-800/80 bg-neutral-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="p-4 border-l border-neutral-800">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[#E5A914] text-sm mb-2">
                ★★★★★
              </div>
              <p className="text-xs text-neutral-300 italic mb-3">
                &ldquo;The 280 GSM oversized tee is easily the best streetwear t-shirt in India right now. Collar stays razor sharp.&rdquo;
              </p>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Rohan M. · Mumbai</span>
            </div>

            <div className="p-4 border-l border-neutral-800">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[#E5A914] text-sm mb-2">
                ★★★★★
              </div>
              <p className="text-xs text-neutral-300 italic mb-3">
                &ldquo;The 500 GSM boxy hoodie has true architectural weight. The double-layered hood actually stands up without collapsing.&rdquo;
              </p>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Kabir S. · New Delhi</span>
            </div>

            <div className="p-4 border-l border-neutral-800">
              <div className="flex items-center justify-center md:justify-start gap-1 text-[#E5A914] text-sm mb-2">
                ★★★★★
              </div>
              <p className="text-xs text-neutral-300 italic mb-3">
                &ldquo;Pleated cargos with magnetic flaps are genius. Fast 3-day delivery via Blue Dart too.&rdquo;
              </p>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">Tanya K. · Bengaluru</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
