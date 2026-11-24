import { currentLanguage, hasTranslation, tr, useLocale } from './index';
/** Public API display names only. Keep API query values and user-entered text separate. */
export function LocalizedLabel({ text }: { text: string }) {
  useLocale();
  const translated = currentLanguage() === 'en' || hasTranslation(text);
  return <span lang={translated ? currentLanguage() : 'en'} dir={translated ? 'auto' : 'ltr'} data-translation={translated ? 'bundled-label' : 'english-fallback'}>
    {!translated && <small lang={currentLanguage()} className="me-1 rounded bg-amber-50 px-1 text-xs text-amber-900">{tr('English fallback')}</small>}
    {tr(text)}
  </span>;
}
