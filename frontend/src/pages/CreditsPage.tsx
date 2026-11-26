import React from 'react';
import { tr, useLocale } from '../i18n';
import { allImageCredits } from '../data/media';

/** Attribution for every photo used in ProFarm, as the Creative Commons licences require. */
export const CreditsPage: React.FC = () => {
  useLocale();
  return (
    <div className="pf-container py-12 sm:py-16">
      <h1 className="font-display text-4xl font-bold text-profarm-ink">{tr('Photo credits')}</h1>
      <p className="mt-3 max-w-2xl text-profarm-muted">
        {tr('Crop and soil photos come from Wikimedia Commons. Each photo is used under the licence shown.')}
      </p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allImageCredits.map((credit) => (
          <li key={credit.key} className="flex gap-4 rounded-2xl border border-profarm-border bg-white p-3">
            <img src={credit.src} alt="" loading="lazy" className="h-20 w-24 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 text-sm">
              <p className="break-words font-semibold text-profarm-ink">{tr('Photo by {{v0}}', { v0: credit.author })}</p>
              <p className="mt-1 text-profarm-muted">
                {credit.licenseUrl ? (
                  <a href={credit.licenseUrl} target="_blank" rel="noreferrer" className="underline">{credit.license}</a>
                ) : credit.license}
              </p>
              <a href={credit.source} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-profarm-forest underline">
                {tr('View source')}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
