import React, { useState, useEffect } from 'react';
import { Filter, X, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import { Product, Category } from '../types/index.ts';

interface ShopPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialParams?: { category?: string; search?: string };
}

export const ShopPage: React.FC<ShopPageProps> = ({ onNavigate, initialParams }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialParams?.category || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(initialParams?.search || '');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(7000);
  const [sortOption, setSortOption] = useState<string>('newest');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  useEffect(() => {
    if (initialParams?.category) setSelectedCategory(initialParams.category);
    if (initialParams?.search) setSearchQuery(initialParams.search);
  }, [initialParams]);

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(e => console.error(e));
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
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
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedSize, selectedColor, maxPrice, sortOption, searchQuery]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedSize('');
    setSelectedColor('');
    setMaxPrice(7000);
    setSortOption('newest');
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    selectedSize !== '' ||
    selectedColor !== '' ||
    maxPrice < 7000;

  const colorOptions = [
    { name: 'Washed Black', hex: '#1c1b1f' },
    { name: 'Vintage Bone', hex: '#ebe7df' },
    { name: 'Vintage Charcoal', hex: '#323237' },
    { name: 'Dark Charcoal', hex: '#252528' },
    { name: 'Bone Off-White', hex: '#e5e1d7' },
    { name: 'Pitch Black', hex: '#111112' }
  ];

  const sizeOptions = ['S', 'M', 'L', 'XL', 'XXL'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Shop Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold tracking-widest text-[#E5A914] uppercase">
            STREETWEAR ARCHIVE
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight mt-1">
            {selectedCategory === 'all' ? 'All Catalog Pieces' : selectedCategory}
          </h1>
          <p className="text-xs text-neutral-400 mt-1 max-w-xl">
            Explore 4 LAZY heavyweight drops, oversized drop-shoulder essentials, and tailored utility silhouettes.
          </p>
        </div>

        {/* Sort Dropdown & Mobile Filter Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden flex items-center gap-2 bg-neutral-900 border border-neutral-800 text-xs px-3 py-2 rounded text-neutral-200"
          >
            <Filter className="w-4 h-4 text-[#E5A914]" />
            Filters {hasActiveFilters && '•'}
          </button>

          <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-2 rounded text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
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
      </div>

      {/* Main Grid & Filters Split */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block space-y-6 bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-5 h-fit sticky top-28">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E5A914]" />
              Filter Archive
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-[#E5A914] hover:underline uppercase tracking-wider"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2.5">
              Category
            </h4>
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-neutral-800 text-[#E5A914] font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`w-full text-left px-2.5 py-1.5 rounded transition-colors ${
                    selectedCategory.toLowerCase() === c.name.toLowerCase()
                      ? 'bg-neutral-800 text-[#E5A914] font-semibold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {c.name}
                </button>
              ))}
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
                  className={`py-1.5 text-xs font-mono font-bold rounded border transition-colors ${
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
              Color Palette
            </h4>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map(col => (
                <button
                  key={col.name}
                  onClick={() => setSelectedColor(selectedColor === col.name ? '' : col.name)}
                  title={col.name}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] border transition-colors ${
                    selectedColor === col.name
                      ? 'border-[#E5A914] bg-neutral-800 text-white'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-neutral-700"
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
              <span className="font-mono text-white">₹{maxPrice.toLocaleString()}</span>
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
        </aside>

        {/* Product Catalog Grid */}
        <main className="md:col-span-3">
          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-xs text-neutral-400">Active Filters:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedSize && (
                <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                  Size: {selectedSize}
                  <button onClick={() => setSelectedSize('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedColor && (
                <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                  Color: {selectedColor}
                  <button onClick={() => setSelectedColor('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-200 text-xs px-2.5 py-1 rounded">
                  Search: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="h-96 bg-neutral-900/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-neutral-900/20 rounded-xl border border-neutral-800">
              <h3 className="font-display text-lg font-bold text-white uppercase tracking-wider mb-2">
                No matching pieces found
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto mb-6">
                Try broadening your filter criteria or reset to view all available drops.
              </p>
              <button
                onClick={resetFilters}
                className="bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
