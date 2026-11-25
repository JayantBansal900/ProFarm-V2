import { tr, useLocale } from '../i18n';

import React from 'react';
import { Link } from 'react-router-dom';

const exploreLinks = [
  { label: 'Home', path: '/' },
  { label: 'Knowledge Hub', path: '/knowledge' },
  { label: 'Crop Library', path: '/knowledge/crops' },
  { label: 'Soil Library', path: '/knowledge/soils' },
  { label: 'Photo credits', path: '/credits' },
];

const toolLinks = [
  { label: 'Farm Dashboard', path: '/dashboard' },
  { label: 'Weather Insights', path: '/tools/weather' },
  { label: 'Mandi Prices', path: '/tools/mandi' },
  { label: 'Crop Advisor', path: '/tools/advisor' },
  { label: 'My Farms', path: '/my-farms' },
];

export const Footer: React.FC = () => {
  useLocale();
  return (
    <footer className="mt-auto overflow-hidden bg-[#173A3E] text-[#F1F5F3]">
      {/* Main footer */}
      <div className="mx-auto w-full max-w-[1440px] px-5 pb-12 pt-16 sm:px-8 lg:px-12 lg:pb-16 lg:pt-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link
              to="/"
              aria-label={tr("ProFarm — Home")}
              className="inline-flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9BD3A4]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#DBEEDB] text-[#22484D]">
                <svg
                  width="27"
                  height="27"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 20V10"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 14C7.5 14 5 11.4 5 7c4.6 0 7 2.5 7 7Z"
                    fill="currentColor"
                    opacity="0.9"
                  />
                  <path
                    d="M12 11c0-4.4 2.4-7 7-7 0 4.4-2.5 7-7 7Z"
                    fill="currentColor"
                  />
                  <path
                    d="M5 20h14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <span className="text-[29px] font-extrabold tracking-tight">{tr("ProFarm")}<span className="text-[#8BC798]">.</span>
              </span>
            </Link>

            <p className="mt-6 max-w-[350px] text-[14px] leading-[1.9] text-[#C4D5D2]">{tr("Making sustainable agriculture more accessible through practical knowledge, thoughtful technology, and smarter farming decisions.")}</p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.05] px-4 py-2.5">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#8BC798]"
              />
              <span className="text-[13px] font-semibold tracking-normal text-[#D8ECDC]">{tr("Rooted in knowledge. Growing for tomorrow.")}</span>
            </div>
          </div>

          {/* Explore */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold tracking-normal text-[#A5CCB1]">{tr("Explore")}</h2>

            <nav aria-label={tr("Footer explore navigation")} className="mt-6">
              <ul className="space-y-4">
                {exploreLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-[13px] text-[#D2E1DA] transition-colors duration-200 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9BD3A4]"
                    >
                      {tr(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Tools */}
          <div className="lg:col-span-4">
            <h2 className="text-sm font-bold tracking-normal text-[#A5CCB1]">{tr("Farming Tools")}</h2>

            <nav aria-label={tr("Footer farming tools navigation")} className="mt-6">
              <ul className="space-y-4">
                {toolLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-[13px] text-[#D2E1DA] transition-colors duration-200 hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9BD3A4]"
                    >
                      {tr(link.label)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* Decorative divider */}
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="h-px bg-white/15" />
      </div>

      {/* Bottom footer */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-5 py-7 text-center sm:px-8 md:flex-row md:items-center md:justify-between md:text-start lg:px-12">
        <p className="text-[13px] leading-relaxed text-[#B5CAC6]">
          © {new Date().getFullYear()}{tr("ProFarm. All rights reserved.")}</p>

        <p className="text-[13px] leading-relaxed text-[#B5CAC6]">{tr("Thoughtfully built for a more sustainable agricultural future.")}</p>
      </div>
    </footer>
  );
};
