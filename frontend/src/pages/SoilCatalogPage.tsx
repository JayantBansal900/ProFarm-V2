import { LocalizedContent } from '../i18n/LocalizedContent';
import { tr, useLocale, localizedMatches } from '../i18n';

import { soilImage } from '../data/media';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SOILS_DATA } from '../data/soils';
import { getCropById } from '../data/crops';

const soilVisuals = [
  {
    background: 'from-[#76503B] via-[#A47857] to-[#D2B090]',
    surface: '#8D6145',
    pattern: 'radial-gradient(circle at 25% 30%, #D3A47D 0%, transparent 35%), radial-gradient(circle at 75% 75%, #543625 0%, transparent 45%)',
  },
  {
    background: 'from-[#A87349] via-[#CA996B] to-[#E4C6A1]',
    surface: '#BD8A5D',
    pattern: 'radial-gradient(circle at 70% 25%, #F0D1A4 0%, transparent 40%), radial-gradient(circle at 20% 80%, #92613E 0%, transparent 45%)',
  },
  {
    background: 'from-[#4D4039] via-[#746057] to-[#A18A79]',
    surface: '#67564B',
    pattern: 'radial-gradient(circle at 30% 65%, #9A8472 0%, transparent 35%), radial-gradient(circle at 80% 20%, #352D2B 0%, transparent 45%)',
  },
  {
    background: 'from-[#A34E37] via-[#C8754C] to-[#E5AC79]',
    surface: '#B55C3E',
    pattern: 'radial-gradient(circle at 25% 30%, #E8A06D 0%, transparent 35%), radial-gradient(circle at 80% 80%, #843F32 0%, transparent 45%)',
  },
  {
    background: 'from-[#70654D] via-[#9A8965] to-[#C5B28B]',
    surface: '#8A7857',
    pattern: 'radial-gradient(circle at 30% 30%, #D2C09A 0%, transparent 35%), radial-gradient(circle at 75% 75%, #594E3D 0%, transparent 45%)',
  },
  {
    background: 'from-[#564B3E] via-[#82735C] to-[#B2A185]',
    surface: '#73634F',
    pattern: 'radial-gradient(circle at 25% 70%, #B5A388 0%, transparent 40%), radial-gradient(circle at 80% 25%, #41382F 0%, transparent 40%)',
  },
];

export const SoilCatalogPage: React.FC = () => {
  useLocale();
  const [search, setSearch] = useState('');
  const visibleSoils = SOILS_DATA.filter(soil => localizedMatches(search, soil.name, soil.shortDescription));
  return (
    <div className="space-y-8 pb-10 sm:space-y-10">
      {/* BREADCRUMB */}
      <nav
        aria-label={tr("Breadcrumb")}
        className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#85988D]"
      >
        <Link
          to="/"
          className="transition hover:text-[#22484D]"
        >{tr("Home")}</Link>

        <span>/</span>

        <Link
          to="/knowledge"
          className="transition hover:text-[#22484D]"
        >{tr("Knowledge")}</Link>

        <span>/</span>

        <span className="font-bold text-[#22484D]">{tr("Soils")}</span>
      </nav>

      {/* HEADER */}
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="text-xs font-bold tracking-normal text-[#789681]">{tr("The Soil Library")}</span>

          <h1 className="mt-2 font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[1.05] tracking-tight text-[#1F3D40]">{tr("Explore Soils")}
          </h1>
        </div>

        <Link
          to="/knowledge/crops"
          className="inline-flex items-center gap-3 rounded-full border border-[#CDE1D4] px-5 py-3 text-sm font-bold text-[#22484D] transition hover:bg-[#E5F0E7]"
        >{tr("Explore Crops")}<span aria-hidden="true">↗</span>
        </Link>
      </section>

      <label className="block text-sm font-semibold">
        {tr('Search soils')}
        <input type="search" value={search} onChange={event => setSearch(event.target.value)}
          placeholder={tr('Search soils')} className="mt-2 block min-h-11 w-full rounded-xl border border-[#CDE1D4] bg-white px-4" />
      </label>
      {/* SUMMARY */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCE8DE] pb-5">
        <p className="text-sm font-medium text-[#768E80]">{tr("Discover the foundation of healthy farming.")}</p>

        <span className="rounded-full bg-[#E5F0E7] px-4 py-2 text-[13px] font-bold text-[#406C5F]">
          {tr('{{count}} Soil Types', { count: SOILS_DATA.length })}</span>
      </section>

      {/* SOIL GRID */}
      <section
        aria-label={tr("Soil catalog")}
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visibleSoils.map((soil) => {
          const index = SOILS_DATA.findIndex(candidate => candidate.id === soil.id);
          const visual = soilVisuals[index % soilVisuals.length];

          const suitableCrops = soil.suitableCropIds
            .map((cropId) => getCropById(cropId))
            .filter(
              (crop): crop is NonNullable<typeof crop> =>
                Boolean(crop)
            );

          return (
            <article
              key={soil.id}
              className="group overflow-hidden rounded-[22px] border border-[#DAE6DC] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#AECEBA] hover:shadow-[0_18px_40px_rgba(26,58,39,0.08)]"
            >
              {/* VISUAL */}
              <Link
                to={`/knowledge/soils/${soil.slug}`}
                aria-label={tr("Explore {{v0}}", { v0: soil.name })}
                className={`relative block h-[215px] overflow-hidden bg-gradient-to-br ${visual.background} sm:h-[245px]`}
              >
                {soilImage(soil.slug) && (
                  <img
                    src={soilImage(soil.slug)!.src}
                    alt={tr("{{v0}} sample", { v0: tr(soil.name) })}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />

                <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-xs font-bold text-[#22484D] backdrop-blur-sm">{tr("Soil Profile")}{String(index + 1).padStart(2, '0')}
                </span>

                <span
                  aria-hidden="true"
                  className="absolute bottom-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-xl text-[#22484D] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
                >
                  ↗
                </span>
              </Link>

              {/* CONTENT */}
              <div className="p-5 sm:p-6">
                <Link
                  to={`/knowledge/soils/${soil.slug}`}
                  className="block"
                >
                  <h2 className="font-serif text-[30px] leading-tight tracking-tight text-[#1F3D40] transition group-hover:text-[#4D7B6F]">
                    {tr(soil.name)}
                  </h2>
                </Link>

                <p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-[1.8] text-[#7C9285]">
                  {<LocalizedContent text={soil.shortDescription} />}
                </p>

                {/* SOIL METRICS */}
                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#E9F0EA] pt-5">
                  <div>
                    <span className="text-xs font-bold tracking-normal text-[#95A79C]">{tr("Drainage")}</span>

                    <p className="mt-2 text-sm font-bold text-[#305354]">
                      {tr(soil.drainage)}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold tracking-normal text-[#95A79C]">{tr("Water Retention")}</span>

                    <p className="mt-2 text-sm font-bold text-[#305354]">
                      {tr(soil.waterRetention)}
                    </p>
                  </div>
                </div>

                {/* COMPATIBLE CROPS */}
                <div className="mt-5 border-t border-[#E9F0EA] pt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold tracking-normal text-[#95A79C]">{tr("Compatible Crops")}</span>

                    <span className="text-[13px] font-bold text-[#547A68]">
                      {soil.suitableCropIds.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {suitableCrops.slice(0, 3).map((crop) => (
                      <Link
                        key={crop.id}
                        to={`/knowledge/crops/${crop.slug}`}
                        className="rounded-full bg-[#E8F2E9] px-3 py-1.5 text-xs font-semibold text-[#507764] transition hover:bg-[#D4E9DB]"
                      >
                        {tr(crop.name)}
                      </Link>
                    ))}

                    {suitableCrops.length > 3 && (
                      <span className="rounded-full bg-[#F0F5F0] px-3 py-1.5 text-xs font-semibold text-[#7C9285]">
                        +{suitableCrops.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* LINK */}
                <Link
                  to={`/knowledge/soils/${soil.slug}`}
                  className="mt-6 flex items-center justify-between border-t border-[#E9F0EA] pt-4 text-sm font-bold text-[#2F5C58] transition hover:text-[#5E9579]"
                >{tr("Explore Soil")}<span
                    aria-hidden="true"
                    className="text-lg transition-transform group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      {/* SOIL HEALTH NOTE */}
      <aside className="rounded-[22px] border border-[#D4E6D9] bg-[#E9F3EA] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-normal text-[#759581]">{tr("Soil Health")}</span>

            <h2 className="mt-2 font-serif text-2xl tracking-tight text-[#234346] sm:text-3xl">{tr("Healthy soil. Better harvests.")}</h2>

            <p className="mt-3 text-sm leading-7 text-[#678174]">{tr("Soil texture is only one factor. Organic carbon, pH, salinity and biological activity also affect crop growth. Regular soil testing helps guide better decisions.")}</p>
          </div>

          <a
            href="https://soilhealth.dac.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-[#22484D] px-5 py-3 text-[13px] font-bold text-white transition hover:bg-[#325D5F]"
          >{tr("Soil Health Card")}<span aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>
    </div>
  );
};
