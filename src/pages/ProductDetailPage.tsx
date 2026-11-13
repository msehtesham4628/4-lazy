import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Upload,
  Trash2,
  Type,
  Palette
} from 'lucide-react';
import type { Product, ProductVariant, Review, CustomPrintDetails } from '../types/index.ts';
import { fallbackProducts } from '../data/fallbackCatalog.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { SizeGuideModal } from '../components/SizeGuideModal.tsx';
import { ProductCard } from '../components/ProductCard.tsx';
import { compressUploadImage } from '../utils/imageUtils.ts';

const CUSTOM_INK_COLORS = [
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Luxury Gold', hex: '#E5A914' },
  { name: 'Pitch Black', hex: '#141416' },
  { name: 'Crimson Red', hex: '#D92638' },
  { name: 'Raw Silver', hex: '#A1A1AA' }
];

const CUSTOM_PLACEMENTS: { id: CustomPrintDetails['placement']; label: string; extra: number }[] = [
  { id: 'center-chest', label: 'Center Chest', extra: 0 },
  { id: 'left-chest', label: 'Left Chest', extra: 0 },
  { id: 'full-back', label: 'Full Back', extra: 200 },
  { id: 'sleeve', label: 'Sleeve', extra: 100 }
];

const CUSTOM_TECHNIQUES: { id: string; label: string; extra: number }[] = [
  { id: 'HD DTG Print', label: 'HD DTG Print', extra: 0 },
  { id: 'High-Density Screen Print', label: 'Screen Print', extra: 100 },
  { id: '3D Silicone Puff Ink', label: '3D Puff Ink', extra: 250 },
  { id: 'Metallic Gold Foil', label: 'Gold Foil', extra: 300 }
];

const CUSTOM_FONT_STYLES = ['Bold Sans', 'Technical Mono', 'Editorial Serif', 'Condensed'] as const;

interface ProductDetailPageProps {
  slug: string;
  categoryHint?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, categoryHint, onNavigate }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

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

  // Inline Customization Controls for Customise T-Shirt products
  const [placement, setPlacement] = useState<CustomPrintDetails['placement']>('center-chest');
  const [printTechnique, setPrintTechnique] = useState<string>('HD DTG Print');
  const [customText, setCustomText] = useState('');
  const [fontStyle, setFontStyle] = useState<string>('Bold Sans');
  const [textColor, setTextColor] = useState(CUSTOM_INK_COLORS[0]);
  const [uploadedGraphicUrl, setUploadedGraphicUrl] = useState<string | null>(null);
  const [uploadingGraphic, setUploadingGraphic] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const customGraphicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPlacement('center-chest');
    setPrintTechnique('HD DTG Print');
    setCustomText('');
    setFontStyle('Bold Sans');
    setTextColor(CUSTOM_INK_COLORS[0]);
    setUploadedGraphicUrl(null);
    setUploadError(null);
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
  const galleryImages =
    activeColorGroup?.images && activeColorGroup.images.length > 0
      ? activeColorGroup.images
      : product.variants[0]?.images || [];

  const activeVariant = product.variants.find(
    v => v.colorName.toLowerCase() === activeColorGroup?.colorName.toLowerCase() && v.size === selectedSize
  );

  const isCurrentVariantAvailable = activeVariant ? activeVariant.stock > 0 : false;
  const currentStock = activeVariant?.stock || 0;
  const isCustomizable =
    product.category.toLowerCase().includes('customis') ||
    product.category.toLowerCase().includes('customiz') ||
    Boolean(product.tags?.some(t => t.toLowerCase().includes('customis') || t.toLowerCase().includes('customiz')));

  const placementExtra = isCustomizable ? (CUSTOM_PLACEMENTS.find(p => p.id === placement)?.extra || 0) : 0;
  const techniqueExtra = isCustomizable ? (CUSTOM_TECHNIQUES.find(t => t.id === printTechnique)?.extra || 0) : 0;
  const customizationSurcharge = placementExtra + techniqueExtra;

  const baseSalePrice = product.discountPrice || product.basePrice;
  const price = baseSalePrice + customizationSurcharge;
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

  const handleAddToCart = () => {
    if (!activeVariant || !isCurrentVariantAvailable) return;

    const customPrint: CustomPrintDetails | undefined = isCustomizable
      ? {
          uploadedGraphicUrl: uploadedGraphicUrl || undefined,
          customText: customText.trim() || undefined,
          fontStyle: customText.trim() ? fontStyle : undefined,
          textColor: customText.trim() ? textColor.name : undefined,
          placement,
          printTechnique
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
      originalPrice: product.basePrice + customizationSurcharge,
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
          <div className="relative aspect-[3/4] sm:aspect-[4/5] bg-neutral-950 rounded-lg overflow-hidden border border-neutral-800 flex items-center justify-center">
            <img
              src={galleryImages[activeImageIndex] || galleryImages[0]}
              alt={`${product.title} - ${activeColorGroup?.colorName}`}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            {product.isFeatured && (
              <span className="absolute top-3 left-3 bg-black/80 border border-[#E5A914]/40 text-[#E5A914] text-[10px] font-bold tracking-widest px-2.5 py-1 uppercase">
                TRENDING DROP
              </span>
            )}

            {/* Live 2D Custom Print Overlay Preview for Customise T-Shirt */}
            {isCustomizable && (uploadedGraphicUrl || customText.trim()) && (
              <div
                className={`pointer-events-none absolute flex flex-col items-center justify-center text-center transition-all duration-300 ${
                  placement === 'left-chest'
                    ? 'top-[28%] right-[27%] w-[20%]'
                    : placement === 'sleeve'
                    ? 'top-[40%] left-[13%] w-[18%]'
                    : placement === 'full-back'
                    ? 'top-[28%] left-1/2 -translate-x-1/2 w-[44%]'
                    : 'top-[29%] left-1/2 -translate-x-1/2 w-[36%]'
                }`}
              >
                <div className="bg-black/25 backdrop-blur-[1px] border border-dashed border-[#E5A914]/60 rounded-lg p-2 flex flex-col items-center gap-1.5 w-full">
                  {uploadedGraphicUrl && (
                    <img
                      src={uploadedGraphicUrl}
                      alt="Custom artwork preview"
                      className="max-h-28 w-auto object-contain drop-shadow-md"
                    />
                  )}
                  {customText.trim() && (
                    <span
                      style={{ color: textColor.hex }}
                      className={`leading-tight break-words w-full drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] ${
                        fontStyle === 'Technical Mono'
                          ? 'font-mono tracking-wider text-xs sm:text-sm font-bold'
                          : fontStyle === 'Editorial Serif'
                          ? 'font-serif italic text-sm sm:text-base font-bold'
                          : fontStyle === 'Condensed'
                          ? 'font-display tracking-tighter uppercase text-sm sm:text-base font-black'
                          : 'font-sans uppercase tracking-wide text-xs sm:text-sm font-extrabold'
                      }`}
                    >
                      {customText}
                    </span>
                  )}
                </div>
              </div>
            )}

            {isCustomizable && (
              <span className="absolute bottom-3 left-3 bg-black/80 border border-neutral-700 text-neutral-200 text-[10px] font-mono px-2.5 py-1 rounded uppercase tracking-wider">
                Preview: {CUSTOM_PLACEMENTS.find(p => p.id === placement)?.label} · {printTechnique}
              </span>
            )}
          </div>

          {galleryImages.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-20 sm:w-20 sm:h-24 rounded overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-[#E5A914]' : 'border-neutral-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
                  ₹{(product.basePrice + customizationSurcharge).toLocaleString()}
                </span>
              )}
              {hasDiscount && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded tabular-nums">
                  SAVE ₹{(product.basePrice - baseSalePrice).toLocaleString()}
                </span>
              )}
              {customizationSurcharge > 0 && (
                <span className="text-[11px] text-[#E5A914] font-semibold tabular-nums">
                  (Includes +₹{customizationSurcharge} custom print)
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
                <span className="text-red-400 font-medium">
                  Sold out for this size/color combination.
                </span>
              )}
            </div>
          </div>

          {/* Inline Product Customization Panel for Customise T-Shirt */}
          {isCustomizable && (
            <div className="p-4 bg-neutral-900/70 border border-[#E5A914]/35 rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#E5A914] block">
                    Customize Your T-Shirt
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    Upload your graphic or add custom typography before ordering.
                  </p>
                </div>
                {(uploadedGraphicUrl || customText.trim() || customizationSurcharge > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setPlacement('center-chest');
                      setPrintTechnique('HD DTG Print');
                      setCustomText('');
                      setUploadedGraphicUrl(null);
                      setUploadError(null);
                    }}
                    className="text-[11px] text-neutral-400 hover:text-white underline shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Upload Custom Artwork */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-[#E5A914]" />
                  Upload Artwork / Logo (Optional)
                </label>
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
                        alt="Uploaded artwork"
                        className="w-11 h-11 object-contain rounded bg-neutral-900 border border-neutral-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-emerald-400 truncate">Artwork Ready for Print</p>
                        <button
                          type="button"
                          onClick={() => customGraphicInputRef.current?.click()}
                          className="text-[11px] text-neutral-400 hover:text-white underline"
                        >
                          Replace file
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedGraphicUrl(null)}
                      className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-900 shrink-0"
                      title="Remove graphic"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => customGraphicInputRef.current?.click()}
                    disabled={uploadingGraphic}
                    className="w-full py-3 px-4 border border-dashed border-neutral-700 hover:border-[#E5A914] bg-neutral-950 rounded-lg text-xs text-neutral-300 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-[#E5A914]" />
                    <span>{uploadingGraphic ? 'Compressing artwork...' : 'Choose PNG / JPG / SVG Graphic'}</span>
                  </button>
                )}
                {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
              </div>

              {/* Print Placement */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-semibold block">
                  Print Placement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOM_PLACEMENTS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPlacement(opt.id)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        placement === opt.id
                          ? 'border-[#E5A914] bg-neutral-950 text-white ring-1 ring-[#E5A914]'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[10px] font-mono text-[#E5A914]">
                        {opt.extra > 0 ? `+₹${opt.extra}` : 'Free'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Print Technique */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-semibold block">
                  Print Technique
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CUSTOM_TECHNIQUES.map(tech => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => setPrintTechnique(tech.id)}
                      className={`px-3 py-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                        printTechnique === tech.id
                          ? 'border-[#E5A914] bg-neutral-950 text-white ring-1 ring-[#E5A914]'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="font-semibold truncate pr-1">{tech.label}</span>
                      <span className="text-[10px] font-mono text-[#E5A914] shrink-0">
                        {tech.extra > 0 ? `+₹${tech.extra}` : 'Free'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Text & Typography */}
              <div className="space-y-2.5">
                <label className="text-[11px] uppercase tracking-wider text-neutral-300 font-semibold flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-[#E5A914]" />
                  Custom Text / Slogan (Optional)
                </label>
                <input
                  type="text"
                  maxLength={32}
                  value={customText}
                  onChange={e => setCustomText(e.target.value)}
                  placeholder="Enter custom print text (max 32 chars)..."
                  className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                />

                {customText.trim() && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="block text-[10px] uppercase text-neutral-400 mb-1">Font Style</span>
                      <select
                        value={fontStyle}
                        onChange={e => setFontStyle(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 px-2.5 py-2 text-xs text-white rounded-lg cursor-pointer"
                      >
                        {CUSTOM_FONT_STYLES.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-neutral-400 mb-1 flex items-center gap-1">
                        <Palette className="w-3 h-3" /> Ink Color ({textColor.name})
                      </span>
                      <div className="flex items-center gap-2 pt-1">
                        {CUSTOM_INK_COLORS.map(c => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => setTextColor(c)}
                            title={c.name}
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${
                              textColor.name === c.name ? 'border-[#E5A914] scale-110' : 'border-neutral-700'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

          <div className="space-y-3 pt-1">
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!isCurrentVariantAvailable}
                className="flex-1 bg-[#E5A914] hover:bg-[#d49b10] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-extrabold py-4 px-6 rounded-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-[0.99] shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                {isCurrentVariantAvailable ? `Add To Bag · ₹${(price * quantity).toLocaleString()}` : 'Out of Stock'}
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
                Buy Now with Cashfree
              </button>
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
