import { Settings, Quality } from '../engine/types';
import { useI18n } from '../i18n';

const QUALITIES: Quality[] = ['normal', 'silver', 'gold', 'iridium'];

// The two skill trees collapsed to the picks that actually change sell value, so a full
// build is one click per skill. (Artisan ⇒ Tiller branch; Angler ⇒ Fisher branch. The
// growth/utility perks — Agriculturist, Shepherd, Pirate… — don't affect price, so they're
// omitted here.) Each pick still maps to the underlying level5/level10 settings.
type FarmPick = 'none' | 'tiller' | 'artisan' | 'rancher';
type FishPick = 'none' | 'fisher' | 'angler';

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

  const farmPick: FarmPick =
    settings.level5 === 'rancher'
      ? 'rancher'
      : settings.level10 === 'artisan'
      ? 'artisan'
      : settings.level5 === 'tiller'
      ? 'tiller'
      : 'none';
  const farmSet: Record<FarmPick, Partial<Settings>> = {
    none: { level5: 'none', level10: 'none' },
    tiller: { level5: 'tiller', level10: 'none' },
    artisan: { level5: 'tiller', level10: 'artisan' },
    rancher: { level5: 'rancher', level10: 'none' },
  };
  const farmOpts: { k: FarmPick; label: string }[] = [
    { k: 'none', label: t.pNone },
    { k: 'tiller', label: t.pTiller },
    { k: 'artisan', label: t.pArtisan },
    { k: 'rancher', label: t.pRancher },
  ];
  const farmHint =
    farmPick === 'tiller'
      ? t.tillerHint
      : farmPick === 'artisan'
      ? t.artisanHint
      : farmPick === 'rancher'
      ? t.rancherHint
      : '';

  const fishPick: FishPick =
    settings.fishingLevel10 === 'angler'
      ? 'angler'
      : settings.fishingLevel5 === 'fisher'
      ? 'fisher'
      : 'none';
  const fishSet: Record<FishPick, Partial<Settings>> = {
    none: { fishingLevel5: 'none', fishingLevel10: 'none' },
    fisher: { fishingLevel5: 'fisher', fishingLevel10: 'none' },
    angler: { fishingLevel5: 'fisher', fishingLevel10: 'angler' },
  };
  const fishOpts: { k: FishPick; label: string }[] = [
    { k: 'none', label: t.pNone },
    { k: 'fisher', label: t.pFisher },
    { k: 'angler', label: t.pAngler },
  ];
  const fishHint = fishPick === 'fisher' ? t.fisherHint : fishPick === 'angler' ? t.anglerHint : '';

  return (
    <div className="sv-frame">
      <div className="sv-panel p-4 space-y-4">
        <h2 className="text-lg">{t.settings}</h2>

        {/* Farming professions — one-click price picks; shown only when they affect this item. */}
        {relevance.farming && (
          <div>
            <div className="text-ink-soft text-sm mb-1">{t.professions}</div>
            <div className="grid grid-cols-2 gap-1.5">
              {farmOpts.map((o) => (
                <button
                  key={o.k}
                  className={`sv-btn text-sm ${farmPick === o.k ? 'sv-btn--on' : ''}`}
                  onClick={() => set(farmSet[o.k])}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {farmHint && <div className="text-ink-soft text-xs mt-1">{farmHint}</div>}
          </div>
        )}

        {/* Fishing professions */}
        {relevance.fishing && (
          <div>
            <div className="text-ink-soft text-sm mb-1">{t.fishingProfessions}</div>
            <div className="grid grid-cols-3 gap-1.5">
              {fishOpts.map((o) => (
                <button
                  key={o.k}
                  className={`sv-btn text-sm ${fishPick === o.k ? 'sv-btn--on' : ''}`}
                  onClick={() => set(fishSet[o.k])}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {fishHint && <div className="text-ink-soft text-xs mt-1">{fishHint}</div>}
          </div>
        )}

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
