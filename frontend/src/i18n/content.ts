import { catalogVersion, type LanguageCode } from './languages';
import { currentLanguage, hasTranslation, tr } from './index';

export interface VerifiedTranslation {
  contentId: string; source: string; sourceLanguage: 'en'; targetLanguage: LanguageCode;
  contentVersion: string; catalogVersion: string; text: string; reviewed: true;
}
/** Memory-only, bounded, verified public content. Never accepts user-entered/private text. */
export class TranslationCache {
  private entries = new Map<string, VerifiedTranslation>();
  constructor(private readonly capacity = 200) {}
  private key(entry: Omit<VerifiedTranslation, 'text' | 'reviewed'>) {
    return JSON.stringify([entry.contentId, entry.source, entry.sourceLanguage, entry.targetLanguage, entry.contentVersion, entry.catalogVersion]);
  }
  put(entry: VerifiedTranslation): boolean {
    if (!entry.reviewed || !entry.text.trim() || entry.targetLanguage === 'en') return false;
    const key = this.key(entry);
    this.entries.delete(key);
    this.entries.set(key, { ...entry });
    while (this.entries.size > Math.max(0, this.capacity)) this.entries.delete(this.entries.keys().next().value!);
    return true;
  }
  get(entry: Omit<VerifiedTranslation, 'text' | 'reviewed'>): string | undefined {
    const key = this.key(entry); const cached = this.entries.get(key);
    if (!cached) return undefined;
    this.entries.delete(key); this.entries.set(key, cached);
    return cached.text;
  }
  clear() { this.entries.clear(); }
  get size() { return this.entries.size; }
}
export const translationCache = new TranslationCache();
export function resolvePublicContent(source: string, contentId: string, contentVersion: string,
  targetLanguage = currentLanguage(), existing?: { language: LanguageCode; text: string; reviewed: boolean }) {
  if (targetLanguage === 'en') return { text: source, language: 'en', fallback: false, origin: 'canonical' };
  // Draft interface catalogs are not professionally reviewed agricultural guidance.
  // Promote a public content entry here only after review, with its source/version.
  const reviewedBundled: ReadonlySet<string> = new Set();
  if (reviewedBundled.has(contentId) && hasTranslation(source, targetLanguage)) return { text: tr(source, { lng: targetLanguage }), language: targetLanguage, fallback: false, origin: 'bundled-reviewed' };
  if (existing?.reviewed && existing.language === targetLanguage) return { text: existing.text, language: targetLanguage, fallback: false, origin: 'existing-reviewed' };
  const cached = translationCache.get({ source, contentId, sourceLanguage: 'en', targetLanguage, contentVersion, catalogVersion });
  if (cached) return { text: cached, language: targetLanguage, fallback: false, origin: 'verified-cache' };
  return { text: source, language: 'en', fallback: true, origin: 'english-fallback' };
}
