import React, { useRef } from 'react';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  idPrefix?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
  idPrefix = 'otp-digit'
}) => {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length }, (_, idx) => value[idx] || '');

  const focusBox = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    inputRefs.current[clamped]?.focus();
    inputRefs.current[clamped]?.select();
  };

  const handleChange = (index: number, raw: string) => {
    const clean = raw.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      onChange(next.join(''));
      return;
    }

    // Handle multi-digit paste or SMS autofill into a single box
    if (clean.length > 1) {
      const pasted = clean.slice(0, length);
      onChange(pasted);
      focusBox(Math.min(pasted.length, length - 1));
      return;
    }

    const next = [...digits];
    next[index] = clean;
    onChange(next.join(''));
    if (index < length - 1) {
      focusBox(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        e.preventDefault();
        const next = [...digits];
        next[index - 1] = '';
        onChange(next.join(''));
        focusBox(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focusBox(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    onChange(pasted);
    focusBox(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label={`${length}-digit OTP verification code`}
    >
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={el => {
            inputRefs.current[idx] = el;
          }}
          id={`${idPrefix}-${idx}`}
          type="text"
          inputMode="numeric"
          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && idx === 0}
          aria-label={`OTP digit ${idx + 1} of ${length}`}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className="w-11 h-12 sm:w-12 sm:h-13 bg-neutral-950 border border-neutral-800 focus:border-[#E5A914] focus:ring-1 focus:ring-[#E5A914]/40 text-center text-lg sm:text-xl font-mono font-bold tabular-nums text-white rounded-lg outline-none transition-colors disabled:opacity-50"
        />
      ))}
    </div>
  );
};
