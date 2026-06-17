import { useState } from 'react';
import { I18nProvider, useI18n } from './i18n';
import { Item, Settings } from './engine/types';
import { SearchBar } from './components/SearchBar';
import { SettingsPanel } from './components/SettingsPanel';
import { ResultsTable } from './components/ResultsTable';
import { LanguageToggle } from './components/LanguageToggle';

const DEFAULT_SETTINGS: Settings = {
  artisan: false,
  tiller: false,
  quality: 'normal',
  rankBy: 'total',
};

function Shell() {
  const { t } = useI18n();
  const [item, setItem] = useState<Item | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  return (
    <div className="min-h-full p-5 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-end justify-between mb-4">
        <div>
          <h1 className="text-3xl text-parchment-light drop-shadow-[2px_2px_0_#2c1a0e]">
            🌾 {t.appTitle}
          </h1>
          <p className="text-parchment/80">{t.tagline}</p>
        </div>
        <LanguageToggle />
      </header>

      {/* Search */}
      <div className="mb-5">
        <SearchBar onPick={setItem} />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5 items-start">
        <SettingsPanel settings={settings} onChange={setSettings} />
        {item ? (
          <ResultsTable item={item} settings={settings} />
        ) : (
          <div className="sv-frame">
            <div className="sv-panel p-8 text-center text-ink-soft">{t.pickPrompt}</div>
          </div>
        )}
      </div>

      {/* Attribution — unofficial, non-commercial fan project. */}
      <footer className="mt-6 text-center text-parchment/60 text-xs">
        Unofficial fan project · Stardew Valley © ConcernedApe · data &amp; sprites from the
        Stardew Valley Wiki (CC BY-NC-SA)
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  );
}
