import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import searchNames from './locales/search-names.json';
import { languages, supportedLanguage, type LanguageCode } from './languages';

export const LANGUAGE_STORAGE_KEY = 'profarm.language.v1';
const accountKey = (id: string) => `${LANGUAGE_STORAGE_KEY}.account.${encodeURIComponent(id)}`;
let boundUser: string | null = null;
let selectionRevision = 0;
let explicitGuestSelection = false;
let languageRequest = 0;
const loaders = import.meta.glob<{ default: Record<string, string> }>('./locales/*/translation.json');
async function ensureLanguage(code: LanguageCode) {
  if (code === 'en' || i18n.hasResourceBundle(code, 'translation')) return;
  const loader = loaders[`./locales/${code}/translation.json`];
  if (!loader) throw new Error(`Missing bundled catalog: ${code}`);
  const resource = await loader();
  i18n.addResourceBundle(code, 'translation', resource.default, true, true);
}
const read = (key: string) => { try { return supportedLanguage(localStorage.getItem(key)); } catch { return undefined; } };
const write = (key: string, code: LanguageCode) => { try { localStorage.setItem(key, code); } catch { /* Private browsing/storage quota: session still works. */ } };
export function initialLanguage(browserLanguages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages): LanguageCode {
  return read(LANGUAGE_STORAGE_KEY) || browserLanguages.map(supportedLanguage).find(Boolean) || 'en';
}
void i18n.use(initReactI18next).init({
  resources: { en: { translation: {} } },
  lng: 'en', fallbackLng: 'en', supportedLngs: languages.map(language => language.code),
  keySeparator: false, nsSeparator: false, initAsync: false,
  interpolation: { escapeValue: false }, returnNull: false,
});
export const currentLanguage = (): LanguageCode => supportedLanguage(i18n.resolvedLanguage || i18n.language) || 'en';
export const locale = () => `${currentLanguage()}-IN`;
export const isRtl = () => (languages.find(language => language.code === currentLanguage())?.direction as string | undefined) === 'rtl';
export const preferenceRevision = () => selectionRevision;
export async function selectLanguage(value: string): Promise<void> {
  const code = supportedLanguage(value);
  if (!code) return;
  selectionRevision += 1;
  const request = ++languageRequest;
  if (!boundUser) explicitGuestSelection = true;
  write(LANGUAGE_STORAGE_KEY, code);
  if (boundUser) write(accountKey(boundUser), code);
  try {
    await ensureLanguage(code);
    if (request === languageRequest) {
      await i18n.changeLanguage(code);
      if (boundUser) write(accountKey(boundUser), code);
    }
  } catch {
    // A missing/offline language chunk leaves the current usable language in place.
    if (request === languageRequest) {
      write(LANGUAGE_STORAGE_KEY, currentLanguage());
      if (boundUser) write(accountKey(boundUser), currentLanguage());
    }
  }
}
/** Local per-account preferences; no profile API or schema field exists. */
export async function bindLanguageUser(id: string | null, startedAtRevision = selectionRevision): Promise<void> {
  boundUser = id;
  if (!id) return;
  const saved = read(accountKey(id));
  if (saved && startedAtRevision === selectionRevision && !explicitGuestSelection) {
    const request = ++languageRequest;
    try {
      await ensureLanguage(saved);
      if (request === languageRequest && startedAtRevision === selectionRevision && boundUser === id) {
        write(LANGUAGE_STORAGE_KEY, saved);
        await i18n.changeLanguage(saved);
      }
    } catch { /* Keep the current usable language; never retry indefinitely. */ }
  } else write(accountKey(id), read(LANGUAGE_STORAGE_KEY) || currentLanguage());
  explicitGuestSelection = false;
}
export async function initializeLocalization() {
  const code = initialLanguage();
  try { await ensureLanguage(code); await i18n.changeLanguage(code); }
  catch { await i18n.changeLanguage('en'); }
}
function documentLanguage() {
  if (typeof document === 'undefined') return;
  const code = currentLanguage();
  document.documentElement.lang = code;
  document.documentElement.dir = languages.find(language => language.code === code)?.direction || 'ltr';
}
i18n.on('languageChanged', documentLanguage);
documentLanguage();
export function tr(source: string | null | undefined, values?: Record<string, unknown>): string {
  if (source == null) return '';
  return String(i18n.t(source, { ...values, defaultValue: source }));
}
/** Subscribe each page to changes without remounting forms or refetching canonical data. */
export function useLocale() { useTranslation(); return currentLanguage(); }
export function hasTranslation(source: string, language = currentLanguage()): boolean {
  return typeof i18n.getResource(language, 'translation', source, { keySeparator: false }) === 'string';
}
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return Number.isFinite(value) ? new Intl.NumberFormat(locale(), options).format(value) : '—';
}
export function formatAreaUnit(value: string | null | undefined): string {
  return value === 'acres' ? tr('Acres') : value === 'hectares' ? tr('Hectares') : value || tr('Not specified');
}
export function formatReportedDate(value: string | null | undefined): string {
  if (!value) return '—';
  if (currentLanguage() === 'en') return value;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return tr(value);
  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return value;
  return new Intl.DateTimeFormat(locale(), { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(date);
}
export function normalizeSearch(value: string): string {
  return value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLocaleLowerCase('und');
}
export function localizedMatches(query: string, ...canonicalValues: (string | undefined)[]): boolean {
  const needle = normalizeSearch(query);
  return !needle || canonicalValues.some(value => value && (
    normalizeSearch(value).includes(needle) || languages.some(({ code }) => {
      const catalog = searchNames[code] as Record<string, string>;
      return normalizeSearch(catalog[value] || value).includes(needle);
    })
  ));
}
export default i18n;
