import { tr, useLocale, selectLanguage } from '../i18n';
import { languages } from '../i18n/languages';

import React from 'react';
import { Link } from 'react-router-dom';
import { CROPS_DATA } from '../data/crops';
import { SOILS_DATA } from '../data/soils';
import { cropImage, soilImage, sceneImage } from '../data/media';
import { sowingSeason, seasonMonths } from '../data/seasons';


const tools = [
  { path: '/tools/weather', icon: '🌦️', title: 'Weather', description: 'Rain, heat and wind for the next 7 days, with advice for field work.' },
  { path: '/tools/mandi', icon: '₹', title: 'Mandi prices', description: 'Today’s prices from APMC markets near you.' },
  { path: '/tools/advisor', icon: '🧭', title: 'Crop advisor', description: 'Find crops that suit your soil, season and water.' },
  { path: '/my-farms', icon: '🚜', title: 'My farms', description: 'Record sowing, tasks and activities for each field.' },
];

export const HomePage: React.FC = () => {
  const code = useLocale();
  const season = sowingSeason();
  const seasonCrops = CROPS_DATA.filter((crop) => crop.seasons.includes(season));

  return (
    <div className="-mt-px">
      {/* Hero: a real Indian field, with language choice up front */}
      <section className="relative isolate overflow-hidden bg-profarm-deep text-white">
        <img
          src={sceneImage('mustard-field')}
          alt=""
          className="absolute inset-0 -z-10 h-full w-full object-cover"
          {...{ fetchpriority: 'high' }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-profarm-deep via-profarm-deep/60 to-profarm-deep/5" />

        <div className="pf-container flex min-h-[78vh] flex-col justify-end pb-12 pt-28 sm:pb-16">
          <h1 className="max-w-3xl font-display text-[clamp(2.6rem,6.4vw,5.2rem)] font-bold leading-[1.02]">
            {tr('Better decisions for every season on your farm.')}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
            {tr('Crop and soil guidance, local weather, mandi prices and your farm diary, in your own language.')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex min-h-12 items-center rounded-2xl bg-profarm-turmeric px-6 text-base font-bold text-profarm-ink shadow-lg transition hover:bg-[#F5B921]"
            >
              {tr('Create a free account')}
            </Link>
            <Link
              to="/tools/weather"
              className="inline-flex min-h-12 items-center rounded-2xl border-2 border-white/70 px-6 text-base font-bold text-white transition hover:bg-white/10"
            >
              {tr('Check weather')}
            </Link>
          </div>

          <div className="mt-10 border-t border-white/20 pt-6">
            <p id="hero-language-label" className="text-sm font-semibold text-white/80">
              {tr('Choose your language')}
            </p>
            <div role="group" aria-labelledby="hero-language-label" className="mt-3 flex flex-wrap gap-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  type="button"
                  lang={language.code}
                  aria-pressed={code === language.code}
                  onClick={() => void selectLanguage(language.code)}
                  className={`min-h-11 rounded-full px-5 text-base font-semibold transition ${
                    code === language.code
                      ? 'bg-white text-profarm-deep'
                      : 'bg-white/10 text-white ring-1 ring-white/35 hover:bg-white/20'
                  }`}
                >
                  {language.nativeName}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section aria-labelledby="tools-heading" className="pf-container py-14 sm:py-20">
        <h2 id="tools-heading" className="font-display text-3xl font-bold text-profarm-ink sm:text-4xl">
          {tr('What do you need today?')}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <Link
              key={tool.path}
              to={tool.path}
              className="flex gap-4 rounded-3xl border border-profarm-border bg-white p-5 transition hover:border-profarm-olive focus-visible:border-profarm-olive"
            >
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-profarm-mist text-2xl font-bold text-profarm-forest">
                {tool.icon}
              </span>
              <span>
                <span className="block font-display text-xl font-bold text-profarm-ink">{tr(tool.title)}</span>
                <span className="mt-1 block text-sm leading-relaxed text-profarm-muted">{tr(tool.description)}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Season guide */}
      <section aria-labelledby="season-heading" className="bg-white py-14 sm:py-20">
        <div className="pf-container">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full bg-[#FDF1D2] px-3 py-1 text-sm font-bold text-profarm-soil">
                {tr(season)} · {tr(seasonMonths[season])}
              </p>
              <h2 id="season-heading" className="mt-3 font-display text-3xl font-bold text-profarm-ink sm:text-4xl">
                {tr('Crops you can sow this season')}
              </h2>
            </div>
            <Link to="/knowledge/crops" className="min-h-11 rounded-2xl border border-profarm-border px-5 py-2.5 font-semibold text-profarm-forest hover:bg-profarm-mist">
              {tr('See all crops')}
            </Link>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {seasonCrops.map((crop) => {
              const photo = cropImage(crop.slug);
              return (
                <li key={crop.id}>
                  <Link to={`/knowledge/crops/${crop.slug}`} className="group block overflow-hidden rounded-3xl bg-profarm-mist">
                    <div className="aspect-[4/3] overflow-hidden">
                      {photo ? (
                        <img src={photo.src} alt={tr('{{v0}} crop', { v0: tr(crop.name) })} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      ) : (
                        <span aria-hidden="true" className="flex h-full items-center justify-center text-5xl">{crop.icon}</span>
                      )}
                    </div>
                    <div className="p-4">
                      <span className="block font-display text-lg font-bold leading-tight text-profarm-ink">{tr(crop.name)}</span>
                      <span className="mt-1 block text-sm text-profarm-muted">
                        {crop.temperatureRange.minC}–{crop.temperatureRange.maxC}°C · {tr('Water:')} {tr(crop.waterRequirement.level)}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Soils */}
      <section aria-labelledby="soil-heading" className="pf-container py-14 sm:py-20">
        <h2 id="soil-heading" className="font-display text-3xl font-bold text-profarm-ink sm:text-4xl">
          {tr('Know your soil')}
        </h2>
        <p className="mt-2 max-w-xl text-profarm-muted">
          {tr('Each soil holds water and nutrients differently. Pick yours to see which crops do well in it.')}
        </p>
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          {SOILS_DATA.map((soil) => {
            const photo = soilImage(soil.slug);
            return (
              <li key={soil.id}>
                <Link to={`/knowledge/soils/${soil.slug}`} className="group relative block aspect-[3/2] overflow-hidden rounded-3xl bg-profarm-soil">
                  {photo && (
                    <img src={photo.src} alt={tr('{{v0}} sample', { v0: tr(soil.name) })} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-10 font-display text-lg font-bold text-white">
                    {tr(soil.name)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Closing call to action */}
      <section className="bg-profarm-forest text-white">
        <div className="pf-container flex flex-wrap items-center justify-between gap-6 py-12">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold">{tr('Keep a diary for every field')}</h2>
            <p className="mt-2 text-white/80">
              {tr('Save sowing dates, tasks and activities. ProFarm reminds you what is due and what is overdue.')}
            </p>
          </div>
          <Link to="/signup" className="inline-flex min-h-12 items-center rounded-2xl bg-profarm-turmeric px-6 font-bold text-profarm-ink hover:bg-[#F5B921]">
            {tr('Create a free account')}
          </Link>
        </div>
      </section>
    </div>
  );
};
