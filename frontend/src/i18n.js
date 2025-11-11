import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import bg from './locales/bg.json';

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources: {
      en: {
        translation: en
      },
      bg: {
        translation: bg
      }
    },
    fallbackLng: 'bg', // Default to Bulgarian
    lng: 'bg', // Bulgarian as default
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes by default
    },
    
    detection: {
      // Order of language detection
      order: ['localStorage', 'navigator'],
      // Cache user language preference
      caches: ['localStorage'],
      lookupLocalStorage: 'lang'
    }
  });

export default i18n;
