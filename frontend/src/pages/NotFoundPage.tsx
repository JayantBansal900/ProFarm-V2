import { tr, useLocale } from '../i18n';

import React from 'react';
import { Link } from 'react-router-dom';

const ArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

const HomeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z" />
    <path d="M9 21v-8h6v8" />
  </svg>
);

const LeafIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 4c-8 0-15 3-15 11a5 5 0 0 0 5 5c8 0 11-7 10-16Z" />
    <path d="M5 20c3-6 7-9 12-12" />
  </svg>
);

export const NotFoundPage: React.FC = () => {
  useLocale();
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-[#F7F9F2]">
      {/* Soft background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#E5EEDB]/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#E4EDDF]/60 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[650px] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        {/* Small section label */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D8E6D1] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#51785A]">
          <LeafIcon />{tr("A Little Detour")}</div>

        {/* Large 404 typography */}
        <div className="relative">
          <span className="block select-none font-serif text-[120px] font-semibold leading-none tracking-[-0.09em] text-[#235438] sm:text-[170px] md:text-[205px]">
            404
          </span>

          <div
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-full bg-[#B5CFA7]/30 blur-xl"
          />
        </div>

        {/* Message */}
        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight text-[#1C422D] sm:text-4xl">{tr("Looks like you've wandered")}<br className="hidden sm:block" />
          {' '}{tr("off the path.")}</h1>

        <p className="mt-5 max-w-md text-sm leading-7 text-[#728775] sm:text-base">{tr("The page you're looking for doesn't exist or may have moved. Don't worry, there's plenty more to explore at ProFarm.")}</p>

        {/* Actions */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#285D3D] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(40,93,61,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#19482E] hover:shadow-[0_12px_24px_rgba(40,93,61,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#285D3D]"
          >
            <HomeIcon />{tr("Back to Home")}<ArrowIcon />
          </Link>

          <Link
            to="/knowledge"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D5E2D1] bg-white px-6 py-3 text-sm font-bold text-[#285D3D] transition duration-200 hover:-translate-y-0.5 hover:border-[#A9C6A9] hover:bg-[#F0F5EC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#285D3D]"
          >{tr("Explore Knowledge")}</Link>
        </div>

        {/* Bottom detail */}
        <div className="mt-16 flex items-center gap-3 text-xs text-[#90A391]">
          <span className="h-px w-10 bg-[#CCDCC7]" />{tr("Growing knowledge, one step at a time")}<span className="h-px w-10 bg-[#CCDCC7]" />
        </div>
      </div>
    </div>
  );
};
