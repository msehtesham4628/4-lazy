import React, { useState, useRef } from 'react';
import {
  Upload,
  Type,
  Layers,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  Check,
  ZoomIn,
  Sliders,
  ShieldCheck,
  Truck,
  Palette
} from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import type { CustomPrintDetails } from '../types/index.ts';
import { TShirt3DViewer } from '../components/TShirt3DViewer.tsx';
import { compressUploadImage } from '../utils/imageUtils.ts';

interface CustomizeStudioPageProps {
  onNavigate: (page: string, params?: any) => void;
}

interface BaseSilhouette {
  id: string;
  name: string;
  gsm: number;
  fit: string;
  collarType: string;
  basePrice: number;
  image: string;
}

const BASE_SILHOUETTES: BaseSilhouette[] = [
  {
    id: 'down_shoulder',
    name: 'Down Shoulder Boxy Tee',
    gsm: 280,
    fit: 'Exaggerated low shoulder, boxy drape',
    collarType: '1.25" Reinforced Collar',
    basePrice: 1699,
    image: '/assets/images/product_oversized_heavy_tee_1794056020516.jpg'
  },
  {
    id: 'round_neck',
    name: 'Round Neck T-Shirt',
    gsm: 280,
    fit: 'Structured square torso, high crewneck',
    collarType: 'Double-Needle Crew Collar',
    basePrice: 1499,
    image: '/assets/images/tshirt_round_neck_1794456303307.jpg'
  },
  {
    id: 'polo',
    name: 'Structured Polo Tee',
    gsm: 290,
    fit: 'Architectural streetwear polo, elbow-length sleeves',
    collarType: 'Ribbed Fold-Down Polo Collar',
    basePrice: 2199,
    image: '/assets/images/tshirt_polo_neck_1794456301588.jpg'
  },
  {
    id: 'laazy_designs',
    name: 'Laazy Designs Acid Wash',
    gsm: 300,
    fit: 'Slouchy down shoulder with raw frayed hems',
    collarType: 'Distressed Ribbed Neckline',
    basePrice: 1899,
    image: '/assets/images/tshirt_acid_wash_1794456303446.jpg'
  }
];

const BASE_COLORS = [
  { name: 'Pure White', hex: '#fbfbfe', textHex: '#111112' },
  { name: 'Pitch Black', hex: '#111112', textHex: '#ffffff' },
  { name: 'Vintage Bone', hex: '#ebe7df', textHex: '#141416' },
  { name: 'Washed Charcoal', hex: '#323237', textHex: '#ffffff' },
  { name: 'Olive Sage', hex: '#444a42', textHex: '#ffffff' },
  { name: 'Mineral Rust', hex: '#63433a', textHex: '#ffffff' }
];

const PRINT_PLACEMENTS = [
  {
    id: 'center-chest',
    name: 'Center Chest Graphic',
    sub: 'Iconic 10" × 12" focal print',
    extraPrice: 0,
    previewStyle: 'top-[30%] left-[28%] w-[44%] h-[38%]'
  },
  {
    id: 'left-chest',
    name: 'Left Chest Pocket Crest',
    sub: 'Subtle 3.5" × 3.5" minimal emblem',
    extraPrice: 0,
    previewStyle: 'top-[28%] left-[56%] w-[20%] h-[18%]'
  },
  {
    id: 'full-back',
    name: 'Full Back Monumental Canvas',
    sub: 'Full 12" × 16" streetwear back print',
    extraPrice: 250,
    previewStyle: 'top-[26%] left-[24%] w-[52%] h-[46%]'
  },
  {
    id: 'sleeve',
    name: 'Left Sleeve Monogram',
    sub: '2.5" × 2.5" subtle cuff mark',
    extraPrice: 150,
    previewStyle: 'top-[36%] left-[10%] w-[18%] h-[16%]'
  }
];

const PRINT_TECHNIQUES = [
  {
    id: 'screen_print',
    name: 'High-Density Screen Print',
    description: 'Crisp plastisol ink with sharp edge definition and rich pigment saturation.',
    priceAdjustment: 0
  },
  {
    id: 'dtg_vintage',
    name: 'Vintage DTG Soft-Wash',
    description: 'Water-based ink that penetrates directly into fibers for a zero-hand breathable feel.',
    priceAdjustment: 100
  },
  {
    id: 'puff_print',
    name: '3D Silicone Puff Print',
    description: 'Sculptural raised 3D ink that physically expands off the cotton canvas.',
    priceAdjustment: 250
  },
  {
    id: 'gold_foil',
    name: 'Metallic Gold Foil Stamp',
    description: 'High-vacuum reflective metallic foil heat-pressed for luxury jewelry sheen.',
    priceAdjustment: 350
  }
];

const PRESET_GRAPHICS = [
  {
    id: 'brutalist_arch',
    title: 'BRUTALIST ARCHIVE',
    tag: 'Constructivist',
    svgText: '4LAAZY\nBRUTALIST ARCHIVE\nDROP 04 / MONOLITH'
  },
  {
    id: 'subversive_96',
    title: 'SUBVERSIVE 1996',
    tag: 'Vintage Arc',
    svgText: 'SUBVERSIVE\n1996\nURBAN ARCHIVE'
  },
  {
    id: 'manifesto_block',
    title: 'LESS EFFORT. MORE STYLE.',
    tag: 'Manifesto',
    svgText: 'LESS EFFORT.\nMORE STYLE.\n4LAAZY HEAVYWEIGHTS'
  },
  {
    id: 'crest_monogram',
    title: 'GOLD 4L MONOGRAM',
    tag: 'Luxury Crest',
    svgText: '4 L Y\nHAUTE STREETWEAR'
  }
];

const FONT_OPTIONS = [
  { id: 'font-display', name: 'Brutalist Sans (Bold)', css: 'font-display font-black tracking-tight uppercase' },
  { id: 'font-mono', name: 'Technical Monospace', css: 'font-mono font-bold tracking-widest uppercase' },
  { id: 'font-serif', name: 'Luxury Editorial Serif', css: 'italic font-serif font-bold tracking-wide' },
  { id: 'font-condensed', name: 'Subversive Condensed', css: 'font-display font-bold tracking-tighter uppercase' }
];

const TEXT_COLORS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Luxury Gold', hex: '#E5A914' },
  { name: 'Pitch Black', hex: '#111112' },
  { name: 'Blood Crimson', hex: '#b91c1c' },
  { name: 'Raw Silver', hex: '#d4d4d8' }
];

export const CustomizeStudioPage: React.FC<CustomizeStudioPageProps> = ({ onNavigate }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Studio Customization States
  const [selectedSilhouette, setSelectedSilhouette] = useState<BaseSilhouette>(BASE_SILHOUETTES[0]);
  const [selectedColor, setSelectedColor] = useState(BASE_COLORS[0]);
  const [selectedPlacement, setSelectedPlacement] = useState(PRINT_PLACEMENTS[0]);
  const [selectedTechnique, setSelectedTechnique] = useState(PRINT_TECHNIQUES[0]);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');
  const [activeTab, setActiveTab] = useState<'text' | 'artwork' | 'presets'>('text');

  // Custom Content States
  const [customText, setCustomText] = useState('4LAAZY');
  const [customSubtitle, setCustomSubtitle] = useState('LESS EFFORT. MORE STYLE.');
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [selectedTextColor, setSelectedTextColor] = useState(TEXT_COLORS[1]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');
  const [scale, setScale] = useState(100);
  const [addedAnimation, setAddedAnimation] = useState(false);

  // File Upload Handler with Compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressUploadImage(file);
        setUploadedImage(compressed);
        setSelectedPreset(null);
      } catch (err) {
        console.error('Image compression failed', err);
      }
    }
  };

  // Pricing math
  const totalPrice = selectedSilhouette.basePrice + selectedPlacement.extraPrice + selectedTechnique.priceAdjustment;

  // Add customized t-shirt to cart
  const handleAddToCart = () => {
    const customPrintDetails: CustomPrintDetails = {
      customText: activeTab === 'text' ? `${customText} · ${customSubtitle}` : selectedPreset ? `Preset: ${selectedPreset}` : 'Custom Uploaded Artwork',
      textColor: selectedTextColor.name,
      fontStyle: selectedFont.name,
      placement: selectedPlacement.id as any,
      printTechnique: selectedTechnique.name,
      uploadedGraphicUrl: uploadedImage || undefined
    };

    const varId = `var_custom_${Date.now()}`;
    addToCart({
      productId: 'custom-print-tee',
      variantId: varId,
      productTitle: `Custom ${selectedSilhouette.name} (${selectedPlacement.name})`,
      colorName: selectedColor.name,
      colorHex: selectedColor.hex,
      size: selectedSize,
      sku: `4L-CUST-${selectedColor.name.substring(0, 2).toUpperCase()}-${selectedSize}`,
      price: totalPrice,
      originalPrice: totalPrice,
      image: selectedSilhouette.image || '/assets/images/tshirt_custom_print_1794456303137.jpg',
      quantity: 1,
      maxStock: 99,
      customPrint: customPrintDetails
    });

    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
      setIsCartOpen(true);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 pb-24">
      {/* Editorial Header */}
      <div className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">4LAAZY Studio</span>
              <span className="text-neutral-600">/</span>
              <span className="text-xs text-neutral-400 uppercase tracking-wider">Custom Print Atelier</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              CUSTOM T-SHIRT LAB
            </h1>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">Total Price</span>
              <span className="text-xl font-bold font-mono text-white">₹{totalPrice.toLocaleString()}</span>
            </div>
            <button
              onClick={handleAddToCart}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                addedAnimation
                  ? 'bg-emerald-500 text-black'
                  : 'bg-[#E5A914] hover:bg-[#d49b10] text-black shadow-lg shadow-[#E5A914]/10 active:scale-95'
              }`}
            >
              {addedAnimation ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Added to Bag</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Custom Tee</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: 3D ROTATABLE WHITE T-SHIRT VIEWER & BELOW UPLOAD OPTION */}
          <div className="lg:col-span-7 space-y-6 lg:sticky lg:top-36">
            
            {/* View Mode Switcher Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  Interactive Studio View
                </span>
                <span className="text-[10px] bg-[#E5A914]/20 border border-[#E5A914]/40 text-[#E5A914] px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                  3D Rotatable
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-mono">
                {selectedColor.name} · {selectedSilhouette.gsm} GSM
              </span>
            </div>

            {/* 3D Rotatable White T-Shirt Viewer with Below Upload Option */}
            <TShirt3DViewer
              colorHex={selectedColor.hex}
              uploadedGraphicUrl={uploadedImage}
              customText={activeTab === 'text' ? customText : activeTab === 'presets' && selectedPreset ? (PRESET_GRAPHICS.find(p => p.id === selectedPreset)?.title || '') : ''}
              customSubtitle={activeTab === 'text' ? customSubtitle : ''}
              fontStyle={selectedFont.css}
              textColorHex={selectedTextColor.hex}
              placement={selectedPlacement.id as any}
              printTechnique={selectedTechnique.name}
              scale={scale}
              onUploadImage={(imgUrl) => {
                setUploadedImage(imgUrl);
                setActiveTab('artwork');
              }}
              onRemoveImage={() => setUploadedImage(null)}
            />

            {/* Quality & Craftsmanship Badges */}
            <div className="grid grid-cols-3 gap-3 text-center text-xs pt-1">
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/60">
                <ShieldCheck className="w-4 h-4 mx-auto text-[#E5A914] mb-1" />
                <span className="font-bold text-white block text-[11px]">Fade-Proof Wash</span>
                <span className="text-[10px] text-neutral-400">Tested to 80+ wash cycles</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/60">
                <Layers className="w-4 h-4 mx-auto text-[#E5A914] mb-1" />
                <span className="font-bold text-white block text-[11px]">280–300 GSM Heavy</span>
                <span className="text-[10px] text-neutral-400">Pure combed compact knit</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/60">
                <Truck className="w-4 h-4 mx-auto text-[#E5A914] mb-1" />
                <span className="font-bold text-white block text-[11px]">Dispatches in 48h</span>
                <span className="text-[10px] text-neutral-400">Hand-pressed in studio</span>
              </div>
            </div>
          </div>

          {/* RIGHT: CUSTOMIZATION STUDIO CONTROLS */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* STEP 1: SELECT BASE SILHOUETTE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  1. Base T-Shirt Silhouette
                </h3>
                <span className="text-[11px] text-neutral-400">{selectedSilhouette.gsm} GSM</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {BASE_SILHOUETTES.map(sil => (
                  <button
                    key={sil.id}
                    type="button"
                    onClick={() => setSelectedSilhouette(sil)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedSilhouette.id === sil.id
                        ? 'bg-neutral-900 border-[#E5A914] shadow-md shadow-[#E5A914]/5'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span className="font-bold text-xs text-white block truncate">{sil.name}</span>
                    <span className="text-[10px] text-[#E5A914] font-medium block mt-0.5">{sil.collarType}</span>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 uppercase">{sil.gsm} GSM</span>
                      <span className="text-xs font-mono font-bold text-white">₹{sil.basePrice}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: SELECT BASE COLOR */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  2. Garment Dye Color
                </h3>
                <span className="text-[11px] text-neutral-300 font-medium">{selectedColor.name}</span>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {BASE_COLORS.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform relative flex items-center justify-center ${
                      selectedColor.name === c.name ? 'border-[#E5A914] scale-110 shadow-lg shadow-[#E5A914]/20' : 'border-neutral-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor.name === c.name && (
                      <Check className="w-4 h-4" style={{ color: c.textHex }} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 3: PRINT PLACEMENT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  3. Print Placement Area
                </h3>
                {selectedPlacement.extraPrice > 0 && (
                  <span className="text-[11px] text-[#E5A914] font-mono">+₹{selectedPlacement.extraPrice}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PRINT_PLACEMENTS.map(pl => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlacement(pl);
                      if (pl.id === 'full-back') setViewSide('back');
                      else setViewSide('front');
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      selectedPlacement.id === pl.id
                        ? 'bg-neutral-900 border-[#E5A914] text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block">{pl.name}</span>
                    <span className="text-[10px] text-neutral-500 block truncate">{pl.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 4: CUSTOM DESIGN & CONTENT TOOL (TABS) */}
            <div className="space-y-4 p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  4. Custom Artwork & Typography
                </h3>
                <div className="flex gap-1 bg-black/60 p-1 rounded-lg border border-neutral-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('text')}
                    className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                      activeTab === 'text' ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('artwork')}
                    className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                      activeTab === 'artwork' ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('presets');
                      if (!selectedPreset) setSelectedPreset(PRESET_GRAPHICS[0].id);
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                      activeTab === 'presets' ? 'bg-[#E5A914] text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Presets
                  </button>
                </div>
              </div>

              {/* TAB 1: TEXT CUSTOMIZATION */}
              {activeTab === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Main Graphic Slogan / Text
                    </label>
                    <input
                      type="text"
                      maxLength={24}
                      value={customText}
                      onChange={e => setCustomText(e.target.value)}
                      placeholder="e.g. 4LAAZY, ARCHIVE, OVERTHINK NOTHING"
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914] font-bold tracking-wider uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                      Subtext / Supporting Line (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={32}
                      value={customSubtitle}
                      onChange={e => setCustomSubtitle(e.target.value)}
                      placeholder="e.g. LESS EFFORT. MORE STYLE."
                      className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded-lg focus:outline-none focus:border-[#E5A914]"
                    />
                  </div>

                  {/* Font Family Picker */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                      Typography Aesthetic
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map(font => (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => setSelectedFont(font)}
                          className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                            selectedFont.id === font.id
                              ? 'bg-neutral-900 border-[#E5A914] text-[#E5A914]'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white'
                          }`}
                        >
                          <span className={font.css}>{font.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Color Picker */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1.5">
                      Ink Color
                    </label>
                    <div className="flex gap-2">
                      {TEXT_COLORS.map(tc => (
                        <button
                          key={tc.name}
                          type="button"
                          onClick={() => setSelectedTextColor(tc)}
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${
                            selectedTextColor.name === tc.name ? 'border-[#E5A914] scale-110' : 'border-neutral-700'
                          }`}
                          style={{ backgroundColor: tc.hex }}
                          title={tc.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ARTWORK UPLOAD */}
              {activeTab === 'artwork' && (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-neutral-800 hover:border-[#E5A914]/60 bg-neutral-950 p-6 rounded-xl text-center cursor-pointer transition-colors group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/svg+xml"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-8 h-8 mx-auto text-neutral-500 group-hover:text-[#E5A914] transition-colors mb-2" />
                    <span className="font-bold text-xs text-white block">Click or Drop Custom Artwork</span>
                    <span className="text-[10px] text-neutral-500 block mt-1">Supports PNG, JPG, SVG (Transparent PNG recommended for best screen print quality)</span>
                  </div>

                  {uploadedImage && (
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={uploadedImage} alt="Uploaded" className="w-10 h-10 object-contain rounded bg-neutral-900 p-1" />
                        <div>
                          <span className="text-xs font-bold text-white block">Uploaded Graphic</span>
                          <span className="text-[10px] text-emerald-400">Ready for print placement</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedImage(null)}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: 4LAAZY ARCHIVE PRESET GRAPHICS */}
              {activeTab === 'presets' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_GRAPHICS.map(pre => (
                    <button
                      key={pre.id}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(pre.id);
                        setCustomText(pre.title);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPreset === pre.id
                          ? 'bg-neutral-900 border-[#E5A914] text-white'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-[#E5A914] tracking-widest block">{pre.tag}</span>
                      <span className="text-xs font-bold text-white block mt-0.5">{pre.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* STEP 5: PRINT TECHNIQUE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  5. Printing Technique &amp; Finish
                </h3>
                <span className="text-[11px] text-neutral-400 font-medium">{selectedTechnique.name}</span>
              </div>

              <div className="space-y-2">
                {PRINT_TECHNIQUES.map(tech => (
                  <button
                    key={tech.id}
                    type="button"
                    onClick={() => setSelectedTechnique(tech)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-4 ${
                      selectedTechnique.id === tech.id
                        ? 'bg-neutral-900 border-[#E5A914] text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-white">{tech.name}</span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5 leading-relaxed">{tech.description}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#E5A914] shrink-0">
                      {tech.priceAdjustment === 0 ? 'Included' : `+₹${tech.priceAdjustment}`}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 6: SIZE & FIT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-widest text-[#E5A914]">
                  6. Select Size
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="text-[11px] text-[#E5A914] hover:underline"
                >
                  Size Matrix Guide
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {(['S', 'M', 'L', 'XL', 'XXL'] as const).map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`py-2.5 rounded-lg border font-mono font-bold text-xs transition-all ${
                      selectedSize === sz
                        ? 'bg-[#E5A914] text-black border-[#E5A914]'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA SUMMARY & ACTION */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Base Garment ({selectedSilhouette.name})</span>
                  <span className="font-mono text-white">₹{selectedSilhouette.basePrice}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Placement ({selectedPlacement.name})</span>
                  <span className="font-mono text-white">
                    {selectedPlacement.extraPrice === 0 ? 'Included' : `₹${selectedPlacement.extraPrice}`}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Print Finish ({selectedTechnique.name})</span>
                  <span className="font-mono text-white">
                    {selectedTechnique.priceAdjustment === 0 ? 'Included' : `₹${selectedTechnique.priceAdjustment}`}
                  </span>
                </div>
                <div className="border-t border-neutral-800 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Total Investment</span>
                  <span className="font-mono text-base text-[#E5A914]">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                className="w-full py-3.5 bg-[#E5A914] hover:bg-[#d49b10] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-[#E5A914]/10 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Customized T-Shirt to Bag</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
