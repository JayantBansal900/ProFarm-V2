export const languages = [
  { code: 'en', nativeName: 'English', englishName: 'English', direction: 'ltr' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', direction: 'ltr' },
  { code: 'te', nativeName: 'తెలుగు', englishName: 'Telugu', direction: 'ltr' },
  { code: 'ta', nativeName: 'தமிழ்', englishName: 'Tamil', direction: 'ltr' },
  { code: 'kn', nativeName: 'ಕನ್ನಡ', englishName: 'Kannada', direction: 'ltr' },
  { code: 'ml', nativeName: 'മലയാളം', englishName: 'Malayalam', direction: 'ltr' },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', direction: 'ltr' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', direction: 'ltr' },
  { code: 'gu', nativeName: 'ગુજરાતી', englishName: 'Gujarati', direction: 'ltr' },
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ', englishName: 'Punjabi', direction: 'ltr' },
  { code: 'or', nativeName: 'ଓଡ଼ିଆ', englishName: 'Odia', direction: 'ltr' },
  { code: 'as', nativeName: 'অসমীয়া', englishName: 'Assamese', direction: 'ltr' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', direction: 'rtl' },
] as const;
export type LanguageCode = (typeof languages)[number]['code'];
export const catalogVersion = '4f.1';
export function supportedLanguage(value: unknown): LanguageCode | undefined {
  if (typeof value !== 'string') return undefined;
  const code = value.trim().toLowerCase().replace('_', '-').split('-')[0];
  return languages.find(language => language.code === code)?.code;
}
export const languageRegistry = languages.map(language => ({ ...language,
  locale: `${language.code}-IN`, catalogAvailability: language.code === 'en' ? 'complete' : 'partial',
  contentAvailability: language.code === 'en' ? 'canonical' : 'names-and-labels',
  fallback: 'en', reviewStatus: language.code === 'en' ? 'canonical' : 'draft-needs-native-review',
}));
