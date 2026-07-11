import i18next, { type i18n } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { browser } from 'wxt/browser';
import { settingsRepository, type LanguageSetting } from '@/lib/storage/settings-repository';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';

const RESOURCES = {
  en: { translation: en },
  ru: { translation: ru },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
  pt: { translation: pt },
  ja: { translation: ja },
  zh: { translation: zh },
} as const;

export type SupportedLanguage = keyof typeof RESOURCES;

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  ru: 'Русский',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  pt: 'Português',
  ja: '日本語',
  zh: '中文',
};

export function resolveLanguage(setting: LanguageSetting): string {
  if (setting !== 'auto') return setting;
  const uiLanguage = browser.i18n.getUILanguage().split('-')[0];
  return uiLanguage in RESOURCES ? uiLanguage : 'en';
}

export async function initI18n(): Promise<i18n> {
  const settings = await settingsRepository.get();
  const instance = i18next.createInstance();
  await instance.use(initReactI18next).init({
    resources: RESOURCES,
    lng: resolveLanguage(settings.language),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  settingsRepository.onChanged((next) => {
    void instance.changeLanguage(resolveLanguage(next.language));
  });
  return instance;
}
