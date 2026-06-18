import { Settings, Quality, Level5Prof, Level10Prof, FishL5, FishL10 } from '../engine/types';
import { useI18n } from '../i18n';

const QUALITIES: Quality[] = ['normal', 'silver', 'gold', 'iridium'];

export function SettingsPanel({
  settings,
  onChange,
  relevance = { farming: true, fishing: true },
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
  relevance?: { farming: boolean; fishing: boolean };
}) {
  const { t } = useI18n();
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const qLabel: Record<Quality, string> = {
    normal: t.qualityNormal,
    silver: t.qualitySilver,
    gold: t.qualityGold,
    iridium: t.qualityIridium,
  };

  // Stardew farming skill tree: Level 5 is one mutually-exclusive pick; Level 10
  // branches off it. Only Tiller/Rancher/Artisan change sell value (the rest are
  // growth/production-speed perks, shown so the choice is complete and informative).
  const level5Opts: { v: Level5Prof; label: string }[] = [
    { v: 'none', label: t.profNone },
    { v: 'tiller', label: t.tiller },
    { v: 'rancher', label: t.rancher },
  ];

  const level10Opts: { v: Level10Prof; label: string }[] =
    settings.level5 === 'tiller'
      ? [
          { v: 'none', label: t.profNone },
          { v: 'artisan', label: t.artisan },
          { v: 'agriculturist', label: t.agriculturist },
        ]
      : settings.level5 === 'rancher'
      ? [
          { v: 'none', label: t.profNone },
          { v: 'coopmaster', label: t.coopmaster },
          { v: 'shepherd', label: t.shepherd },
        ]
      : [];

  // Fishing skill tree (independent of farming). Only Fisher/Angler change sell value.
  const fishL5Opts: { v: FishL5; label: string }[] = [
    { v: 'none', label: t.profNone },
    { v: 'fisher', label: t.fisher },
    { v: 'trapper', label: t.trapper },
  ];

  const fishL10Opts: { v: FishL10; label: string }[] =
    settings.fishingLevel5 === 'fisher'
      ? [
          { v: 'none', label: t.profNone },
          { v: 'angler', label: t.angler },
          { v: 'pirate', label: t.pirate },
        ]
      : settings.fishingLevel5 === 'trapper'
      ? [
          { v: 'none', label: t.profNone },
          { v: 'mariner', label: t.mariner },
          { v: 'luremaster', label: t.luremaster },
        ]
      : [];

  const hints: Record<string, string> = {
    tiller: t.tillerHint,
    rancher: t.rancherHint,
    artisan: t.artisanHint,
    agriculturist: t.agriculturistHint,
    coopmaster: t.coopmasterHint,
    shepherd: t.shepherdHint,
    fisher: t.fisherHint,
    trapper: t.trapperHint,
    angler: t.anglerHint,
    pirate: t.pirateHint,
    mariner: t.marinerHint,
    luremaster: t.luremasterHint,
  };

  return (
    <div className="sv-frame">
      <div className="sv-panel p-4 space-y-4">
        <h2 className="text-lg">{t.settings}</h2>

        {/* Farming professions — shown only when they can affect this item's routes. */}
        {relevance.farming && (
          <div>
            <div className="text-ink-soft text-sm mb-1">{t.professions}</div>
            <div className="space-y-2">
              <ProfSelect
                label={t.level5}
                value={settings.level5}
                options={level5Opts}
                hint={hints[settings.level5]}
                // Switching the Lvl-5 branch invalidates the Lvl-10 pick → reset it.
                onChange={(v) => set({ level5: v as Level5Prof, level10: 'none' })}
              />
              {settings.level5 !== 'none' && (
                <ProfSelect
                  label={t.level10}
                  value={settings.level10}
                  options={level10Opts}
                  hint={hints[settings.level10]}
                  onChange={(v) => set({ level10: v as Level10Prof })}
                />
              )}
            </div>
          </div>
        )}

        {/* Fishing professions — separate skill tree; shown for fish (raw & smoked). */}
        {relevance.fishing && (
          <div>
            <div className="text-ink-soft text-sm mb-1">{t.fishingProfessions}</div>
            <div className="space-y-2">
              <ProfSelect
                label={t.level5}
                value={settings.fishingLevel5}
                options={fishL5Opts}
                hint={hints[settings.fishingLevel5]}
                onChange={(v) => set({ fishingLevel5: v as FishL5, fishingLevel10: 'none' })}
              />
              {settings.fishingLevel5 !== 'none' && (
                <ProfSelect
                  label={t.level10}
                  value={settings.fishingLevel10}
                  options={fishL10Opts}
                  hint={hints[settings.fishingLevel10]}
                  onChange={(v) => set({ fishingLevel10: v as FishL10 })}
                />
              )}
            </div>
          </div>
        )}

        {/* Item that no profession affects (e.g. plain Roe). */}
        {!relevance.farming && !relevance.fishing && (
          <div className="text-ink-soft text-sm">{t.noProfForItem}</div>
        )}

        {/* Input quality */}
        <div>
          <div className="text-ink-soft text-sm mb-1">{t.quality}</div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUALITIES.map((q) => (
              <button
                key={q}
                className={`sv-btn text-sm ${settings.quality === q ? 'sv-btn--on' : ''}`}
                onClick={() => set({ quality: q })}
              >
                {qLabel[q]}
              </button>
            ))}
          </div>
        </div>

        {/* Ranking */}
        <div>
          <div className="text-ink-soft text-sm mb-1">{t.rankBy}</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              className={`sv-btn text-sm ${settings.rankBy === 'total' ? 'sv-btn--on' : ''}`}
              onClick={() => set({ rankBy: 'total' })}
            >
              {t.rankTotal}
            </button>
            <button
              className={`sv-btn text-sm ${settings.rankBy === 'perDay' ? 'sv-btn--on' : ''}`}
              onClick={() => set({ rankBy: 'perDay' })}
            >
              {t.rankPerDay}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A labeled native dropdown styled as an inset parchment slot, with a benefit hint. */
function ProfSelect({
  label,
  value,
  options,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  options: { v: string; label: string }[];
  hint?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-ink-soft text-xs mb-0.5">{label}</label>
      <select
        className="sv-input w-full text-sm cursor-pointer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <div className="text-ink-soft text-xs mt-0.5">{hint}</div>}
    </div>
  );
}
