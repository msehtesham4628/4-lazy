import React, { useState, useEffect } from 'react';
import {
  Heart,
  ShoppingBag,
  Zap,
  Ruler,
  Truck,
  ShieldCheck,
  Star,
  ChevronRight,
  RotateCcw,
  Plus,
  Minus,
  Check
} from 'lucide-react';
import { Product, ProductVariant, Review } from '../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { SizeGuideModal } from '../components/SizeGuideModal.tsx';
import { ProductCard } from '../components/ProductCard.tsx';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Variant Selection State
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  // Review Form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.product) {
          setProduct(data.product);
          setReviews(data.reviews || []);
          setRelatedProducts(data.relatedProducts || []);
          setSelectedColorIndex(0);
          setActiveImageIndex(0);

          // Find first available size
          const firstColorVariants = data.product.variants.filter(
            (v: ProductVariant) => v.colorName.toLowerCase() === data.product.colorGroups[0]?.colorName.toLowerCase()
          );
          if (firstColorVariants.length > 0) {
            const inStockVar = firstColorVariants.find((v: ProductVariant) => v.stock > 0) || firstColorVariants[0];
            setSelectedSize(inStockVar.size);
          }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
          <div className="h-[550px] bg-neutral-900 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-neutral-900 rounded w-3/4" />
            <div className="h-6 bg-neutral-900 rounded w-1/4" />
            <div className="h-32 bg-neutral-900 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white uppercase">Product Not Found</h2>
        <p className="text-xs text-neutral-400 mt-2">The requested piece may have been archived.</p>
        <button
          onClick={() => onNavigate('shop')}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Return to All Drops
        </button>
      </div>
    );
  }

  // Active color group & color-specific images
  const activeColorGroup = product.colorGroups[selectedColorIndex] || product.colorGroups[0];
  const galleryImages = activeColorGroup?.images && activeColorGroup.images.length > 0
    ? activeColorGroup.images
    : product.variants[0]?.images || [];

  // Active variant based on color and size
  const activeVariant = product.variants.find(
    v => v.colorName.toLowerCase() === activeColorGroup?.colorName.toLowerCase() && v.size === selectedSize
  );

  const isCurrentVariantAvailable = activeVariant ? activeVariant.stock > 0 : false;
  const currentStock = activeVariant?.stock || 0;
  const price = product.discountPrice || product.basePrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;
  const isWishlisted = isInWishlist(product.id);

  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setActiveImageIndex(0); // Switch gallery image immediately
    const newColor = product.colorGroups[index];
    // Check if current selected size exists in this new color, otherwise switch to first available
    const newColorVariants = product.variants.filter(
      v => v.colorName.toLowerCase() === newColor.colorName.toLowerCase()
    );
    const hasSameSize = newColorVariants.some(v => v.size === selectedSize && v.stock > 0);
    if (!hasSameSize && newColorVariants.length > 0) {
      const inStock = newColorVariants.find(v => v.stock > 0) || newColorVariants[0];
      setSelectedSize(inStock.size);
    }
  };

  const handleAddToCart = () => {
    if (!activeVariant || !isCurrentVariantAvailable) return;

    addToCart({
      productId: product.id,
      variantId: activeVariant.id,
      productTitle: product.title,
      colorName: activeVariant.colorName,
      colorHex: activeVariant.colorHex,
      size: activeVariant.size,
      sku: activeVariant.sku,
      price: product.discountPrice || product.basePrice,
      originalPrice: product.basePrice,
      image: galleryImages[0] || '',
      quantity,
      maxStock: activeVariant.stock
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    setIsCartOpen(false);
    onNavigate('checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          userName: reviewName.trim() || 'Verified Buyer',
          comment: reviewComment.trim(),
          title: 'Verified Purchase'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setReviews([data.review, ...reviews]);
        setReviewSuccess(true);
        setReviewComment('');
        setReviewName('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReview(false);
    }
  };

  const availableSizesForColor = product.variants.filter(
    v => v.colorName.toLowerCase() === activeColorGroup?.colorName.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400">
        <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">Home</button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
        <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors">Shop</button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
        <button onClick={() => onNavigate('shop', { category: product.category })} className="hover:text-white transition-colors">
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
        <span className="text-neutral-200 truncate">{product.title}</span>
      </nav>

      {/* Main PDP Grid: Left Sticky Gallery + Right Contiguous Purchase Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        
        {/* Left Column: Image Gallery with Interactive Thumbnails */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Display with Subtle Zoom */}
          <div className="relative aspect-[4/5] bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center">
            <img
              src={galleryImages[activeImageIndex] || galleryImages[0]}
              alt={`${product.title} - ${activeColorGroup?.colorName}`}
              className="w-full h-full object-cover object-center cursor-zoom-in"
              referrerPolicy="no-referrer"
            />
            {product.isFeatured && (
              <span className="absolute top-4 left-4 bg-black/80 border border-[#E5A914]/40 text-[#E5A914] text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase">
                DROP 04 FLAGSHIP
              </span>
            )}
          </div>

          {/* Color-specific Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 rounded overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-[#E5A914]' : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#E5A914]">
              {product.category}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white uppercase tracking-tight mt-1">
              {product.title}
            </h1>
            {product.subtitle && (
              <p className="text-xs text-neutral-400 mt-1 font-medium">{product.subtitle}</p>
            )}

            {/* Price with Tabular Numerals */}
            <div className="mt-4 flex items-baseline gap-3 font-mono">
              <span className="text-2xl font-bold text-white tabular-nums">
                ₹{price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-neutral-400 line-through tabular-nums">
                  ₹{product.basePrice.toLocaleString()}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  SAVE ₹{(product.basePrice - price).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Inclusive of all taxes. Free express shipping on this piece.</p>
          </div>

          {/* Color Selector Requirement: Selecting color switches gallery images automatically */}
          <div className="pt-4 border-t border-neutral-800 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                Color: <strong className="text-white">{activeColorGroup?.colorName}</strong>
              </span>
            </div>
            <div className="flex gap-3">
              {product.colorGroups.map((cg, idx) => (
                <button
                  key={cg.colorName}
                  onClick={() => handleColorChange(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                    selectedColorIndex === idx
                      ? 'border-[#E5A914] bg-neutral-900 text-white ring-1 ring-[#E5A914]'
                      : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-neutral-700"
                    style={{ backgroundColor: cg.colorHex }}
                  />
                  <span>{cg.colorName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Selector with Live Stock Indication */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                Select Size (Oversized Boxy Cut)
              </span>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="text-[#E5A914] hover:underline flex items-center gap-1 font-medium"
              >
                <Ruler className="w-3.5 h-3.5" />
                Sizing Matrix
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {['S', 'M', 'L', 'XL', 'XXL'].map(sz => {
                const variantForSize = availableSizesForColor.find(v => v.size === sz);
                const isOutOfStock = !variantForSize || variantForSize.stock <= 0;
                const isSelected = selectedSize === sz;

                return (
                  <button
                    key={sz}
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(sz)}
                    className={`py-3 text-xs font-mono font-bold rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[#E5A914] bg-[#E5A914] text-neutral-950 shadow-md'
                        : isOutOfStock
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-600 line-through cursor-not-allowed'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            {/* Live Stock Availability Feedback */}
            <div className="text-xs pt-1">
              {isCurrentVariantAvailable ? (
                currentStock < 10 ? (
                  <span className="text-[#E5A914] font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E5A914]" />
                    Architectural Edition: Only {currentStock} left in stock for size {selectedSize} ({activeColorGroup?.colorName})
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> In Stock & Ready to Dispatch via Blue Dart
                  </span>
                )
              ) : (
                <span className="text-red-400 font-medium">
                  Sold out for this size/color combination. Please select another size or color.
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Quantity:</span>
            <div className="flex items-center border border-neutral-700 rounded bg-neutral-950">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-neutral-400 hover:text-white"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-3 text-xs font-mono text-white font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(currentStock || 1, quantity + 1))}
                disabled={quantity >= currentStock}
                className="px-3 py-1.5 text-neutral-400 hover:text-white disabled:opacity-40"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            {activeVariant && (
              <span className="text-[11px] font-mono text-neutral-400">SKU: {activeVariant.sku}</span>
            )}
          </div>

          {/* Action CTAs: Add to Cart + Buy Now + Wishlist */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!isCurrentVariantAvailable}
                className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold py-4 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                {isCurrentVariantAvailable ? 'Add To Bag' : 'Out of Stock'}
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                aria-label="Wishlist piece"
                className={`p-4 rounded-lg border transition-colors ${
                  isWishlisted
                    ? 'border-[#E5A914] bg-[#E5A914]/10 text-[#E5A914]'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-[#E5A914]' : ''}`} />
              </button>
            </div>

            {isCurrentVariantAvailable && (
              <button
                onClick={handleBuyNow}
                className="w-full bg-white hover:bg-neutral-200 text-black font-black py-3.5 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4 fill-current" />
                Instant Buy Now
              </button>
            )}
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800/80 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#E5A914]" />
              <span>Dispatches in 24 Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#E5A914]" />
              <span>7-Day Return / Exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E5A914]" />
              <span>Pre-Shrunk 100% Cotton</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#E5A914]" />
              <span>{product.rating} / 5.0 ({product.reviewsCount} reviews)</span>
            </div>
          </div>

          {/* Product Specifications & Craftsmanship */}
          <div className="pt-4 border-t border-neutral-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Specifications & Materiality
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {product.description}
            </p>
            <div className="space-y-1.5 text-xs text-neutral-400 pt-2 font-mono">
              <p><strong className="text-neutral-200 font-sans">Fabric:</strong> {product.details.fabric}</p>
              {product.details.gsm && (
                <p><strong className="text-neutral-200 font-sans">Weight:</strong> {product.details.gsm} GSM Custom Weave</p>
              )}
              <p><strong className="text-neutral-200 font-sans">Fit:</strong> {product.details.fit}</p>
              <p><strong className="text-neutral-200 font-sans">Care:</strong> {product.details.care}</p>
              {product.details.modelStats && (
                <p><strong className="text-neutral-200 font-sans">Model:</strong> {product.details.modelStats}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="border-t border-neutral-800 pt-12 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              COMMUNITY FEEDBACK
            </span>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight mt-1">
              Verified Buyer Reviews ({reviews.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-white">{product.rating}</span>
            <div className="flex text-[#E5A914] text-sm">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
            <span className="text-xs text-neutral-400">({product.reviewsCount} total ratings)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-neutral-400">Be the first to review this piece.</p>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex text-[#E5A914] text-xs">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{rev.title}</h4>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{rev.comment}</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-semibold uppercase">
                    <span>{rev.userName}</span>
                    <span>·</span>
                    <span className="text-emerald-400">Verified Buyer</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Write a Review Form */}
          <div className="lg:col-span-5 bg-neutral-900/40 border border-neutral-800 rounded-lg p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Write an Editorial Review
            </h3>
            {reviewSuccess ? (
              <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3 rounded text-xs">
                Thank you! Your verified review has been published.
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`p-1.5 rounded ${
                          star <= reviewRating ? 'text-[#E5A914]' : 'text-neutral-600'
                        }`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={e => setReviewName(e.target.value)}
                    placeholder="e.g. Aryan V."
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                    Your Experience with Fit & Fabric
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Describe the drape, collar stiffness, fabric weight..."
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded focus:outline-none focus:border-neutral-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Related Pieces Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-neutral-800 pt-12">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              COMPLETE THE LOOK
            </span>
            <h2 className="font-display text-2xl font-black text-white uppercase tracking-tight mt-1">
              Recommended Pairings
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sizing Modal */}
      <SizeGuideModal
        isOpen={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />
    </div>
  );
};
