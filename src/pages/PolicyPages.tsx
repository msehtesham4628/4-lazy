import React, { useState } from 'react';
import { Mail, Phone, MapPin, CheckCircle2, Shield, Truck, RotateCcw } from 'lucide-react';

interface PolicyPagesProps {
  page: 'about' | 'contact' | 'shipping-returns' | 'privacy-policy' | 'terms' | 'size-guide';
  onNavigate: (page: string, params?: any) => void;
}

export const PolicyPages: React.FC<PolicyPagesProps> = ({ page, onNavigate }) => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactForm.email && contactForm.message) {
      setContactSent(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    }
  };

  if (page === 'about') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
            BRAND MANIFESTO
          </span>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-white uppercase tracking-tight">
            LESS EFFORT. MORE STYLE.
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            The founding philosophy of 4 LAZY: Luxury should feel intuitive, effortless, and uncompromisingly bold.
          </p>
        </div>

        <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 sm:p-12 space-y-8 text-neutral-300 text-sm leading-relaxed">
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">
              1. The Streetwear Monolith
            </h2>
            <p>
              Contemporary fast fashion has overwhelmed modern dressing with transient micro-trends, flimsy 160 GSM fabrics, and collapsing collars. <strong>4 LAZY</strong> was founded to execute the exact opposite: heavy, sculptural garments that stand as architectural statements on their own.
            </p>
          </div>

          <div className="space-y-4 border-t border-neutral-800 pt-6">
            <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">
              2. Custom Heavyweight Knits (280–500 GSM)
            </h2>
            <p>
              Every textile in our drops is custom-milled. Our oversized t-shirts utilize dense 280 GSM combed cotton jersey that retains its boxy drape without clinging. Our flagship hoodies utilize 500 GSM unbrushed loopback French Terry—delivering sculptural hood geometry and substantial tactile presence.
            </p>
          </div>

          <div className="space-y-4 border-t border-neutral-800 pt-6">
            <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">
              3. The Drop-Shoulder Geometry
            </h2>
            <p>
              An oversized garment is not merely a larger size; it is a meticulously re-engineered pattern. We drop the shoulder seam while carefully calibrating body length and sleeve curvature so the silhouette stays sharp, powerful, and proportional across every body type.
            </p>
          </div>
        </div>

        <div className="text-center pt-4">
          <button
            onClick={() => onNavigate('shop')}
            className="bg-[#E5A914] text-black font-extrabold px-8 py-3.5 rounded text-xs uppercase tracking-widest hover:bg-[#d49b10] transition-colors"
          >
            Explore Drop 04 Now
          </button>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
            STUDIO CONCIERGE
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
            Contact 4 LAZY
          </h1>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Our concierge team is available Monday through Saturday, 10:00 AM – 7:00 PM IST.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-6">
            <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
              Concierge Touchpoints
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 text-neutral-300">
                <Mail className="w-4 h-4 text-[#E5A914] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Email Enquiries</strong>
                  <p className="text-neutral-400 mt-0.5">concierge@4lazyfashion.com</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-neutral-300">
                <Phone className="w-4 h-4 text-[#E5A914] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Direct WhatsApp & Phone</strong>
                  <p className="text-neutral-400 mt-0.5">+91 80004 52999</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-neutral-300">
                <MapPin className="w-4 h-4 text-[#E5A914] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Design Studio HQ</strong>
                  <p className="text-neutral-400 mt-0.5">Linking Road, Bandra West, Mumbai 400050, India</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 text-[11px] text-neutral-400">
              <p className="font-bold text-white mb-1 uppercase">For Live Order Inquiries:</p>
              <p>Please include your 4L order reference (e.g. 4L-2026-XXXX) for expedited priority assistance.</p>
            </div>
          </div>

          <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6 sm:p-8 space-y-4">
            <h3 className="font-display text-base font-bold text-white uppercase tracking-wider">
              Send a Direct Message
            </h3>
            {contactSent ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs rounded space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Message Dispatched
                </div>
                <p>Thank you. A 4 LAZY concierge specialist will respond within 24 business hours.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Your Name</label>
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">Message</label>
                  <textarea
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="How may our studio concierge assist you today?"
                    className="w-full bg-neutral-950 border border-neutral-800 px-3 py-2 text-xs text-white rounded"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#E5A914] text-black font-extrabold py-3 rounded text-xs uppercase tracking-widest hover:bg-[#d49b10] transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Shipping & Returns Policy
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[#E5A914]">
          STORE POLICIES
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
          {page === 'privacy-policy' ? 'Privacy Policy' : page === 'terms' ? 'Terms & Conditions' : 'Shipping, Exchange & Returns'}
        </h1>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-8 space-y-6 text-xs text-neutral-300 leading-relaxed">
        {page === 'shipping-returns' ? (
          <>
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-white uppercase">1. Complimentary Shipping Threshold</h3>
              <p>
                All orders with a subtotal exceeding <strong>₹1,999</strong> receive complimentary Express Shipping across all serviceable PIN codes in India. For orders below this threshold, a flat delivery fee of <strong>₹99</strong> is applied.
              </p>
            </div>
            <div className="space-y-2 border-t border-neutral-800 pt-4">
              <h3 className="font-bold text-sm text-white uppercase">2. Dispatch & Transit Durations</h3>
              <p>
                Orders are hand-inspected, packaged in biodegradable custom boxes, and dispatched within 24 hours of payment verification. Standard delivery takes 3–5 business days, while Express Air priority takes 24–48 hours in metro locations.
              </p>
            </div>
            <div className="space-y-2 border-t border-neutral-800 pt-4">
              <h3 className="font-bold text-sm text-white uppercase">3. 7-Day Exchange Window</h3>
              <p>
                We offer a hassle-free 7-day exchange window for sizing adjustments. Garments must be in unwashed, unworn condition with original tags intact.
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p>
              4 LAZY collects only necessary customer information required to process and dispatch orders securely, calculate state-specific tax rates, and provide real-time shipment updates.
            </p>
            <p>
              We do not store raw credit/debit card numbers. All electronic payment transactions are encrypted and tokenized through certified gateway partners (Razorpay / Stripe) in compliance with PCI-DSS standards.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
