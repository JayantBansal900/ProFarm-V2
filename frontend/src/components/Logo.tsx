import React, { useId } from 'react';

/**
 * ProFarm mark: a capital P whose bowl is a leaf, above two golden field furrows.
 * Source artwork lives in public/brand/profarm-icon.svg; keep the two in sync.
 */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 40, className }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1E8E53" />
          <stop offset="1" stopColor="#0B4D2E" />
        </linearGradient>
      </defs>

      <rect width="120" height="120" rx="28" fill={`url(#${id}-bg)`} />
      {/* Stem of the P */}
      <rect x="34" y="26" width="14" height="70" rx="7" fill="#FFFFFF" />
      {/* Leaf forming the bowl of the P, with its midrib */}
      <path d="M48 27 C76 22 92 40 86 58 C81 72 64 74 48 68 Z" fill="#FFFFFF" />
      <path d="M51 64 C62 58 72 48 80 36" stroke="#147A45" strokeWidth="4" strokeLinecap="round" />
      {/* Field furrows */}
      <path d="M56 84 C68 79 80 79 92 84" stroke="#F4B41A" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 95 C70 91 80 91 90 95" stroke="#F4B41A" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
};

// The brand name is never translated, so it lives in constants rather than JSX text.
const BRAND_FIRST = 'Pro';
const BRAND_SECOND = 'Farm';

/** "ProFarm" set in the heading face: a heavy first half, a lighter second half. */
export const Wordmark: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span className={`font-display leading-none tracking-tight ${className}`}>
    <span className="font-extrabold">{BRAND_FIRST}</span>
    <span className="font-semibold">{BRAND_SECOND}</span>
  </span>
);
