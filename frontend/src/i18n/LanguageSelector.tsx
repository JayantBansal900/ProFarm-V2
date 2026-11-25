import { useRef, useState } from 'react';
import { languages } from './languages';
import { currentLanguage, selectLanguage, tr, useLocale } from './index';
export function LanguageSelector() {
  const code = useLocale();
  const [failed, setFailed] = useState(false);
  const latest = useRef(0);
  return <label className="language-selector inline-flex min-w-0 items-center gap-1 text-xs text-[#22484D]">
    <span className="sr-only">{tr('Language')}</span>
    <select aria-label={tr('Language')} value={code} onChange={async event => {
      const requested = event.target.value;
      const revision = ++latest.current;
      setFailed(false);
      await selectLanguage(requested);
      if (revision === latest.current) setFailed(currentLanguage() !== requested);
    }}
      className="min-h-11 max-w-[112px] rounded-lg border border-[#CDE1D4] bg-[#F6F8F8] px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#48765C]">
      {languages.map(language => <option key={language.code} value={language.code} lang={language.code} dir={language.direction}>{language.nativeName}</option>)}
    </select>
    {failed && <span role="status" className="max-w-40 text-xs text-red-800">{tr('Unable to load information. Please try again.')}</span>}
  </label>;
}
