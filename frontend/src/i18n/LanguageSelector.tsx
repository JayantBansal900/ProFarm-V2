import { useRef, useState } from 'react';
import { languages } from './languages';
import { currentLanguage, selectLanguage, tr, useLocale } from './index';
export function LanguageSelector() {
  const code = useLocale();
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  return <label className="language-selector relative inline-flex min-w-0 items-center">
    <span className="sr-only">{tr('Language')}</span>
    <select aria-label={tr('Language')} value={code} onChange={async event => {
      const requested = event.target.value;
      const revision = ++latest.current;
      setFailed(false);
      await selectLanguage(requested);
      if (revision === latest.current) setFailed(currentLanguage() !== requested);
    }}
      className="h-11 max-w-[120px] cursor-pointer appearance-none rounded-full border border-profarm-border bg-white bg-[length:14px] bg-[right_12px_center] bg-no-repeat pe-8 ps-4 text-[15px] font-semibold text-profarm-ink transition hover:border-profarm-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-profarm-gold" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2356676B' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}>
      {languages.map(language => <option key={language.code} value={language.code} lang={language.code} dir={language.direction}>{language.nativeName}</option>)}
    </select>
    {failed && <span role="status" className="max-w-40 text-xs text-red-800">{tr('Unable to load information. Please try again.')}</span>}
  </label>;
}
