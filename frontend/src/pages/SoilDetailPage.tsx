import { tr, useLocale } from '../i18n';
import { LocalizedContent } from '../i18n/LocalizedContent';

import { soilImage } from '../data/media';
import { ReadAloud } from '../components/ReadAloud';
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSoilBySlug } from '../data/soils';
import { getCropById } from '../data/crops';

type DetailSectionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

const DetailSection: React.FC<DetailSectionProps> = ({
  title,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-[20px] border border-[#D9E8DD] bg-white">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-5 px-5 py-5 text-start transition hover:bg-[#F4F9F4] sm:px-7"
      >
        <span className="font-serif text-xl tracking-[-0.025em] text-[#234346] sm:text-2xl">
          {tr(title)}
        </span>

        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F2E9] text-xl text-[#305757] transition-transform duration-300 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-[#E9F0EA] px-5 py-5 text-sm leading-7 text-[#5D7268] sm:px-7">
          {children}
        </div>
      )}
    </div>
  );
};

const Eyebrow: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <span className="text-xs font-bold tracking-normal text-[#7C9885]">
    {children}
  </span>
);

export const SoilDetailPage: React.FC = () => {
  useLocale();
  const { slug } = useParams<{ slug: string }>();
  const soil = slug ? getSoilBySlug(slug) : undefined;

  if (!soil) {
    return (
      <div className="mx-auto my-16 max-w-lg rounded-[26px] border border-[#DAE6DC] bg-white px-8 py-16 text-center">

        <h1 className="mt-4 font-serif text-4xl tracking-tight text-[#1F3D40]">{tr("Soil not found.")}</h1>

        <p className="mt-3 text-sm text-[#768A80]">{tr("This soil profile is not available in our catalog.")}</p>

        <Link
          to="/knowledge/soils"
          className="mt-7 inline-flex rounded-full bg-[#22484D] px-6 py-3 text-xs font-bold text-white transition hover:bg-[#325D5F]"
        >{tr("Back to Soils")}</Link>
      </div>
    );
  }

  const compatibleCrops = soil.suitableCropIds
    .map((cropId) => getCropById(cropId))
    .filter((crop): crop is NonNullable<typeof crop> => Boolean(crop));

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 sm:space-y-10">
      {/* BREADCRUMB */}
      <nav
        aria-label={tr("Breadcrumb")}
        className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#85988D]"
      >
        <Link to="/" className="hover:text-[#22484D]">{tr("Home")}</Link>

        <span>/</span>

        <Link to="/knowledge" className="hover:text-[#22484D]">{tr("Knowledge")}</Link>

        <span>/</span>

        <Link to="/knowledge/soils" className="hover:text-[#22484D]">{tr("Soils")}</Link>

        <span>/</span>

        <span className="font-bold text-[#22484D]">
          {tr(soil.name)}
        </span>
      </nav>

      {/* HERO */}
      <section className="relative isolate overflow-hidden rounded-[28px] bg-[#264548]">
        {soilImage(soil.slug) && (
          <img
            src={soilImage(soil.slug)!.src}
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
        )}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#072B2E] via-[#072B2E]/70 to-[#072B2E]/20" />

        <div className="relative flex min-h-[350px] flex-col justify-between gap-12 p-7 sm:min-h-[410px] sm:p-12 lg:p-14">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <span className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold tracking-normal text-white backdrop-blur-sm">{tr("Soil Profile")}</span>

            <Link
              to="/knowledge/soils"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-white/10"
            >
              <span aria-hidden="true">←</span>{tr("All Soils")}</Link>
          </div>

          <div>
            <span className="text-[13px] font-bold tracking-normal text-[#ACD2BB]">{tr("The Soil Library")}</span>

            <h1 className="mt-4 font-serif text-[clamp(3.5rem,9vw,7.5rem)] leading-[0.98] tracking-tight text-white">
              {tr(soil.name)}
              
            </h1>
            <ReadAloud
              className="mt-5"
              text={[tr(soil.name), tr(soil.shortDescription), `${tr('Drainage')}: ${tr(soil.drainage)}`].join('. ')}
            />

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/75">
              {<LocalizedContent text={soil.shortDescription} />}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[13px] font-semibold text-white">{tr("Drainage:")}{tr(soil.drainage)}
              </span>

              <span className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[13px] font-semibold text-white">{tr("Water Retention:")}{tr(soil.waterRetention)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* OVERVIEW METRICS */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[22px] border border-[#DCE7DE] bg-white p-6">
          <Eyebrow>{tr("Drainage")}</Eyebrow>

          <p className="mt-5 font-serif text-[clamp(1.8rem,3vw,2.7rem)] leading-tight tracking-tight text-[#234346]">
            {tr(soil.drainage)}
          </p>

          <p className="mt-3 text-xs leading-6 text-[#7B9185]">{tr("Water movement through soil.")}</p>
        </div>

        <div className="rounded-[22px] border border-[#DCE7DE] bg-white p-6">
          <Eyebrow>{tr("Water Retention")}</Eyebrow>

          <p className="mt-5 font-serif text-[clamp(1.8rem,3vw,2.7rem)] leading-tight tracking-tight text-[#234346]">
            {tr(soil.waterRetention)}
          </p>

          <p className="mt-3 text-xs leading-6 text-[#7B9185]">{tr("Natural moisture holding capacity.")}</p>
        </div>

        <div className="rounded-[22px] border border-[#DCE7DE] bg-white p-6">
          <Eyebrow>{tr("Compatible Crops")}</Eyebrow>

          <p className="mt-5 font-serif text-[clamp(2.5rem,4vw,3.5rem)] leading-tight tracking-tight text-[#234346]">
            {compatibleCrops.length}
          </p>

          <p className="mt-3 text-xs leading-6 text-[#7B9185]">{tr("Crops in our knowledge library.")}</p>
        </div>
      </section>

      {/* PHYSICAL PROFILE */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[24px] border border-[#DCE7DE] bg-[#E9F3EA] p-6 sm:p-8">
          <Eyebrow>{tr("Physical Profile")}</Eyebrow>

          <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#1F3D40]">{tr("Texture & Structure.")}</h2>

          <p className="mt-5 text-sm leading-8 text-[#5D7669]">
            {<LocalizedContent text={soil.textureCharacteristics} />}
          </p>

          <div className="mt-7 grid grid-cols-2 gap-4 border-t border-[#CFE2D5] pt-6">
            <div>
              <Eyebrow>{tr("Drainage")}</Eyebrow>

              <p className="mt-2 text-sm font-bold text-[#305354]">
                {tr(soil.drainage)}
              </p>
            </div>

            <div>
              <Eyebrow>{tr("Moisture")}</Eyebrow>

              <p className="mt-2 text-sm font-bold text-[#305354]">
                {tr(soil.waterRetention)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-[#DCE7DE] bg-white p-6 sm:p-8">
          <Eyebrow>{tr("Soil Chemistry")}</Eyebrow>

          <h2 className="mt-3 font-serif text-3xl tracking-tight text-[#1F3D40]">{tr("Nutrient Dynamics.")}</h2>

          <p className="mt-5 text-sm leading-8 text-[#5D7669]">
            {<LocalizedContent text={soil.nutrientRetention} />}
          </p>
        </div>
      </section>

      {/* MANAGEMENT GUIDANCE */}
      <section className="space-y-5">
        <div>
          <Eyebrow>{tr("Field Knowledge")}</Eyebrow>

          <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#1F3D40] sm:text-4xl">{tr("Manage your soil.")}</h2>
        </div>

        <div className="space-y-3">
          <DetailSection title={tr("Agricultural Advantages")} defaultOpen>
            <ul className="space-y-3">
              {soil.advantages.map((advantage, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 font-bold text-[#4B7E69]"
                  >
                    ✓
                  </span>

                  <span><LocalizedContent text={advantage} /></span>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection title={tr("Management Challenges")}>
            <ul className="space-y-3">
              {soil.challenges.map((challenge, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-1 font-bold text-[#B2834F]"
                  >
                    •
                  </span>

                  <span><LocalizedContent text={challenge} /></span>
                </li>
              ))}
            </ul>
          </DetailSection>

          <DetailSection title={tr("Soil Improvement Practices")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {soil.improvementPractices.map((practice, index) => (
                <div
                  key={index}
                  className="rounded-[15px] border border-[#DAE9DE] bg-[#F4F9F4] p-4"
                >
                  <span className="text-xs font-bold tracking-normal text-[#799885]">{tr("Practice")}{String(index + 1).padStart(2, '0')}
                  </span>

                  <p className="mt-2 text-xs leading-7 text-[#5D7669]">
                    <LocalizedContent text={practice} />
                  </p>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection title={tr("Research & References")}>
            <ul className="space-y-3">
              {soil.sources.map((source, index) => (
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
          </DetailSection>
        </div>
      </section>

      {/* COMPATIBLE CROPS */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>{tr("Crop Compatibility")}</Eyebrow>

            <h2 className="mt-2 font-serif text-3xl tracking-tight text-[#1F3D40] sm:text-4xl">{tr("Suitable Crops.")}</h2>
          </div>

          <Link
            to="/knowledge/crops"
            className="text-xs font-bold text-[#407067] hover:underline"
          >{tr("Explore all crops ↗")}</Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {compatibleCrops.map((crop) => (
            <Link
              key={crop.id}
              to={`/knowledge/crops/${crop.slug}`}
              className="group flex items-center justify-between gap-4 rounded-[18px] border border-[#DCE7DE] bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-[#9EC2AD] hover:shadow-sm"
            >
              <div className="min-w-0">
                <h3 className="font-serif text-xl text-[#234346]">
                  {tr(crop.name)}
                </h3>

                <p className="mt-1 text-[13px] text-[#7D9386]">
                  {crop.seasons.map(season => tr(season)).join(', ')}
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

      {/* ADVISORY */}
      <aside className="rounded-[18px] border border-[#DCE7DE] bg-[#E9F3EA] px-5 py-5 sm:px-7">
        <p className="text-xs leading-7 text-[#617B6D]">
          <strong className="text-[#234346]">{tr("Agricultural Advisory:")}</strong>{' '}{tr("Soil texture alone does not determine crop success. Local soil pH, salinity, root depth, drainage and irrigation water quality also matter. Soil testing before sowing is strongly recommended.")}</p>
      </aside>

      {/* BACK LINK */}
      <div className="flex justify-center pt-2">
        <Link
          to="/knowledge/soils"
          className="inline-flex items-center gap-3 rounded-full border border-[#C4DACD] px-6 py-3 text-xs font-bold text-[#22484D] transition hover:bg-[#E5F0E7]"
        >{tr("← Back to Soil Library")}</Link>
      </div>
    </div>
  );
};
