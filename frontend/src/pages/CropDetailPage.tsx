import { tr, useLocale } from '../i18n';
import { LocalizedContent } from '../i18n/LocalizedContent';

import { cropImage, photoFocus } from '../data/media';
import { ReadAloud } from '../components/ReadAloud';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCropBySlug } from '../data/crops';
import { getSoilById } from '../data/soils';

type AccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const Accordion: React.FC<AccordionProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#DCE7DE] bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-start transition hover:bg-[#F4F9F4] sm:px-7"
      >
        <span className="font-serif text-xl tracking-[-0.025em] text-[#234346] sm:text-2xl">
          {tr(title)}
        </span>

        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2E9] text-xl text-[#305757] transition-transform duration-300 ${
            open ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      {open && (
        <div className="border-t border-[#E9F0EA] px-5 py-5 text-sm leading-7 text-[#5D7269] sm:px-7">
          {children}
        </div>
      )}
    </div>
  );
};

const DetailLabel: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <span className="text-xs font-bold tracking-normal text-[#809B89]">
    {children}
  </span>
);

export const CropDetailPage: React.FC = () => {
  useLocale();
  const { slug } = useParams<{ slug: string }>();
  const crop = slug ? getCropBySlug(slug) : undefined;

  if (!crop) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-[26px] border border-[#DAE6DC] bg-white px-8 py-16 text-center">

        <h1 className="mt-4 font-serif text-4xl text-[#1F3D40]">{tr("Crop not found.")}</h1>

        <p className="mt-3 text-sm text-[#768A80]">{tr("This crop is not in our catalog.")}</p>

        <Link
          to="/knowledge/crops"
          className="mt-7 inline-flex rounded-full bg-[#22484D] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#325D5F]"
        >{tr("Back to Crops")}</Link>
      </div>
    );
  }

  const suitableSoils = crop.suitableSoilIds
    .map((soilId) => getSoilById(soilId))
    .filter((soil): soil is NonNullable<typeof soil> => Boolean(soil));

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 sm:space-y-10">
      {/* BREADCRUMB */}
      <nav
        aria-label={tr("Breadcrumb")}
        className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#85988D]"
      >
        <Link to="/" className="hover:text-[#22484D]">{tr("Home")}</Link>
        <span>/</span>

        <Link
          to="/knowledge"
          className="hover:text-[#22484D]"
        >{tr("Knowledge")}</Link>
        <span>/</span>

        <Link
          to="/knowledge/crops"
          className="hover:text-[#22484D]"
        >{tr("Crops")}</Link>
        <span>/</span>

        <span className="font-bold text-[#22484D]">
          {tr(crop.name)}
        </span>
      </nav>

      {/* HERO */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#224447]">
        {cropImage(crop.slug) && (
          <img
            src={cropImage(crop.slug)!.src}
            style={{ objectPosition: photoFocus(cropImage(crop.slug)!.src) }}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#072B2E] via-[#072B2E]/70 to-[#072B2E]/20" />

        <div className="relative flex min-h-[350px] flex-col justify-between gap-12 p-7 sm:min-h-[410px] sm:p-12 lg:p-14">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold tracking-normal text-white backdrop-blur-sm">
              {tr(crop.category)}
            </span>

            <Link
              to="/knowledge/crops"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              <span aria-hidden="true">←</span>{tr("All Crops")}</Link>
          </div>

          <div>

            <h1 className="mt-4 font-serif text-[clamp(4rem,10vw,8rem)] leading-[0.95] tracking-tight text-white">
              {tr(crop.name)}
              
            </h1>
            <ReadAloud
              className="mt-5"
              text={[tr(crop.name), tr(crop.shortDescription), `${tr('Sowing')}: ${tr(crop.sowingAndHarvest.sowingPeriod)}`, `${tr('Harvest')}: ${tr(crop.sowingAndHarvest.harvestPeriod)}`].join('. ')}
            />

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
              {crop.hindiName && (
                <span>{crop.hindiName}</span>
              )}

              <span className="italic">
                {crop.scientificName}
              </span>
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {crop.seasons.map((season) => (
                <span
                  key={season}
                  className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[13px] font-semibold text-white"
                >
                  {tr(season)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start">
        <div>
          <DetailLabel>{tr("Overview")}</DetailLabel>

          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#1F3D40] sm:text-4xl">{tr("At a glance.")}</h2>
        </div>

        <p className="max-w-2xl text-sm leading-8 text-[#61776C] sm:text-base">
          {<LocalizedContent text={crop.shortDescription} />}
        </p>
      </section>

      {/* KEY METRICS */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[#DCE7DE] bg-white p-6">
          <DetailLabel>{tr("Temperature")}</DetailLabel>

          <p className="mt-5 font-serif text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight text-[#234346]">
            {crop.temperatureRange.minC}–
            {crop.temperatureRange.maxC}
            <span className="text-2xl">°C</span>
          </p>

          <p className="mt-3 text-xs leading-6 text-[#7B9185]">
            {<LocalizedContent text={crop.temperatureRange.description} />}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#DCE7DE] bg-white p-6">
          <DetailLabel>{tr("Water Demand")}</DetailLabel>

          <p className="mt-5 font-serif text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight text-[#234346]">
            {tr(crop.waterRequirement.level)}
          </p>

          {crop.waterRequirement.annualMm && (
            <p className="mt-2 text-xs font-semibold text-[#5D846F]">
              {crop.waterRequirement.annualMm}
            </p>
          )}

          <p className="mt-3 text-xs leading-6 text-[#7B9185]">
            {<LocalizedContent text={crop.waterRequirement.description} />}
          </p>
        </div>

        <div className="rounded-[22px] border border-[#DCE7DE] bg-white p-6">
          <DetailLabel>{tr("Growing Seasons")}</DetailLabel>

          <p className="mt-5 font-serif text-[clamp(2rem,3vw,3rem)] leading-tight tracking-tight text-[#234346]">
            {crop.seasons.length}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {crop.seasons.map((season) => (
              <span
                key={season}
                className="rounded-full bg-[#E8F2E9] px-3 py-1.5 text-xs font-bold text-[#507764]"
              >
                {tr(season)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* GROWING CALENDAR */}
      <section className="rounded-[24px] border border-[#DCE7DE] bg-[#E9F3EA] p-6 sm:p-8">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <DetailLabel>{tr("Crop Calendar")}</DetailLabel>

            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#1F3D40]">{tr("From seed to harvest.")}</h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[18px] bg-white p-5 sm:p-6">
            <DetailLabel>{tr("Sowing Period")}</DetailLabel>

            <p className="mt-3 font-serif text-xl leading-snug text-[#234346] sm:text-2xl">
              {tr(crop.sowingAndHarvest.sowingPeriod)}
            </p>
          </div>

          <div className="rounded-[18px] bg-white p-5 sm:p-6">
            <DetailLabel>{tr("Harvest Period")}</DetailLabel>

            <p className="mt-3 font-serif text-xl leading-snug text-[#234346] sm:text-2xl">
              {tr(crop.sowingAndHarvest.harvestPeriod)}
            </p>
          </div>
        </div>

        {crop.sowingAndHarvest.germinationDays && (
          <div className="mt-4 text-xs font-medium text-[#5C786B]">{tr("Germination:")}{tr(crop.sowingAndHarvest.germinationDays)}
          </div>
        )}
      </section>

      {/* SUITABLE SOILS */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <DetailLabel>{tr("Soil Compatibility")}</DetailLabel>

            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#1F3D40] sm:text-4xl">{tr("Suitable Soils.")}</h2>
          </div>

          <Link
            to="/knowledge/soils"
            className="text-xs font-bold text-[#407067] hover:underline"
          >{tr("Explore all soils ↗")}</Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {suitableSoils.map((soil) => (
            <Link
              key={soil.id}
              to={`/knowledge/soils/${soil.slug}`}
              className="group flex items-center justify-between gap-4 rounded-[18px] border border-[#DCE7DE] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[#9EC2AD] hover:shadow-sm"
            >
              <div className="min-w-0">
                <h3 className="font-serif text-xl text-[#234346]">
                  {tr(soil.name)}
                </h3>

                <p className="mt-1 text-[13px] text-[#7D9386]">{tr("Drainage:")}{tr(soil.drainage)}
                </p>
              </div>

              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2E9] text-[#305757] transition group-hover:bg-[#22484D] group-hover:text-white"
              >
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FARMING GUIDANCE */}
      <section className="space-y-5">
        <div>
          <DetailLabel>{tr("Field Guide")}</DetailLabel>

          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#1F3D40] sm:text-4xl">{tr("Grow with confidence.")}</h2>
        </div>

        <div className="space-y-3">
          <Accordion title={tr("Soil Preparation")} defaultOpen>
            <p>{<LocalizedContent text={crop.soilPreparation} />}</p>
          </Accordion>

          <Accordion title={tr("Irrigation Management")}>
            <p>{<LocalizedContent text={crop.irrigationGuidance} />}</p>
          </Accordion>

          <Accordion title={tr("Sustainable Practices")}>
            <ul className="space-y-3">
              {crop.sustainablePractices.map((practice, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1 font-bold text-[#4B7E69]"
                  >
                    ✓
                  </span>

                  <span><LocalizedContent text={practice} /></span>
                </li>
              ))}
            </ul>
          </Accordion>

          <Accordion title={tr("Common Challenges")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {crop.commonChallenges.map((challenge, index) => (
                <div
                  key={index}
                  className="rounded-[14px] border border-[#E7E5DA] bg-[#F3F6F5] p-4"
                >
                  <p className="text-xs leading-6 text-[#716F60]">
                    <LocalizedContent text={challenge} />
                  </p>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title={tr("Research & Sources")}>
            <ul className="space-y-3">
              {crop.sources.map((source, index) => (
                <li key={index}>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#407067] underline-offset-4 hover:underline"
                    >
                      {source.name} ↗
                    </a>
                  ) : (
                    <span className="font-semibold text-[#234346]">
                      {source.name}
                    </span>
                  )}

                  {source.organization && (
                    <span className="ms-2 text-[#7D9386]">
                      — {source.organization}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Accordion>
        </div>
      </section>

      {/* ADVISORY */}
      <aside className="rounded-[18px] border border-[#DCE7DE] bg-[#E9F3EA] px-5 py-5 sm:px-7">
        <p className="text-xs leading-7 text-[#617B6D]">
          <strong className="text-[#234346]">{tr("Agricultural Advisory:")}</strong>{' '}{tr("Growing conditions vary by region. Consult your local Krishi Vigyan Kendra (KVK) or State Agricultural University for farm-specific recommendations.")}</p>
      </aside>

      {/* BACK NAVIGATION */}
      <div className="flex justify-center pt-2">
        <Link
          to="/knowledge/crops"
          className="inline-flex items-center gap-3 rounded-full border border-[#C4DACD] px-6 py-3 text-xs font-bold text-[#22484D] transition hover:bg-[#E5F0E7]"
        >{tr("← Back to Crop Library")}</Link>
      </div>
    </div>
  );
};
