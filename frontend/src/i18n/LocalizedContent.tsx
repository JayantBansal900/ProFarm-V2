import { tr, useLocale } from './index';
import { resolvePublicContent } from './content';
export function LocalizedContent({ text, id = text }: { text: string; id?: string }) {
  const language = useLocale();
  const result = resolvePublicContent(text, id, 'canonical-v1');
  return <span lang={result.language} dir={result.language === 'en' ? 'ltr' : 'auto'} data-translation={result.origin}>
    {result.fallback && <small lang={language} className="me-2 inline-block rounded bg-amber-50 px-1 text-xs text-amber-900">{tr('English fallback')}</small>}
    {result.text}
  </span>;
}
