import React, { useState, useEffect } from 'react';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import type { Product, Category } from '../types/index.ts';
import { fallbackProducts, fallbackCategories } from '../data/fallbackCatalog.ts';
import {
  CATEGORY_ROUTE_META,
  getCategoryMeta,
  resolveCategoryFromSlugOrName
} from '../utils/routes.ts';

interface ShopPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: { category?: string; search?: string };
}

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, initialParams }) => {
  const [products, setProducts] = useState<Product[]>(fallbackProducts);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(false);

  const initialResolved = resolveCategoryFromSlugOrName(initialParams?.category);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialResolved && initialResolved !== 'all' ? initialResolved : 'Round Neck T-Shirt'
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialParams?.search || '');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(7000);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    const resolved = resolveCategoryFromSlugOrName(initialParams?.category);
    if (resolved && resolved !== 'all') {
      setSelectedCategory(resolved);
    } else if (!initialParams?.search) {
      setSelectedCategory('Round Neck T-Shirt');
    } else {
      setSelectedCategory('trending');
    }
    if (initialParams?.search !== undefined) {
      setSearchQuery(initialParams.search);
    }
  }, [initialParams?.category, initialParams?.search]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (d.categories && d.categories.length > 0) setCategories(d.categories);
      })
      .catch(e => console.error(e));
  }, []);

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setMobileFilterOpen(false);
    onNavigate('shop', { category: catName, search: searchQuery || undefined });
  };

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all' && !searchQuery.trim()) {
      params.append('category', selectedCategory);
    }
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedSize) params.append('size', selectedSize);
    if (selectedColor) params.append('color', selectedColor);
    if (maxPrice < 7000) params.append('maxPrice', maxPrice.toString());
    if (sortOption) params.append('sort', sortOption);

    fetch(`/api/products?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedCategory, selectedSize, selectedColor, maxPrice, sortOption, searchQuery]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSize('');
    setSelectedColor('');
    setMaxPrice(7000);
    setSortOption('newest');
    setMobileFilterOpen(false);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedSize !== '' ||
    selectedColor !== '' ||
    maxPrice < 7000;

  const colorOptions = [
    { name: 'Washed Black', hex: '#1c1b1f' },
    { name: 'Pure White', hex: '#f4f4f0' },
    { name: 'Vintage Bone', hex: '#ebe7df' },
    { name: 'Heather Grey', hex: '#9ca3af' },
    { name: 'Navy Ink', hex: '#1e293b' },
    { name: 'Olive Clay', hex: '#4a5543' }
  ];

  const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];

  // Category-specific Hero Banner config
  const catMeta = getCategoryMeta(selectedCategory);
  const heroTitle =
    searchQuery.trim()
      ? `Results for "${searchQuery.trim()}"`
      : selectedCategory === 'trending'
      ? 'Trending T-Shirts'
      : catMeta
      ? catMeta.heroTitle
      : selectedCategory;
  const heroDescription =
    selectedCategory === 'trending'
      ? 'Most ordered 4 LAZY silhouettes right now — top-selling heavyweight crewnecks, polos, and drop shoulders.'
      : catMeta
      ? catMeta.heroDescription
      : 'Engineered 280–320 GSM combed cotton silhouettes.';
  const heroImage =
    selectedCategory === 'trending'
      ? '/assets/images/hero_streetwear_campaign_1794056018871.jpg'
      : catMeta
      ? catMeta.heroImage
      : '/assets/images/campaign_editorial_lookbook_1794056022183.jpg';

  const FilterControls = () => (
    <div className="space-y-6">
      {/* Categories (Strictly the 6 T-Shirt Categories + Trending, no All T-Shirts option) */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
          Category
        </h4>
        <div className="space-y-1 text-xs">
          <button
            onClick={() => handleCategorySelect('trending')}
            className={`w-full text-left px-2.5 py-2 rounded transition-colors ${
              selectedCategory === 'trending'
                ? 'bg-neutral-800 text-[#E5A914] font-semibold'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
            }`}
          >
            Trending Products
          </button>
          {(categories.length > 0 ? categories : CATEGORY_ROUTE_META).map((c: any) => {
            const name = c.name;
            const isSelected = selectedCategory.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={c.id || c.slug || name}
                onClick={() => handleCategorySelect(name)}
                className={`w-full text-left px-2.5 py-2 rounded transition-colors ${
                  isSelected
                    ? 'bg-neutral-800 text-[#E5A914] font-semibold'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/50'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
          Size
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {sizeOptions.map(sz => (
            <button
              key={sz}
              onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
              className={`py-2 text-xs font-mono font-bold rounded border transition-colors ${
                selectedSize === sz
                  ? 'border-[#E5A914] bg-[#E5A914] text-black'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              {sz}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palettes */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
          Colorways
        </h4>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(col => (
            <button
              key={col.name}
              onClick={() => setSelectedColor(selectedColor === col.name ? '' : col.name)}
              title={col.name}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] border transition-colors ${
                selectedColor === col.name
                  ? 'border-[#E5A914] bg-neutral-800 text-white'
                  : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-neutral-700 shrink-0"
                style={{ backgroundColor: col.hex }}
              />
              <span>{col.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Slider */}
      <div>
        <div className="flex justify-between text-xs mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Max Price
          </span>
          <span className="font-mono text-white tabular-nums">₹{maxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min="1000"
          max="7000"
          step="250"
          value={maxPrice}
          onChange={e => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#E5A914] cursor-pointer"
        />
      </div>
    </div>
  );

  return (
    <div className="pb-16">
      {/* Category-Specific Hero Banner (No menu bar below Hero) */}
      <section className="relative h-56 sm:h-72 lg:h-80 overflow-hidden bg-neutral-950 border-b border-neutral-800">
        <img
          src={heroImage}
          alt={heroTitle}
          className="w-full h-full object-cover object-center opacity-55"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-neutral-950/30" />

        <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-6 sm:pb-10">
          <div className="max-w-2xl">
            <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-[#E5A914] uppercase">
              4 LAZY CATEGORY · {products.length} PIECES
            </span>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight mt-1">
              {heroTitle}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 line-clamp-2">
              {heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Toolbar & Product Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-xs px-3.5 py-2.5 rounded text-neutral-200 font-semibold min-h-[40px]"
          >
            <Filter className="w-4 h-4 text-[#E5A914]" />
            <span>Filters {hasActiveFilters ? '· Active' : ''}</span>
          </button>

          <p className="hidden md:block text-xs text-neutral-400">
            Showing <strong className="text-white tabular-nums">{products.length}</strong> T-Shirts in {heroTitle}
          </p>

          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-xs min-h-[40px]">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value)}
              className="bg-transparent text-white focus:outline-none text-xs cursor-pointer"
            >
              <option value="newest" className="bg-neutral-900">Newest Arrivals</option>
              <option value="price_asc" className="bg-neutral-900">Price: Low to High</option>
              <option value="price_desc" className="bg-neutral-900">Price: High to Low</option>
              <option value="popularity" className="bg-neutral-900">Most Popular</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-5 h-fit sticky top-24">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-neutral-800">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E5A914]" />
                Filter Category
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[11px] text-[#E5A914] hover:underline uppercase tracking-wider"
                >
                  Reset
                </button>
              )}
            </div>
            <FilterControls />
          </aside>

          {/* Product Grid */}
          <main className="md:col-span-3">
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 mb-5">
                {selectedSize && (
                  <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                    Size: {selectedSize}
                    <button onClick={() => setSelectedSize('')} aria-label="Clear size filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedColor && (
                  <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                    Color: {selectedColor}
                    <button onClick={() => setSelectedColor('')} aria-label="Clear color filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                    Search: &quot;{searchQuery}&quot;
                    <button onClick={() => setSearchQuery('')} aria-label="Clear search filter">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <div key={n} className="aspect-[3/4] bg-neutral-900/60 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-neutral-900/20 rounded-xl border border-neutral-800 px-4">
                <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                  No matching T-shirts found
                </h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6">
                  Try widening your size, color, or price filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Working Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-h-[85dvh] bg-neutral-950 border-t border-neutral-800 rounded-t-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white">
                <SlidersHorizontal className="w-4 h-4 text-[#E5A914]" />
                <span>Filter T-Shirts</span>
              </div>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-2 text-neutral-400 hover:text-white"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto overscroll-contain flex-1">
              <FilterControls />
            </div>

            <div className="p-4 border-t border-neutral-800 bg-neutral-900 flex items-center gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 py-3 rounded border border-neutral-700 text-xs font-bold uppercase tracking-wider text-neutral-300"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-[2] py-3 rounded bg-[#E5A914] text-black text-xs font-extrabold uppercase tracking-wider"
              >
                Show {products.length} Items
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
