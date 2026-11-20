import React, { useState, useEffect } from 'react';
import { CheckCircle2, Smartphone, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { OtpInput } from './OtpInput.tsx';
import type { ConfirmationResult } from '../firebase.ts';

interface InlinePhoneOtpVerifierProps {
  phone: string;
  purpose: 'checkout' | 'verify-phone';
  isVerified: boolean;
  required?: boolean;
  onVerified: (result: { mobile?: string }) => void;
}

export const InlinePhoneOtpVerifier: React.FC<InlinePhoneOtpVerifierProps> = ({
  phone,
  purpose,
  isVerified,
  required = false,
  onVerified
}) => {
  const { sendFirebasePhoneOtp, linkVerifiedFirebasePhone } = useAuth();
  const recaptchaId = `firebase-inline-recaptcha-${purpose}`;

  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [maskedMobile, setMaskedMobile] = useState('');
  const [normalizedMobile, setNormalizedMobile] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => {
      setCooldown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  // Reset inline verifier if the user changes their phone number
  useEffect(() => {
    setOtpOpen(false);
    setOtp('');
    setConfirmationResult(null);
    setError('');
  }, [phone]);

  if (isVerified) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium pt-1">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Mobile verified via Firebase OTP</span>
      </div>
    );
  }

  const handleSend = async () => {
    setSending(true);
    setError('');
    const res = await sendFirebasePhoneOtp(phone, recaptchaId);
    setSending(false);
    if (!res.success || !res.confirmationResult) {
      setError(res.error || 'Could not send Firebase OTP.');
      return;
    }
    setConfirmationResult(res.confirmationResult);
    setOtpOpen(true);
    setOtp('');
    setMaskedMobile(res.maskedMobile || phone);
    setNormalizedMobile(res.e164Phone || phone);
    setCooldown(30);
  };

  const handleVerify = async () => {
    if (!confirmationResult) {
      setError('OTP session expired. Please request a fresh code.');
      return;
    }
    setVerifying(true);
    setError('');
    const res = await linkVerifiedFirebasePhone(confirmationResult, otp);
    setVerifying(false);
    if (!res.success) {
      setError(res.error || 'Invalid Firebase OTP.');
      return;
    }
    setOtpOpen(false);
    setOtp('');
    setConfirmationResult(null);
    onVerified({
      mobile: normalizedMobile || phone
    });
  };

  return (
    <div className="pt-2 space-y-2.5">
      <div id={recaptchaId} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-[#E5A914]" />
          {required
            ? 'Firebase Mobile OTP verification is required to proceed.'
            : 'Optional: Verify your mobile via Firebase OTP for faster delivery updates.'}
        </span>
        {!otpOpen && (
          <button
            type="button"
            disabled={sending || phone.replace(/\D/g, '').length < 10}
            onClick={handleSend}
            className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-[#E5A914] transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {sending ? 'Sending...' : 'Verify via Firebase OTP'}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-red-400">
          {error}
        </p>
      )}

      {otpOpen && (
        <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-300 font-medium">
              Enter 6-digit Firebase OTP sent to <span className="font-mono text-white">{maskedMobile}</span>
            </span>
            <button
              type="button"
              onClick={() => setOtpOpen(false)}
              className="text-neutral-500 hover:text-white text-[11px]"
            >
              Cancel
            </button>
          </div>

          <OtpInput
            length={6}
            value={otp}
            onChange={setOtp}
            disabled={verifying}
            idPrefix={`inline-${purpose}-otp`}
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            {cooldown > 0 ? (
              <span className="text-[11px] text-neutral-500 tabular-nums">Resend in {cooldown}s</span>
            ) : (
              <button
                type="button"
                disabled={sending}
                onClick={handleSend}
                className="text-[11px] text-neutral-300 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Resend OTP
              </button>
            )}

            <button
              type="button"
              disabled={verifying || otp.length < 6}
              onClick={handleVerify}
              className="px-4 py-2 rounded bg-[#E5A914] hover:bg-[#d49b10] text-black text-xs font-extrabold uppercase tracking-wider disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Confirm OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
