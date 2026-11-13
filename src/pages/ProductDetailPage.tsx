import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  ShoppingBag,
  Zap,
  Ruler,
  Truck,
  ShieldCheck,
  Star,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  Minus,
  Check,
  Upload,
  Trash2,
  Bell
} from 'lucide-react';
import type { Product, ProductVariant, Review, CustomPrintDetails } from '../types/index.ts';
import { fallbackProducts } from '../data/fallbackCatalog.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SizeGuideModal } from '../components/SizeGuideModal.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { compressUploadImage } from '../utils/imageUtils.ts';

interface ProductDetailPageProps {
  slug: string;
  categoryHint?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, categoryHint, onNavigate }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, token } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Upload Image for Customise T-Shirt products (sample print previews are shown in the 4 product slides)
  const [uploadedGraphicUrl, setUploadedGraphicUrl] = useState<string | null>(null);
  const [uploadingGraphic, setUploadingGraphic] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const customGraphicInputRef = useRef<HTMLInputElement>(null);

  // Back-in-stock "Notify Me" states for zero-stock variants/products
  const [showNotifyForm, setShowNotifyForm] = useState(false);
  const [notifyName, setNotifyName] = useState(user?.name || '');
  const [notifyEmail, setNotifyEmail] = useState(user?.email || '');
  const [notifyPhone, setNotifyPhone] = useState(user?.phone || '');
  const [submittingNotify, setSubmittingNotify] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);
  const [notifyError, setNotifyError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNotifyName(prev => prev || user.name || '');
      setNotifyEmail(prev => prev || user.email || '');
      setNotifyPhone(prev => prev || user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    setUploadedGraphicUrl(null);
    setUploadError(null);
    setShowNotifyForm(false);
    setNotifySuccess(null);
    setNotifyError(null);
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${slug}`)
      .then(res => res.json())
      .then(data => {
        const prod = data.product || fallbackProducts.find(p => p.slug === slug || p.id === slug);
        if (prod) {
          setProduct(prod);
          setReviews(data.reviews || []);
          setRelatedProducts(
            data.relatedProducts && data.relatedProducts.length > 0
              ? data.relatedProducts
              : fallbackProducts.filter(p => p.id !== prod.id && p.category === prod.category).slice(0, 4)
          );
          setSelectedColorIndex(0);
          setActiveImageIndex(0);

          const firstColorVariants = prod.variants.filter(
            (v: ProductVariant) => v.colorName.toLowerCase() === prod.colorGroups[0]?.colorName.toLowerCase()
          );
          if (firstColorVariants.length > 0) {
            const inStockVar = firstColorVariants.find((v: ProductVariant) => v.stock > 0) || firstColorVariants[0];
            setSelectedSize(inStockVar.size);
          }
        }
      })
      .catch(() => {
        const fallback = fallbackProducts.find(p => p.slug === slug || p.id === slug);
        if (fallback) {
          setProduct(fallback);
          setRelatedProducts(fallbackProducts.filter(p => p.id !== fallback.id).slice(0, 4));
          setSelectedColorIndex(0);
          setActiveImageIndex(0);
          const firstColorVariants = fallback.variants.filter(
            (v: ProductVariant) => v.colorName.toLowerCase() === fallback.colorGroups[0]?.colorName.toLowerCase()
          );
          if (firstColorVariants.length > 0) {
            setSelectedSize(firstColorVariants[0].size);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-[3/4] bg-neutral-900 rounded-lg" />
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
          onClick={() => onNavigate('shop', { category: categoryHint || 'all' })}
          className="mt-6 bg-[#E5A914] text-black font-extrabold px-6 py-2.5 text-xs uppercase tracking-widest rounded"
        >
          Return to Category
        </button>
      </div>
    );
  }

  const activeColorGroup = product.colorGroups[selectedColorIndex] || product.colorGroups[0];
  const rawGalleryImages =
    activeColorGroup?.images && activeColorGroup.images.length > 0
      ? activeColorGroup.images
      : product.variants[0]?.images || [];
  const galleryImages = rawGalleryImages.slice(0, 4);

  const activeVariant = product.variants.find(
    v => v.colorName.toLowerCase() === activeColorGroup?.colorName.toLowerCase() && v.size === selectedSize
  );

  const isCurrentVariantAvailable = activeVariant ? activeVariant.stock > 0 : false;
  const currentStock = activeVariant?.stock || 0;
  const isCustomizable =
    product.category.toLowerCase().includes('customis') ||
    product.category.toLowerCase().includes('customiz') ||
    Boolean(product.tags?.some(t => t.toLowerCase().includes('customis') || t.toLowerCase().includes('customiz')));

  const baseSalePrice = product.discountPrice || product.basePrice;
  const price = baseSalePrice;
  const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;
  const isWishlisted = isInWishlist(product.id);

  const handleCustomGraphicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a PNG, JPG, WEBP, or SVG image.');
      e.target.value = '';
      return;
    }

    setUploadError(null);
    setUploadingGraphic(true);
    try {
      const compressed = await compressUploadImage(file, 720, 0.85);
      setUploadedGraphicUrl(compressed);
    } catch (err: any) {
      setUploadError(err?.message || 'Unable to process image.');
    } finally {
      setUploadingGraphic(false);
      e.target.value = '';
    }
  };

  const handleColorChange = (index: number) => {
    setSelectedColorIndex(index);
    setActiveImageIndex(0);
    setShowNotifyForm(false);
    setNotifySuccess(null);
    setNotifyError(null);
    const newColor = product.colorGroups[index];
    const newColorVariants = product.variants.filter(
      v => v.colorName.toLowerCase() === newColor.colorName.toLowerCase()
    );
    const hasSameSize = newColorVariants.some(v => v.size === selectedSize && v.stock > 0);
    if (!hasSameSize && newColorVariants.length > 0) {
      const inStock = newColorVariants.find(v => v.stock > 0) || newColorVariants[0];
      setSelectedSize(inStock.size);
    }
  };

  const handleNotifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const cleanName = notifyName.trim();
    const cleanEmail = notifyEmail.trim();
    const cleanPhone = notifyPhone.trim();

    if (!cleanName || (!cleanEmail && !cleanPhone)) {
      setNotifyError('Please enter your name along with an email address or phone number.');
      return;
    }

    setSubmittingNotify(true);
    setNotifyError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/products/${product.id}/notify-me`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          variantId: activeVariant?.id,
          sku: activeVariant?.sku,
          colorName: activeColorGroup?.colorName || 'Default',
          size: selectedSize,
          customerName: cleanName,
          customerEmail: cleanEmail,
          customerPhone: cleanPhone
        })
      });
      const data = await res.json();
      if (res.ok) {
        setNotifySuccess(
          data.message || `You will be notified when ${product.title} (${selectedSize}) is back in stock.`
        );
        setShowNotifyForm(false);
      } else {
        setNotifyError(data.error || 'Could not register stock alert.');
      }
    } catch {
      setNotifyError('Network error while saving your notification request.');
    } finally {
      setSubmittingNotify(false);
    }
  };

  const handleAddToCart = () => {
    if (!activeVariant || !isCurrentVariantAvailable) return;

    const customPrint: CustomPrintDetails | undefined =
      isCustomizable && uploadedGraphicUrl
        ? {
            uploadedGraphicUrl,
            placement: 'center-chest',
            printTechnique: 'Custom Image Print'
          }
        : undefined;

    addToCart({
      productId: product.id,
      variantId: activeVariant.id,
      productTitle: product.title,
      colorName: activeVariant.colorName,
      colorHex: activeVariant.colorHex,
      size: activeVariant.size,
      sku: activeVariant.sku,
      price,
      originalPrice: product.basePrice,
      image: galleryImages[0] || '',
      quantity,
      maxStock: activeVariant.stock,
      customPrint
    });
  };

  const handleBuyNow = () => {
    if (!activeVariant || !isCurrentVariantAvailable) return;
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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-12 sm:space-y-16">
      {/* Nested Breadcrumb matching /home/category/product */}
      <nav className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-neutral-400 overflow-x-auto whitespace-nowrap no-scrollbar">
        <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors shrink-0">
          Home
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <button
          onClick={() => onNavigate('shop', { category: product.category })}
          className="hover:text-white transition-colors shrink-0"
        >
          {product.category}
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
        <span className="text-neutral-200 truncate">{product.title}</span>
      </nav>

      {/* Main PDP Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
        <div className="lg:col-span-7 space-y-3 sm:space-y-4">
          <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center group">
            <img
              src={galleryImages[activeImageIndex] || galleryImages[0]}
              alt={`${product.title} - Slide ${activeImageIndex + 1}`}
              className="w-full h-full object-cover object-center transition-all duration-300"
              referrerPolicy="no-referrer"
            />
            {product.isFeatured && (
              <span className="absolute top-3 left-3 bg-black/80 border border-[#E5A914]/40 text-[#E5A914] text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase">
                TRENDING DROP
              </span>
            )}

            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)}
                  aria-label="Previous product photo"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-[#E5A914] text-white hover:text-black border border-neutral-700 flex items-center justify-center transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(prev => (prev + 1) % galleryImages.length)}
                  aria-label="Next product photo"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-[#E5A914] text-white hover:text-black border border-neutral-700 flex items-center justify-center transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="absolute bottom-3 right-3 bg-black/80 border border-neutral-700 text-neutral-200 text-[10px] font-mono px-2.5 py-1 rounded uppercase tracking-wider tabular-nums">
                  Slide {activeImageIndex + 1} / {galleryImages.length}
                </span>
              </>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2.5">
              {galleryImages.map((img, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx ? 'border-[#E5A914] ring-1 ring-[#E5A914]' : 'border-neutral-800 opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.title} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-1 left-1 bg-black/75 text-neutral-200 text-[9px] font-mono px-1.5 py-0.5 rounded">
                    0{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-5 sm:space-y-6 lg:sticky lg:top-24">
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

            <div className="mt-4 flex flex-wrap items-baseline gap-3 font-mono">
              <span className="text-2xl font-bold text-white tabular-nums">
                ₹{price.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-sm text-neutral-400 line-through tabular-nums">
                  ₹{product.basePrice.toLocaleString()}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded tabular-nums">
                  SAVE ₹{(product.basePrice - baseSalePrice).toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">Inclusive of all taxes. Cashfree instant checkout enabled.</p>
          </div>

          <div className="pt-4 border-t border-neutral-800 space-y-2.5">
            <div className="text-xs">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                Color: <strong className="text-white">{activeColorGroup?.colorName}</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
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
                    className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0"
                    style={{ backgroundColor: cg.colorHex }}
                  />
                  <span>{cg.colorName}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400 uppercase tracking-wider font-semibold">
                Select Size
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
                    type="button"
                    onClick={() => {
                      setSelectedSize(sz);
                      setShowNotifyForm(false);
                      setNotifySuccess(null);
                      setNotifyError(null);
                    }}
                    title={isOutOfStock ? `${sz} is out of stock — select to join Notify Me waitlist` : `Select size ${sz}`}
                    className={`py-3 text-xs font-mono font-bold rounded-lg border transition-all ${
                      isSelected
                        ? isOutOfStock
                          ? 'border-[#E5A914] bg-neutral-900 text-[#E5A914] line-through shadow-md'
                          : 'border-[#E5A914] bg-[#E5A914] text-neutral-950 shadow-md'
                        : isOutOfStock
                        ? 'border-neutral-800 bg-neutral-950 text-neutral-500 line-through hover:border-neutral-700 hover:text-neutral-300'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>

            <div className="text-xs pt-1">
              {isCurrentVariantAvailable ? (
                currentStock < 10 ? (
                  <span className="text-[#E5A914] font-medium">
                    Low stock: only {currentStock} left in {selectedSize} ({activeColorGroup?.colorName})
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> In Stock &amp; Ready to Dispatch
                  </span>
                )
              ) : (
                <span className="text-amber-400 font-medium flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 shrink-0" />
                  Out of stock in {selectedSize} ({activeColorGroup?.colorName}) — Tap &ldquo;Notify Me&rdquo; for restock alert.
                </span>
              )}
            </div>
          </div>

          {/* Upload Image Panel Only for Customise T-Shirt (Sample print outcome is shown in the 4 product slides) */}
          {isCustomizable && (
            <div className="p-4 bg-neutral-900/70 border border-[#E5A914]/35 rounded-xl space-y-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#E5A914] block">
                  Upload Your Print Image
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Check the 4 sample product photos to see how the print comes, then upload your image here.
                </p>
              </div>

              <input
                ref={customGraphicInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleCustomGraphicUpload}
                className="hidden"
              />

              {uploadedGraphicUrl ? (
                <div className="flex items-center justify-between gap-3 p-2.5 bg-neutral-950 border border-neutral-800 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={uploadedGraphicUrl}
                      alt="Uploaded print image"
                      className="w-12 h-12 object-contain rounded bg-neutral-900 border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-emerald-400 truncate">Print Image Ready</p>
                      <button
                        type="button"
                        onClick={() => customGraphicInputRef.current?.click()}
                        className="text-[11px] text-neutral-400 hover:text-white underline"
                      >
                        Change image
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedGraphicUrl(null)}
                    className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-900 shrink-0"
                    title="Remove uploaded image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => customGraphicInputRef.current?.click()}
                  disabled={uploadingGraphic}
                  className="w-full py-3.5 px-4 border border-dashed border-neutral-700 hover:border-[#E5A914] bg-neutral-950 rounded-lg text-xs text-neutral-200 hover:text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 text-[#E5A914]" />
                  <span>{uploadingGraphic ? 'Uploading image...' : 'Upload Image (PNG / JPG / WEBP)'}</span>
                </button>
              )}
              {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
            </div>
          )}

          {isCurrentVariantAvailable && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Quantity:</span>
              <div className="flex items-center border border-neutral-700 rounded bg-neutral-950">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-neutral-400 hover:text-white"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="px-3 text-xs font-mono text-white font-bold tabular-nums">{quantity}</span>
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
          )}

          <div className="space-y-3 pt-1">
            {isCurrentVariantAvailable ? (
              <>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-4 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {`Add To Bag · ₹${(price * quantity).toLocaleString()}`}
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

                <button
                  onClick={handleBuyNow}
                  className="w-full bg-white hover:bg-neutral-200 text-black font-black py-3.5 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  Buy Now with Cashfree
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotifyForm(prev => !prev);
                      setNotifyError(null);
                    }}
                    className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold py-4 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg"
                  >
                    <Bell className="w-4 h-4" />
                    Notify Me
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

                {notifySuccess && (
                  <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{notifySuccess}</p>
                      <p className="text-[11px] text-emerald-400/80 mt-0.5">
                        Your request has been logged with our team for {activeColorGroup?.colorName} · Size {selectedSize}.
                      </p>
                    </div>
                  </div>
                )}

                {showNotifyForm && (
                  <form
                    onSubmit={handleNotifySubmit}
                    className="p-4 bg-neutral-900/80 border border-[#E5A914]/40 rounded-xl space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                      <div>
                        <span className="font-bold text-white uppercase tracking-wider block">
                          Restock Alert Request
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {product.title} · {activeColorGroup?.colorName} · Size {selectedSize}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={notifyName}
                          onChange={e => setNotifyName(e.target.value)}
                          placeholder="Your name"
                          className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={notifyEmail}
                            onChange={e => setNotifyEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                            required={!notifyPhone.trim()}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={notifyPhone}
                            onChange={e => setNotifyPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                            required={!notifyEmail.trim()}
                          />
                        </div>
                      </div>
                    </div>

                    {notifyError && <p className="text-[11px] text-red-400">{notifyError}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowNotifyForm(false)}
                        className="px-3 py-2 text-neutral-400 hover:text-white text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingNotify}
                        className="bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold px-4 py-2 rounded-lg text-xs uppercase tracking-wider disabled:opacity-50"
                      >
                        {submittingNotify ? 'Submitting...' : 'Notify Me on Restock'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-800/80 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#E5A914] shrink-0" />
              <span>Dispatches in 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#E5A914] shrink-0" />
              <span>7-Day Exchanges</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#E5A914] shrink-0" />
              <span>Pre-Shrunk Cotton</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-[#E5A914] shrink-0" />
              <span className="tabular-nums">{product.rating} / 5 ({product.reviewsCount})</span>
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Specifications &amp; Materiality
            </h3>
            <p className="text-xs text-neutral-300 leading-relaxed">{product.description}</p>
            <div className="space-y-1.5 text-xs text-neutral-400 pt-1 font-mono">
              <p><strong className="text-neutral-200 font-sans">Fabric:</strong> {product.details.fabric}</p>
              {product.details.gsm && (
                <p><strong className="text-neutral-200 font-sans">Weight:</strong> {product.details.gsm} GSM</p>
              )}
              <p><strong className="text-neutral-200 font-sans">Fit:</strong> {product.details.fit}</p>
              <p><strong className="text-neutral-200 font-sans">Care:</strong> {product.details.care}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <section className="border-t border-neutral-800 pt-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-800 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              COMMUNITY FEEDBACK
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
              Verified Buyer Reviews ({reviews.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">{product.rating}</span>
            <div className="flex text-[#E5A914]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-xs text-neutral-400">Be the first to review this piece.</p>
            ) : (
              reviews.map(rev => (
                <div key={rev.id} className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex text-[#E5A914]">
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
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className={`p-1.5 rounded ${star <= reviewRating ? 'text-[#E5A914]' : 'text-neutral-600'}`}
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
                    Your Experience
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="Describe fit, collar stiffness, fabric weight..."
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

      {/* Related Pieces Vertical Grid */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-neutral-800 pt-10">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
              MORE IN {product.category}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight mt-1">
              Recommended Pairings
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      <SizeGuideModal isOpen={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </div>
  );
};
