import React from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-neutral-900 border border-neutral-800 rounded-xl max-w-2xl w-full p-6 text-neutral-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#E5A914]" />
            <h2 className="font-display text-lg font-bold uppercase tracking-wider text-white">
              4LAAZY Architectural Sizing Matrix
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-neutral-300 leading-relaxed">
            All 4LAAZY silhouettes are cut with an intentional <strong>drop-shoulder boxy drape</strong>.
            For an authentic relaxed streetwear drape, select your true size. For a standard closer fit, size down one step.
          </p>

          {/* Sizing Table */}
          <div className="overflow-x-auto border border-neutral-800 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 uppercase tracking-wider border-b border-neutral-800">
                  <th className="p-3">Size</th>
                  <th className="p-3">Chest (Inches)</th>
                  <th className="p-3">Length (Inches)</th>
                  <th className="p-3">Shoulder (Inches)</th>
                  <th className="p-3">Recommended Height</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 font-mono text-neutral-200">
                <tr className="hover:bg-neutral-800/40">
                  <td className="p-3 font-bold text-white">S (Small)</td>
                  <td className="p-3">44&quot; (112 cm)</td>
                  <td className="p-3">28.5&quot; (72 cm)</td>
                  <td className="p-3">22.5&quot;</td>
                  <td className="p-3 text-neutral-400 font-sans">5&apos;5&quot; – 5&apos;8&quot;</td>
                </tr>
                <tr className="hover:bg-neutral-800/40">
                  <td className="p-3 font-bold text-white">M (Medium)</td>
                  <td className="p-3">46&quot; (117 cm)</td>
                  <td className="p-3">29.5&quot; (75 cm)</td>
                  <td className="p-3">23.5&quot;</td>
                  <td className="p-3 text-neutral-400 font-sans">5&apos;8&quot; – 5&apos;11&quot;</td>
                </tr>
                <tr className="hover:bg-neutral-800/40">
                  <td className="p-3 font-bold text-white">L (Large)</td>
                  <td className="p-3">48&quot; (122 cm)</td>
                  <td className="p-3">30.5&quot; (77 cm)</td>
                  <td className="p-3">24.5&quot;</td>
                  <td className="p-3 text-neutral-400 font-sans">5&apos;11&quot; – 6&apos;2&quot;</td>
                </tr>
                <tr className="hover:bg-neutral-800/40">
                  <td className="p-3 font-bold text-white">XL (Extra Large)</td>
                  <td className="p-3">51&quot; (130 cm)</td>
                  <td className="p-3">31.5&quot; (80 cm)</td>
                  <td className="p-3">25.5&quot;</td>
                  <td className="p-3 text-neutral-400 font-sans">6&apos;1&quot; – 6&apos;4&quot;</td>
                </tr>
                <tr className="hover:bg-neutral-800/40">
                  <td className="p-3 font-bold text-white">XXL (Double XL)</td>
                  <td className="p-3">54&quot; (137 cm)</td>
                  <td className="p-3">32.5&quot; (82 cm)</td>
                  <td className="p-3">26.5&quot;</td>
                  <td className="p-3 text-neutral-400 font-sans">6&apos;3&quot;+</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
            <p className="font-semibold text-white uppercase tracking-wider">Garment Care Instructions:</p>
            <p>1. Wash inside-out in cold water (30°C max) to preserve heavy knit density and rich pigment saturation.</p>
            <p>2. Hang dry in shade. Avoid machine tumble drying on high heat to prevent fiber tension release.</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#E5A914] text-neutral-950 font-bold px-5 py-2 rounded text-xs uppercase tracking-wider hover:bg-[#d49b10]"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
