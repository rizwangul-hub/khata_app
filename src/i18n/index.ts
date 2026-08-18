import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import en from './en.json';
import ur from './ur.json';

const resources = {
  en: { translation: en },
  ur: { translation: ur },
};

// Fallback to en if no locale found
const deviceLanguage = getLocales()[0]?.languageCode || 'en';
const initialLanguage = ['en', 'ur'].includes(deviceLanguage) ? deviceLanguage : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

// Setup RTL based on language
export const setupRTL = (language: string) => {
  const isRTL = language === 'ur';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
    // Note: App restart is typically required for RTL changes to take full effect in React Native,
    // but Expo handles this decently with expo-updates or react-native-restart in production.
  }
};

setupRTL(initialLanguage);

export default i18n;
