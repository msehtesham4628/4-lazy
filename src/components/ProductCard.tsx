import React, { useState } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
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

  // Available sizes for the active color
  const colorVariants = product.variants.filter(
    v => v.colorName.toLowerCase() === activeColorGroup?.colorName.toLowerCase()
  );

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
    <div
      onClick={() => onNavigate('product-detail', { slug: product.slug })}
      className="group cursor-pointer flex flex-col bg-neutral-900/40 rounded-lg overflow-hidden border border-neutral-800/80 hover:border-neutral-700 transition-all duration-300"
    >
      {/* Product Image Slot with Aspect Ratio */}
      <div className="relative aspect-[4/5] bg-neutral-950 overflow-hidden flex items-center justify-center">
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
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 p-2 rounded-full bg-neutral-950/70 backdrop-blur-md text-white hover:text-[#E5A914] transition-colors border border-white/10"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#E5A914] text-[#E5A914]' : ''}`} />
        </button>

        {/* Subtle Tag / Edition Notice */}
        {product.isFeatured && (
          <span className="absolute top-3 left-3 text-[10px] font-bold tracking-widest text-[#E5A914] bg-black/80 px-2 py-0.5 uppercase border border-[#E5A914]/30">
            FLAGSHIP DROP
          </span>
        )}

        {/* Quick Size Selector Slide-up on hover/click */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end">
          {showQuickSizes ? (
            <div className="w-full bg-neutral-900/95 backdrop-blur-md p-2 rounded border border-neutral-700 flex flex-wrap gap-1.5 justify-center">
              {colorVariants.map(v => (
                <button
                  key={v.id}
                  disabled={v.stock === 0}
                  onClick={(e) => handleQuickAdd(v, e)}
                  className={`px-2 py-1 text-[11px] font-mono font-bold rounded transition-colors ${
                    v.stock === 0
                      ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed line-through'
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
              className="w-full bg-white/95 text-neutral-950 hover:bg-[#E5A914] hover:text-black text-[11px] font-extrabold uppercase tracking-widest py-2 rounded transition-colors flex items-center justify-center gap-1.5 shadow-lg"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Quick Select Size
            </button>
          )}
        </div>
      </div>

      {/* Product Content & Metadata */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category */}
          <div className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-1">
            {product.category}
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-semibold text-white tracking-tight line-clamp-1 group-hover:text-[#E5A914] transition-colors">
            {product.title}
          </h3>

          {/* Subtitle / Fabric Spec */}
          {product.subtitle && (
            <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
              {product.subtitle}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between">
          {/* Price with Tabular Numerals */}
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-sm font-bold text-white tabular-nums">
              ₹{price.toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-xs text-neutral-400 line-through tabular-nums">
                ₹{product.basePrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Interactive Color Swatches */}
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            {product.colorGroups.map((col, idx) => (
              <button
                key={col.colorName}
                onClick={() => {
                  setSelectedColorIndex(idx);
                  setShowQuickSizes(false);
                }}
                title={col.colorName}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  selectedColorIndex === idx
                    ? 'border-white scale-125 ring-1 ring-[#E5A914]'
                    : 'border-neutral-700 hover:scale-110 opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: col.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
