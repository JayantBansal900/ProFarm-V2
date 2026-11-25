import React, { useId } from 'react';

/**
 * ProFarm mark: the sun rising over crop rows that run to the horizon.
 * The sky warms from teal to amber, the field is two greens with lighter furrows.
 */
export const LogoMark: React.FC<{ size?: number; className?: string }> = ({ size = 40, className }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={className}>
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width="48" height="48" rx="13" />
        </clipPath>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A3B3F" />
          <stop offset="0.5" stopColor="#1B7A74" />
          <stop offset="0.8" stopColor="#F2A93B" />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.45" r="0.6">
          <stop offset="0" stopColor="#FFF1B8" />
          <stop offset="1" stopColor="#FFB81C" />
        </radialGradient>
        <linearGradient id={`${id}-field`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3FA05A" />
          <stop offset="1" stopColor="#17623A" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect width="48" height="48" fill={`url(#${id}-sky)`} />
        <circle cx="24" cy="31" r="15" fill="#FFD66B" opacity="0.18" />
        <circle cx="24" cy="31" r="9.5" fill={`url(#${id}-sun)`} />
        <path d="M-2 31.5 Q24 26.5 50 31.5 V50 H-2 Z" fill={`url(#${id}-field)`} />
        <g stroke="#B6EFB8" strokeWidth="1.6" strokeLinecap="round" opacity="0.75">
          <path d="M24 30 L-4 48" />
          <path d="M24 30 L9 48" />
          <path d="M24 30 L24 48" />
          <path d="M24 30 L39 48" />
          <path d="M24 30 L52 48" />
        </g>
      </g>
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
