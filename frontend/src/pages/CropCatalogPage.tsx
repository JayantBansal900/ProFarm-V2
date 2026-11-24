import { tr, useLocale, localizedMatches } from '../i18n';

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CROPS_DATA } from '../data/crops';
import { SOILS_DATA } from '../data/soils';
import type { GrowingSeason, CropCategory } from '../types/agriculture';

const imageFiles: Record<string, string> = {
  wheat: 'wheat.jpg',
  rice: 'rice.jpg',
  maize: 'maize.jpg',
  cotton: 'cotton.jpg',
  sugarcane: 'sugarcane.jpg',
  potato: 'potato.jpg',
  soybean: 'soybean.jpg',
  groundnut: 'groundnut.jpg',
  mustard: 'mustard.jpg',
};

const cropImage = (slug: string): string | null => {
  const filename = imageFiles[slug.toLowerCase()];
  return filename ? `/images/crops/${filename}` : null;
};

const inputClass =
  'w-full min-w-0 rounded-xl border border-[#E0E6DA] bg-[#F8F9F5] px-4 py-3 text-[12px] font-medium text-[#284633] outline-none transition focus:border-[#7F9D75] focus:ring-2 focus:ring-[#7F9D75]/20';

type CropImageProps = {
  slug: string;
  name: string;
  icon: string;
};

const CropImage: React.FC<CropImageProps> = ({
  slug,
  name,
  icon,
}) => {
  const [failed, setFailed] = useState(false);
  const image = cropImage(slug);

  return (
    <div className="relative h-[220px] overflow-hidden bg-[#E4EADB] sm:h-[250px]">
      {image && !failed ? (
        <img
          src={image}
          alt={tr("{{v0}} crop", { v0: name })}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={tr("{{v0}} illustration", { v0: name })}
          className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E7EEDC] via-[#D7E3CC] to-[#AFC7A3]"
        >
          <span aria-hidden="true" className="text-7xl">
            {icon}
          </span>
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#142C1D]/35 via-transparent to-transparent" />

      <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-[#244B35] transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
        ↗
      </span>
    </div>
  );
};

export const CropCatalogPage: React.FC = () => {
  useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [selectedSoilId, setSelectedSoilId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCrops = useMemo(() => {
    const query = searchQuery.trim();

    return CROPS_DATA.filter((crop) => {
      const matchesSearch =
        localizedMatches(query, crop.name, crop.hindiName, crop.scientificName, crop.shortDescription);

      const matchesSeason =
        selectedSeason === 'all' ||
        crop.seasons.includes(selectedSeason as GrowingSeason);

      const matchesSoil =
        selectedSoilId === 'all' ||
        crop.suitableSoilIds.includes(selectedSoilId);

      const matchesCategory =
        selectedCategory === 'all' ||
        crop.category === (selectedCategory as CropCategory);

      return (
        matchesSearch &&
        matchesSeason &&
        matchesSoil &&
        matchesCategory
      );
    });
  }, [
    searchQuery,
    selectedSeason,
    selectedSoilId,
    selectedCategory,
  ]);

  const hasFilters =
    searchQuery.trim() !== '' ||
    selectedSeason !== 'all' ||
    selectedSoilId !== 'all' ||
    selectedCategory !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSeason('all');
    setSelectedSoilId('all');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-8 pb-8 sm:space-y-10">
      {/* BREADCRUMB */}
      <nav
        aria-label={tr("Breadcrumb")}
        className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#8B9786]"
      >
        <Link to="/" className="hover:text-[#244B35]">{tr("Home")}</Link>
        <span>/</span>
        <Link
          to="/knowledge"
          className="hover:text-[#244B35]"
        >{tr("Knowledge")}</Link>
        <span>/</span>
        <span className="font-bold text-[#244B35]">{tr("Crops")}</span>
      </nav>

      {/* HEADER */}
      <section className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#849579]">{tr("Crop Library")}</span>

          <h1 className="mt-2 font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[1.05] tracking-[-0.055em] text-[#203F2C]">{tr("Explore Crops")}<span className="text-[#9BB18C]">.</span>
          </h1>
        </div>

        <Link
          to="/knowledge/soils"
          className="inline-flex items-center gap-3 rounded-full border border-[#D4E0CE] px-5 py-3 text-[12px] font-bold text-[#244B35] transition hover:bg-[#EAF0E5]"
        >{tr("Explore Soils")}<span aria-hidden="true">↗</span>
        </Link>
      </section>

      {/* FILTERS */}
      <section
        aria-label={tr("Crop filters")}
        className="rounded-[22px] border border-[#E0E6DA] bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label
              htmlFor="crop-search"
              className="sr-only"
            >{tr("Search crops")}</label>

            <input
              id="crop-search"
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder={tr("Search crops...")}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="season-filter"
              className="sr-only"
            >{tr("Growing season")}</label>

            <select
              id="season-filter"
              value={selectedSeason}
              onChange={(event) =>
                setSelectedSeason(event.target.value)
              }
              className={inputClass}
            >
              <option value="all">{tr("All Seasons")}</option>
              <option value="Kharif">{tr("Kharif")}</option>
              <option value="Rabi">{tr("Rabi")}</option>
              <option value="Zaid">{tr("Zaid")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="soil-filter"
              className="sr-only"
            >{tr("Soil type")}</label>

            <select
              id="soil-filter"
              value={selectedSoilId}
              onChange={(event) =>
                setSelectedSoilId(event.target.value)
              }
              className={inputClass}
            >
              <option value="all">{tr("All Soils")}</option>

              {SOILS_DATA.map((soil) => (
                <option
                  key={soil.id}
                  value={soil.id}
                >
                  {tr(soil.name)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="category-filter"
              className="sr-only"
            >{tr("Crop category")}</label>

            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
              className={inputClass}
            >
              <option value="all">{tr("All Categories")}</option>
              <option value="Cereal & Grain">{tr("Cereals & Grains")}</option>
              <option value="Pulse & Legume">{tr("Pulses & Legumes")}</option>
              <option value="Oilseed">{tr("Oilseeds")}</option>
              <option value="Fiber">{tr("Fiber")}</option>
              <option value="Commercial & Cash">{tr("Cash Crops")}</option>
              <option value="Tuber & Root">{tr("Roots & Tubers")}</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EDF0E9] pt-4">
          <span
            aria-live="polite"
            className="text-[12px] font-medium text-[#788775]"
          >
            <strong className="text-[#244B35]">
              {filteredCrops.length}
            </strong>{' '}{tr('of {{count}} crops', { count: CROPS_DATA.length })}</span>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] font-bold text-[#426E47] hover:underline"
            >{tr("Clear filters ×")}</button>
          )}
        </div>
      </section>

      {/* CROP CARDS */}
      {filteredCrops.length > 0 ? (
        <section
          aria-label={tr("Crop catalog")}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredCrops.map((crop) => (
            <Link
              key={crop.id}
              to={`/knowledge/crops/${crop.slug}`}
              className="group overflow-hidden rounded-[22px] border border-[#E0E6DA] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#B9CDAF] hover:shadow-[0_18px_40px_rgba(26,58,39,0.08)]"
            >
              <div className="relative">
                <CropImage
                  key={crop.slug}
                  slug={crop.slug}
                  name={crop.name}
                  icon={crop.icon}
                />

                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-[#244B35]">
                  {tr(crop.category)}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-serif text-[32px] leading-tight tracking-[-0.04em] text-[#203F2C]">
                      {tr(crop.name)}
                    </h2>

                    <p className="mt-1 text-[12px] text-[#8B9786]">
                      {crop.hindiName || crop.scientificName}
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="text-2xl"
                  >
                    {crop.icon}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {crop.seasons.map((season) => (
                    <span
                      key={season}
                      className="rounded-full bg-[#EEF2E8] px-3 py-1.5 text-[10px] font-bold text-[#587651]"
                    >
                      {tr(season)}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#EDF0E9] pt-4 text-[11px] text-[#758273]">
                  <span>
                    <strong className="text-[#244B35]">
                      {crop.temperatureRange.minC}–
                      {crop.temperatureRange.maxC}°C
                    </strong>
                  </span>

                  <span>{tr("Water:")}{' '}
                    <strong className="text-[#244B35]">
                      {tr(crop.waterRequirement.level)}
                    </strong>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <div className="rounded-[22px] border border-dashed border-[#CAD8C3] bg-white px-6 py-16 text-center">
          <span
            aria-hidden="true"
            className="text-4xl"
          >
            🌱
          </span>

          <h2 className="mt-4 font-serif text-[30px] text-[#203F2C]">{tr("No crops found")}</h2>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-5 rounded-full bg-[#244B35] px-6 py-3 text-[12px] font-bold text-white hover:bg-[#345D42]"
          >{tr("Reset filters")}</button>
        </div>
      )}
    </div>
  );
};
