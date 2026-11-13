import React, { useState } from 'react';
import { Heart, ShoppingBag, Bell } from 'lucide-react';
import { Product } from '../types/index.ts';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, params?: any) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [showQuickSizes, setShowQuickSizes] = useState(false);

  const activeColorGroup = product.colorGroups[selectedColorIndex] || product.colorGroups[0];
  const displayImage = activeColorGroup?.images[0] || product.variants[0]?.images[0];
  const isWishlisted = isInWishlist(product.id);

  const price = product.discountPrice || product.basePrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;

  const colorVariants = product.variants.filter(
    v => v.colorName.toLowerCase() === activeColorGroup?.colorName.toLowerCase()
  );
  const isColorOutOfStock = colorVariants.length > 0 && colorVariants.every(v => v.stock <= 0);
  const isProductOutOfStock = product.variants.every(v => v.stock <= 0) || isColorOutOfStock;

  const handleQuickAdd = (variant: typeof product.variants[0], e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      productId: product.id,
      variantId: variant.id,
      productTitle: product.title,
      colorName: variant.colorName,
      colorHex: variant.colorHex,
      size: variant.size,
      sku: variant.sku,
      price: product.discountPrice || product.basePrice,
      originalPrice: product.basePrice,
      image: variant.images[0] || displayImage,
      quantity: 1,
      maxStock: variant.stock
    });
    setShowQuickSizes(false);
  };

  return (
    <article
      onClick={() => onNavigate('product-detail', { slug: product.slug, category: product.category })}
      className="group cursor-pointer flex flex-col bg-neutral-900/40 rounded-lg overflow-hidden border border-neutral-800/80 hover:border-neutral-700 transition-all duration-300 h-full"
    >
      {/* Vertical Portrait Image Slot */}
      <div className="relative aspect-[3/4] bg-neutral-950 overflow-hidden flex items-center justify-center">
        <img
          src={displayImage}
          alt={product.title}
          className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-500 ease-out"
          referrerPolicy="no-referrer"
        />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-neutral-950/75 backdrop-blur-md text-white hover:text-[#E5A914] transition-colors border border-white/10"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#E5A914] text-[#E5A914]' : ''}`} />
        </button>

        {isProductOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest text-neutral-200 bg-black/85 px-2 py-0.5 uppercase border border-neutral-700">
            SOLD OUT
          </span>
        ) : product.isFeatured ? (
          <span className="absolute top-2.5 left-2.5 text-[9px] sm:text-[10px] font-bold tracking-widest text-[#E5A914] bg-black/80 px-2 py-0.5 uppercase border border-[#E5A914]/30">
            TRENDING
          </span>
        ) : null}

        {/* Quick Size Selector / Notify Me: Visible on tap/mobile, hover reveal on desktop */}
        <div className="absolute inset-x-0 bottom-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent lg:opacity-0 lg:group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end">
          {isProductOutOfStock ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('product-detail', { slug: product.slug, category: product.category });
              }}
              className="w-full bg-neutral-900/95 text-[#E5A914] border border-[#E5A914]/60 hover:bg-[#E5A914] hover:text-black text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider py-1.5 sm:py-2 rounded transition-colors flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Bell className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Notify Me</span>
            </button>
          ) : showQuickSizes ? (
            <div className="w-full bg-neutral-900/95 backdrop-blur-md p-2 rounded border border-neutral-700 flex flex-wrap gap-1 justify-center">
              {colorVariants.map(v => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    if (v.stock === 0) {
                      e.stopPropagation();
                      onNavigate('product-detail', { slug: product.slug, category: product.category });
                      return;
                    }
                    handleQuickAdd(v, e);
                  }}
                  title={v.stock === 0 ? `Size ${v.size} out of stock — Click for Notify Me` : `Add size ${v.size}`}
                  className={`px-2 py-1 text-[10px] sm:text-[11px] font-mono font-bold rounded transition-colors ${
                    v.stock === 0
                      ? 'bg-neutral-800 text-neutral-400 hover:text-[#E5A914] line-through'
                      : 'bg-neutral-800 hover:bg-[#E5A914] hover:text-black text-neutral-200'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickSizes(true);
              }}
              className="w-full bg-white/95 text-neutral-950 hover:bg-[#E5A914] hover:text-black text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider py-1.5 sm:py-2 rounded transition-colors flex items-center justify-center gap-1.5 shadow-lg"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Quick Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Clean Vertical Metadata (1 category line, title, tabular price, color dots) */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 truncate">
            {product.category}
          </p>
          <h3 className="text-xs sm:text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-[#E5A914] transition-colors mt-0.5">
            {product.title}
          </h3>
          {product.subtitle && (
            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5 hidden sm:block">
              {product.subtitle}
            </p>
          )}
        </div>

        <div className="pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 font-mono">
            <span className="text-xs sm:text-sm font-bold text-white tabular-nums">
              ₹{price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-xs text-neutral-500 line-through tabular-nums">
                ₹{product.basePrice.toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            {product.colorGroups.slice(0, 3).map((col, idx) => (
              <button
                key={col.colorName}
                onClick={() => {
                  setSelectedColorIndex(idx);
                  setShowQuickSizes(false);
                }}
                title={col.colorName}
                aria-label={`Select color ${col.colorName}`}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border transition-transform ${
                  selectedColorIndex === idx
                    ? 'border-white scale-115 ring-1 ring-[#E5A914]'
                    : 'border-neutral-700 hover:scale-110 opacity-75 hover:opacity-100'
                }`}
                style={{ backgroundColor: col.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};
