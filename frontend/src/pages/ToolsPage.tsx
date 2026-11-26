import { tr, useLocale } from '../i18n';
import { sceneImage } from '../data/media';

import React from 'react';
import { Link } from 'react-router-dom';

const IMAGES = {
  hero: sceneImage('sprinkler-irrigation'),
  weather: sceneImage('monsoon-paddy'),
  mandi: sceneImage('onion-market'),
  advisor: sceneImage('farmer-fertilizer'),
  planner: sceneImage('tractor-punjab'),
};

const ArrowIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
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

const CloudIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M7 17H5a3 3 0 0 1-.2-6A7 7 0 0 1 18 9a4 4 0 0 1 1 8h-2" />
    <path d="m9 16-2 4m7-4-2 4m7-4-2 4" />
  </svg>
);

const MarketIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10h18M5 10v10h14V10M3 10l2-6h14l2 6M9 20v-6h6v6" />
  </svg>
);

const LeafIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 4C10 4 4 9 4 16a4 4 0 0 0 4 4c7 0 12-6 12-16Z" />
    <path d="M4 20c3-5 7-8 12-11" />
  </svg>
);

const ChartIcon = () => (
  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 20V4m0 16h16M8 16v-5m5 5V7m5 9v-8" />
  </svg>
);

type ToolCardProps = {
  number: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  to: string;
  action: string;
  icon: React.ReactNode;
  features: string[];
};

const ToolCard: React.FC<ToolCardProps> = ({
  number,
  title,
  description,
  image,
  imageAlt,
  to,
  action,
  icon,
  features,
}) => (
  <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#D7E7DE] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#B5CEC6] hover:shadow-[0_16px_45px_rgba(24,65,39,0.10)]">
    <div className="relative h-[225px] overflow-hidden bg-[#D6E9DE] sm:h-[245px]">
      <img
        src={image}
        alt={imageAlt}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D3034]/50 via-transparent to-transparent" />

      <span className="absolute left-5 top-5 rounded-full border border-white/25 bg-[#153C41]/85 px-3 py-1.5 text-xs font-bold tracking-normal text-white backdrop-blur-sm">{tr("Available")}</span>

      <span className="absolute bottom-5 right-5 text-3xl font-semibold text-white/85">
        {number}
      </span>
    </div>

    <div className="flex flex-1 flex-col p-5 sm:p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9F5ED] text-[#2A6267]">
        {icon}
      </div>

      <h3 className="mt-4 font-serif text-[24px] font-semibold leading-tight text-[#183B3E]">
        {tr(title)}
      </h3>

      <p className="mt-3 text-sm leading-6 text-[#476260]">
        {tr(description)}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {features.map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-[#D6E8DE] bg-[#F1F8F3] px-3 py-1.5 text-[13px] font-semibold text-[#3A6564]"
          >
            {feature}
          </span>
        ))}
      </div>

      <div className="mt-auto pt-6">
        <Link
          to={to}
          className="inline-flex w-full items-center justify-between rounded-xl bg-[#265A5F] px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#17454A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#265A5F]"
        >
          {tr(action)}
          <ArrowIcon />
        </Link>
      </div>
    </div>
  </article>
);

export const ToolsPage: React.FC = () => {
  useLocale();
  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-16 text-[#1F3D40]">
      {/* Page heading */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav
            aria-label={tr("Breadcrumb")}
            className="mb-3 flex items-center gap-2 text-xs font-medium text-[#59716F]"
          >
            <Link to="/" className="hover:text-[#266066]">{tr("Home")}</Link>
            <span>/</span>
            <span className="font-semibold text-[#266066]">{tr("Farm Tools")}</span>
          </nav>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#153A3F] sm:text-4xl">{tr("Farm Tools & Intelligence")}</h1>

          <p className="mt-2 text-sm font-medium text-[#466261]">{tr("Essential insights for smarter farming decisions.")}</p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-[#CEE5D9] bg-[#EBF6EF] px-4 py-2 text-xs font-bold text-[#326D6D]">
          <span className="h-2 w-2 rounded-full bg-[#68A596]" />{tr("3 tools available")}</span>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden rounded-2xl bg-[#153C41]">
        <img
          src={IMAGES.hero}
          alt={tr("Green agricultural fields")}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-[#0C3237]/95 via-[#144247]/85 to-[#144247]/25" />

        <div className="relative grid min-h-[325px] gap-8 p-6 sm:p-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:p-11">
          <div className="max-w-xl text-white">

            <h2 className="mt-5 font-serif text-4xl font-semibold leading-[1.15] sm:text-5xl">{tr("Better tools.")}<br />{tr("Better decisions.")}</h2>

            <p className="mt-5 max-w-md text-sm leading-6 text-[#DFF0E8]">{tr("Weather, market prices and crop guidance — all in one place.")}</p>

            <Link
              to="/tools/weather"
              className="mt-7 inline-flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-[#1E484D] transition hover:bg-[#E9F5ED]"
            >{tr("Explore Weather")}<ArrowIcon />
            </Link>
          </div>

          <div className="hidden justify-end lg:flex">
            <div className="w-full max-w-[305px] rounded-2xl border border-white/25 bg-[#10383D]/70 p-6 text-white backdrop-blur-md">
              <p className="text-[13px] font-bold tracking-normal text-[#CDE9DD]">{tr("Your farming toolkit")}</p>

              <div className="mt-6 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <CloudIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{tr("Weather")}</p>
                    <p className="mt-0.5 text-xs text-[#D1E8DE]">{tr("7-day forecast")}</p>
                  </div>
                </div>

                <div className="border-t border-white/15" />

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <MarketIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{tr("Mandi Prices")}</p>
                    <p className="mt-0.5 text-xs text-[#D1E8DE]">{tr("Wholesale market data")}</p>
                  </div>
                </div>

                <div className="border-t border-white/15" />

                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                    <LeafIcon />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{tr("Farm Advisor")}</p>
                    <p className="mt-0.5 text-xs text-[#D1E8DE]">{tr("Crop and soil guidance")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>

            <h2 className="mt-2 font-serif text-[27px] font-semibold text-[#183B3F] sm:text-[30px]">{tr("Tools for Every Decision")}</h2>
          </div>

          <p className="text-xs font-semibold text-[#57726F]">{tr("Choose a tool to get started")}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <ToolCard
            number="01"
            title={tr("Weather & Rainfall")}
            description={tr("Check local conditions, rainfall forecasts and weather-based farming guidance.")}
            image={IMAGES.weather}
            imageAlt="Rural landscape beneath a cloudy sky"
            to="/tools/weather"
            action={tr("Open Weather")}
            icon={<CloudIcon />}
            features={['7-day forecast', 'Rainfall', 'Farm guidance']}
          />

          <ToolCard
            number="02"
            title={tr("Mandi Price Tracker")}
            description={tr("Explore reported wholesale crop prices and compare rates across Indian markets.")}
            image={IMAGES.mandi}
            imageAlt="Agricultural fields ready for harvest"
            to="/tools/mandi"
            action={tr("Explore Mandi Prices")}
            icon={<MarketIcon />}
            features={['Commodity prices', 'Market comparison', 'Filters']}
          />

          <ToolCard
            number="03"
            title={tr("Sustainable Farm Advisor")}
            description={tr("Get practical crop, soil and weather-based recommendations for your field.")}
            image={IMAGES.advisor}
            imageAlt="Natural green landscape"
            to="/tools/advisor"
            action={tr("Open Farm Advisor")}
            icon={<LeafIcon />}
            features={['Crop care', 'Soil health', 'Water planning']}
          />
        </div>
      </section>

      {/* Coming soon */}
      <section className="overflow-hidden rounded-2xl border border-[#D7E7DE] bg-[#F1F8F3]">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[250px] overflow-hidden bg-[#D4E7DD] lg:min-h-[305px]">
            <img
              src={IMAGES.planner}
              alt={tr("Green cultivated farmland")}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#133B40]/30 to-transparent" />

            <span className="absolute left-5 top-5 rounded-full border border-white/30 bg-[#153C41]/85 px-3 py-2 text-[13px] font-bold text-white backdrop-blur-sm">{tr("In development")}</span>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DCEFE4] text-[#296167]">
              <ChartIcon />
            </div>

            <p className="mt-5 text-[13px] font-bold tracking-normal text-[#54827C]">{tr("Upcoming tool")}</p>

            <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#183B3F]">{tr("Farm Economic Planner")}</h2>

            <p className="mt-4 max-w-md text-sm leading-6 text-[#496462]">{tr("Plan cultivation costs, estimate expenses and assess potential farm returns.")}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {['Cost planning', 'Expense breakdown', 'Revenue estimates'].map(
                (feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-[#CFE5D9] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#446B68]"
                  >
                    {feature}
                  </span>
                )
              )}
            </div>

            <p className="mt-7 inline-flex items-center gap-2 text-xs font-bold text-[#57736F]">
              <span className="h-2 w-2 rounded-full bg-[#81AC95]" />{tr("Coming in a future release")}</p>
          </div>
        </div>
      </section>

      {/* Minimal footer */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D7E7DE] pt-5">
        <p className="text-xs font-medium text-[#5F7470]">{tr("Built for informed, sustainable farming.")}</p>

        <Link
          to="/knowledge"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#266066] hover:text-[#153B40]"
        >{tr("Explore Knowledge Hub")}<ArrowIcon size={16} />
        </Link>
      </footer>
    </div>
  );
};
