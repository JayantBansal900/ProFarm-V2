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
    <div className="relative isolate overflow-hidden rounded-2xl bg-[#F2F9F2]">
      {/* Soft background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#DAEFDE]/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#DEEEE4]/60 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[650px] max-w-5xl flex-col items-center justify-center px-5 py-16 text-center sm:px-8">
        {/* Small section label */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#D0E7D8] bg-white/80 px-4 py-2 text-[13px] font-bold tracking-normal text-[#4F7A77]">
          <LeafIcon />{tr("A Little Detour")}</div>

        {/* Large 404 typography */}
        <div className="relative">
          <span className="block select-none font-serif text-[120px] font-semibold leading-none tracking-tight text-[#215156] sm:text-[170px] md:text-[205px]">
            404
          </span>

          <div
            aria-hidden="true"
            className="absolute -bottom-2 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-full bg-[#A5D1B5]/30 blur-xl"
          />
        </div>

        {/* Message */}
        <h1 className="mt-8 font-serif text-3xl font-semibold tracking-tight text-[#1A3F44] sm:text-4xl">{tr("Looks like you've wandered")}<br className="hidden sm:block" />
          {' '}{tr("off the path.")}</h1>

        <p className="mt-5 max-w-md text-sm leading-7 text-[#718884] sm:text-base">{tr("The page you're looking for doesn't exist or may have moved. Don't worry, there's plenty more to explore at ProFarm.")}</p>

        {/* Actions */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#265A5F] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_20px_rgba(40,93,61,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#17454A] hover:shadow-[0_12px_24px_rgba(40,93,61,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#265A5F]"
          >
            <HomeIcon />{tr("Back to Home")}<ArrowIcon />
          </Link>

          <Link
            to="/knowledge"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D0E3D9] bg-white px-6 py-3 text-sm font-bold text-[#265A5F] transition duration-200 hover:-translate-y-0.5 hover:border-[#A8C7BE] hover:bg-[#ECF5EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#265A5F]"
          >{tr("Explore Knowledge")}</Link>
        </div>

        {/* Bottom detail */}
        <div className="mt-16 flex items-center gap-3 text-xs text-[#8FA49F]">
          <span className="h-px w-10 bg-[#C6DDD1]" />{tr("Growing knowledge, one step at a time")}<span className="h-px w-10 bg-[#C6DDD1]" />
        </div>
      </div>
    </div>
  );
};
