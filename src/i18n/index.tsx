import { createContext, useContext, useState, ReactNode } from 'react';
import { STRINGS, Lang } from './strings';
import { Item } from '../engine/types';

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof STRINGS)['en'];
  /** Pick the right-language name for an item or any {nameEn,nameZh} pair. */
  name: (x: { nameEn: string; nameZh: string }) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const value: I18nValue = {
    lang,
    setLang,
    t: STRINGS[lang],
    name: (x) => (lang === 'zh' ? x.nameZh : x.nameEn),
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Convenience: localized item name. */
export const itemName = (item: Item, lang: Lang) => (lang === 'zh' ? item.nameZh : item.nameEn);
