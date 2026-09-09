import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector"; 
import { ar, en, fr } from "../translations";

interface TranslationResources {
  [key: string]: {
    translation: Record<string, string>;
  };
}

const resources: TranslationResources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr }, 
};

// Config for the language detector (copied from 1st snippet)
const detectorOptions = {
  order: ["cookie", "htmlTag"], // 1. Check cookie first, 2. Fallback to HTML tag
  lookupCookie: "lang",        // Tell it to look for your "lang" cookie
  caches: ["cookie"],          // Cache the language choice back into the cookie
};

if (typeof window !== "undefined") {
  i18n
    .use(LanguageDetector) 
    .use(initReactI18next)
    .init({
      resources,
      detection: detectorOptions,
      fallbackLng: "en",
      supportedLngs: ["en", "ar", "fr"], 
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
} else {
  // Server-side initialization (stays English to prevent SSR mismatch)
  i18n.use(initReactI18next).init({
    resources,
    fallbackLng: "en",
    lng: "en", 
    supportedLngs: ["en", "ar", "fr"],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;