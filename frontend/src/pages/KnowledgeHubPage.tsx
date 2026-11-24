import { tr, useLocale } from '../i18n';

import React from 'react';
import { Link } from 'react-router-dom';
import { CROPS_DATA } from '../data/crops';
import { SOILS_DATA } from '../data/soils';

const images = {
  hero: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=2000&q=85',
  crops: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1200&q=85',
  soils: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=85',
};

export const KnowledgeHubPage: React.FC = () => {
  useLocale();
  return (
    <div className="space-y-10 pb-8 sm:space-y-14">
      {/* HERO */}
      <section className="relative isolate min-h-[390px] overflow-hidden rounded-[26px] bg-[#1C3C29] sm:min-h-[470px] lg:min-h-[520px]">
        <img
          src={images.hero}
          alt={tr("Agricultural fields in warm sunlight")}
          className="absolute inset-0 h-full w-full object-cover"
          {...{ fetchpriority: 'high' }}
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#10291D]/90 via-[#10291D]/55 to-[#10291D]/10" />

        <div className="relative flex min-h-[390px] flex-col justify-end px-7 py-10 sm:min-h-[470px] sm:px-12 sm:py-14 lg:min-h-[520px] lg:px-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#D4E5B8]">{tr("ProFarm / Knowledge")}</span>

          <h1 className="mt-5 max-w-[700px] font-serif text-[clamp(3.2rem,7vw,6.5rem)] leading-[0.98] tracking-[-0.055em] text-white">{tr("Learn the land.")}<span className="block italic text-[#D4E5B8]">{tr("Grow better.")}</span>
          </h1>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/knowledge/crops"
              className="group inline-flex items-center gap-5 rounded-full bg-[#F8F7F2] px-6 py-3.5 text-[12px] font-bold text-[#244B35] transition-all duration-300 hover:-translate-y-1 hover:bg-white"
            >{tr("Explore Crops")}<span
                aria-hidden="true"
                className="text-lg transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </Link>

            <Link
              to="/knowledge/soils"
              className="group inline-flex items-center gap-5 rounded-full border border-white/50 bg-white/10 px-6 py-3.5 text-[12px] font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white/20"
            >{tr("Explore Soils")}<span
                aria-hidden="true"
                className="text-lg transition-transform group-hover:translate-x-1"
              >
                ↗
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CATALOGS */}
      <section aria-labelledby="explore-heading">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#829475]">{tr("Discover")}</span>

            <h2
              id="explore-heading"
              className="mt-2 font-serif text-[clamp(2.3rem,4vw,3.7rem)] leading-tight tracking-[-0.05em] text-[#203F2C]"
            >{tr("Explore Nature")}<span className="text-[#9AB28A]">.</span>
            </h2>
          </div>

          <span className="text-[12px] font-semibold text-[#83917D]">
            {CROPS_DATA.length} {tr("Crops ·")} {SOILS_DATA.length}{tr("Soils")}</span>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* CROPS */}
          <Link
            to="/knowledge/crops"
            className="group relative isolate flex min-h-[390px] flex-col justify-end overflow-hidden rounded-[24px] bg-[#344B2E] p-7 sm:min-h-[470px] sm:p-10"
          >
            <img
              src={images.crops}
              alt={tr("Crops growing in an agricultural field")}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#10251A]/90 via-[#10251A]/20 to-transparent" />

            <div className="relative">
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 text-[11px] font-bold text-white backdrop-blur-md">
                {CROPS_DATA.length}{tr("Varieties")}</span>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-none tracking-[-0.05em] text-white">{tr("Crops")}</h3>

                  <p className="mt-3 text-[12px] font-medium text-white/75">{tr("Seasons · Growing · Care")}</p>
                </div>

                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/15 text-2xl text-white backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:bg-white group-hover:text-[#244B35]"
                >
                  ↗
                </span>
              </div>
            </div>
          </Link>

          {/* SOILS */}
          <Link
            to="/knowledge/soils"
            className="group relative isolate flex min-h-[390px] flex-col justify-end overflow-hidden rounded-[24px] bg-[#46543A] p-7 sm:min-h-[470px] sm:p-10"
          >
            <img
              src={images.soils}
              alt={tr("Young plants growing in fertile soil")}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#10251A]/90 via-[#10251A]/20 to-transparent" />

            <div className="relative">
              <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-2 text-[11px] font-bold text-white backdrop-blur-md">
                {SOILS_DATA.length}{tr("Soil Types")}</span>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[clamp(2.8rem,5vw,4.5rem)] leading-none tracking-[-0.05em] text-white">{tr("Soils")}</h3>

                  <p className="mt-3 text-[12px] font-medium text-white/75">{tr("Texture · Health · Nutrition")}</p>
                </div>

                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/15 text-2xl text-white backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:bg-white group-hover:text-[#244B35]"
                >
                  ↗
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* COMPACT ADVISORY */}
      <aside className="flex items-start gap-4 rounded-[18px] border border-[#E1E7DB] bg-[#EDF1E8] px-5 py-5 sm:items-center sm:px-7">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#537451]"
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
        </span>

        <p className="text-[12px] leading-[1.8] text-[#63745F]">{tr("General agricultural guidance only. Consult your local")}{' '}
          <strong className="font-bold text-[#244B35]">{tr("Krishi Vigyan Kendra (KVK)")}</strong>{' '}{tr("for farm-specific recommendations.")}</p>
      </aside>
    </div>
  );
};
