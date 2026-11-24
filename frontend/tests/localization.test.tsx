import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n, { bindLanguageUser, currentLanguage, formatNumber, formatReportedDate, hasTranslation, initialLanguage, LANGUAGE_STORAGE_KEY, locale, localizedMatches, normalizeSearch, preferenceRevision, selectLanguage, tr, useLocale } from '../src/i18n';
import { languages, languageRegistry, supportedLanguage, catalogVersion } from '../src/i18n/languages';
import { LanguageSelector } from '../src/i18n/LanguageSelector';
import { LocalizedContent } from '../src/i18n/LocalizedContent';
import { resolvePublicContent, TranslationCache, translationCache, type VerifiedTranslation } from '../src/i18n/content';
import catalogs from '../src/i18n/locales/catalogs.json';
import { CROPS_DATA } from '../src/data/crops';
import { SOILS_DATA } from '../src/data/soils';

beforeEach(async () => { await bindLanguageUser(null); await selectLanguage('en'); localStorage.clear(); translationCache.clear(); });
afterEach(async () => { cleanup(); await bindLanguageUser(null); await selectLanguage('en'); localStorage.clear(); });

describe('language registry and catalog contracts', () => {
  it('has exactly the requested 13 unique languages with explicit availability', () => {
    expect(languages.map(item => item.code)).toEqual(['en','hi','te','ta','kn','ml','mr','bn','gu','pa','or','as','ur']);
    expect(new Set(languages.map(item => item.code)).size).toBe(13);
    expect(languageRegistry.every(item => item.nativeName && item.englishName && item.fallback === 'en' && item.contentAvailability)).toBe(true);
  });
  it('normalizes supported BCP 47 tags and rejects unsupported codes', () => {
    expect(supportedLanguage('TE_in')).toBe('te'); expect(supportedLanguage('ur-PK')).toBe('ur');
    expect(supportedLanguage('fr')).toBeUndefined(); expect(supportedLanguage(null)).toBeUndefined();
  });
  it.each(languages)('$code has valid keys, interpolation, names, and honest fallbacks', ({ code }) => {
    const catalog: Record<string,string> = catalogs[code];
    const placeholders = (text: string) => [...text.matchAll(/{{\s*([^{}]+?)\s*}}/g)].map(match => match[1]).sort();
    for (const [key,value] of Object.entries(catalog)) {
      expect(typeof value).toBe('string'); expect(value.trim()).not.toBe('');
      expect(Object.prototype.hasOwnProperty.call(catalogs.en,key)).toBe(true);
      expect(placeholders(value)).toEqual(placeholders(key));
    }
    for (const record of [...CROPS_DATA,...SOILS_DATA]) expect(catalog[record.name]).toBeTruthy();
    if(code !== 'en') {
      expect(catalog.Home).not.toBe('Home');
      expect(catalog['English fallback']).toBeTruthy();
      expect(languageRegistry.find(item => item.code === code)?.catalogAvailability).toBe('partial');
    }
  });
  it.each(languages)('$code runtime language chunk matches the validated catalog', async ({code})=>{
    await selectLanguage(code);
    for(const [key,value] of Object.entries(catalogs[code])) expect(tr(key)).toBe(value);
  });
  it('renders interpolated text as text, preserving the exact input value', async () => {
    await selectLanguage('hi');
    const text=tr('Drainage: {{v0}}',{v0:'<img src=x onerror=alert(1)> 24 mm'});
    render(<p>{text}</p>);
    expect(screen.getByText(text)).toBeInTheDocument(); expect(document.querySelector('img')).toBeNull(); expect(text).toContain('24 mm');
  });
  it('returns unknown content unchanged and records no fabricated translation', async () => {
    await selectLanguage('te'); expect(tr('Uncatalogued public text')).toBe('Uncatalogued public text');
    expect(hasTranslation('Uncatalogued public text')).toBe(false);
  });
});

describe('switching and preference precedence', () => {
  it('restores local preference before the browser and uses English for unsupported browsers', () => {
    expect(initialLanguage(['fr','ta-IN'])).toBe('ta'); expect(initialLanguage(['fr'])).toBe('en');
    localStorage.setItem(LANGUAGE_STORAGE_KEY,'hi'); expect(initialLanguage(['te-IN'])).toBe('hi');
    localStorage.setItem(LANGUAGE_STORAGE_KEY,'invalid'); expect(initialLanguage(['te-IN'])).toBe('te');
  });
  it('switches immediately through an accessible selector without remounting a form', async () => {
    function Form() { useLocale(); return <><LanguageSelector/><label>{tr('Full Name')}<input aria-label="draft" defaultValue="Unchanged user text"/></label><p>{tr('Home')}</p></>; }
    render(<Form/>); fireEvent.change(screen.getByLabelText('draft'),{target:{value:'गेहूं user farm'}});
    await act(async()=>fireEvent.change(screen.getByRole('combobox'),{target:{value:'te'}}));
    expect(screen.getByText(catalogs.te.Home)).toBeInTheDocument(); expect(screen.getByLabelText('draft')).toHaveValue('गेहूं user farm');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('te'); expect(initialLanguage(['en'])).toBe('te');
  });
  it('restores an account preference and keeps different accounts separate', async () => {
    await bindLanguageUser('a'); await selectLanguage('hi'); await bindLanguageUser(null); await selectLanguage('ta');
    await bindLanguageUser('b'); await selectLanguage('te'); await bindLanguageUser('a'); expect(currentLanguage()).toBe('hi');
    await bindLanguageUser('b'); expect(currentLanguage()).toBe('te');
  });
  it('does not overwrite an explicit selection made while authentication is pending', async () => {
    await bindLanguageUser('a'); await selectLanguage('hi'); await bindLanguageUser(null);
    const revision=preferenceRevision(); await selectLanguage('ur'); await bindLanguageUser('a',revision);
    expect(currentLanguage()).toBe('ur'); await bindLanguageUser(null); await bindLanguageUser('a'); expect(currentLanguage()).toBe('ur');
  });
  it('keeps an explicit guest selection made before login starts', async () => {
    await bindLanguageUser('saved'); await selectLanguage('hi'); await bindLanguageUser(null);
    await selectLanguage('te'); const revision=preferenceRevision(); await bindLanguageUser('saved',revision);
    expect(currentLanguage()).toBe('te');
  });
  it('keeps language after logout and rejects unsupported selections', async () => {
    await bindLanguageUser('a'); await selectLanguage('ta'); await bindLanguageUser(null);
    await selectLanguage('xx'); expect(currentLanguage()).toBe('ta'); expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('ta');
  });
  it('sets Urdu direction and restores LTR when switching away', async () => {
    await selectLanguage('ur'); expect(document.documentElement).toHaveAttribute('lang','ur'); expect(document.documentElement).toHaveAttribute('dir','rtl');
    await selectLanguage('te'); expect(document.documentElement).toHaveAttribute('dir','ltr');
  });
});

describe('localized public data presentation', () => {
  it.each(languages)('$code crop and soil names are searchable without changing IDs', ({code})=>{
    const catalog: Record<string,string>=catalogs[code];
    expect(CROPS_DATA.filter(crop=>localizedMatches(catalog.Wheat,crop.name,crop.hindiName)).map(crop=>crop.id)).toContain('crop-wheat');
    expect(SOILS_DATA.filter(soil=>localizedMatches(catalog['Loamy Soil'],soil.name)).map(soil=>soil.id)).toContain('soil-loam');
  });
  it('keeps existing Hindi and English search and Unicode normalization',()=>{
    expect(localizedMatches('गेहूं','Wheat','गेहूं')).toBe(true); expect(localizedMatches('wHeAt','Wheat')).toBe(true);
    expect(normalizeSearch('  Ｗｈｅａｔ  ')).toBe('wheat');
  });
  it('formats weather and Mandi numbers with Intl without changing their values',async()=>{
    for(const code of ['te','ta','ur']){await selectLanguage(code); expect(formatNumber(24.2,{maximumFractionDigits:1})).toBe(new Intl.NumberFormat(locale(),{maximumFractionDigits:1}).format(24.2)); expect(formatNumber(125000)).toBe(new Intl.NumberFormat(locale()).format(125000));}
    expect(formatNumber(Number.NaN)).toBe('—');
  });
  it('formats valid Mandi dates but preserves invalid and missing data without inventing dates', async()=>{
    expect(formatReportedDate('17/10/2026')).toBe('17/10/2026');
    await selectLanguage('ur');
    expect(formatReportedDate('17/10/2026')).toBe(new Intl.DateTimeFormat('ur-IN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(2026,9,17))));
    expect(formatReportedDate('31/02/2026')).toBe('31/02/2026'); expect(formatReportedDate(null)).toBe('—');
    expect(formatReportedDate('Not reported')).toBe(catalogs.ur['Not reported']);
  });
  it('labels unreviewed Advisor and agricultural prose as English fallback',async()=>{
    await selectLanguage('hi'); render(<LocalizedContent text="Apply exactly 24 mm only if recommended by your agronomist."/>);
    const element=screen.getByText(/Apply exactly 24 mm/); expect(element).toHaveAttribute('lang','en'); expect(element).toHaveAttribute('data-translation','english-fallback');
    expect(screen.getByText(catalogs.hi['English fallback'])).toBeInTheDocument();
  });
  it('never rewrites user content or scientific identifiers in canonical records',()=>{
    expect(CROPS_DATA.find(crop=>crop.id==='crop-wheat')?.scientificName).toBe('Triticum aestivum');
    expect(i18n.exists('crop-wheat')).toBe(false);
  });
});

describe('verified translation cache',()=>{
  const entry: VerifiedTranslation={contentId:'public:weather:24',source:'Rainfall: 24 mm',sourceLanguage:'en',targetLanguage:'te',contentVersion:'v1',catalogVersion,text:'వర్షపాతం: 24 mm',reviewed:true};
  it('serves verified structured dynamic content and preserves its numeric value',()=>{
    translationCache.put(entry);
    expect(resolvePublicContent(entry.source,entry.contentId,'v1','te')).toMatchObject({text:entry.text,fallback:false,origin:'verified-cache'});
  });
  it('invalidates when source, content version, catalog version, or language changes',()=>{
    const cache=new TranslationCache(); cache.put(entry);
    expect(cache.get(entry)).toBe(entry.text);
    expect(cache.get({...entry,source:'Rainfall: 25 mm'})).toBeUndefined(); expect(cache.get({...entry,contentVersion:'v2'})).toBeUndefined();
    expect(cache.get({...entry,catalogVersion:'next'})).toBeUndefined(); expect(cache.get({...entry,targetLanguage:'hi'})).toBeUndefined();
  });
  it('bounds memory, replaces entries safely, and rejects unreviewed translations',()=>{
    const cache=new TranslationCache(1); expect(cache.put({...entry,reviewed:false} as unknown as VerifiedTranslation)).toBe(false);
    cache.put(entry); cache.put({...entry,text:'updated'}); expect(cache.size).toBe(1); expect(cache.get(entry)).toBe('updated');
    cache.put({...entry,contentId:'other'}); expect(cache.get(entry)).toBeUndefined(); expect(cache.size).toBe(1);
  });
  it('prefers an existing reviewed translation and otherwise falls back without requests',()=>{
    expect(resolvePublicContent(entry.source,entry.contentId,'v1','te',{language:'te',text:entry.text,reviewed:true})).toMatchObject({text:entry.text,origin:'existing-reviewed'});
    expect(resolvePublicContent(entry.source,entry.contentId,'v2','ur')).toMatchObject({text:entry.source,fallback:true,language:'en'});
  });
});
