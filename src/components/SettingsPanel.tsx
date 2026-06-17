import { Settings, Quality } from '../engine/types';
import { useI18n } from '../i18n';

const QUALITIES: Quality[] = ['normal', 'silver', 'gold', 'iridium'];

export function SettingsPanel({
  settings,
  onChange,
}: {
  settings: Settings;
  onChange: (s: Settings) => void;
}) {
  const { t } = useI18n();
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const qLabel: Record<Quality, string> = {
    normal: t.qualityNormal,
    silver: t.qualitySilver,
    gold: t.qualityGold,
    iridium: t.qualityIridium,
  };

  return (
    <div className="sv-frame">
      <div className="sv-panel p-4 space-y-4">
        <h2 className="text-lg">{t.settings}</h2>

        {/* Professions */}
        <div>
          <div className="text-ink-soft text-sm mb-1">{t.professions}</div>
          <div className="space-y-2">
            <Toggle
              label={t.artisan}
              hint={t.artisanHint}
              on={settings.artisan}
              onClick={() => set({ artisan: !settings.artisan })}
            />
            <Toggle
              label={t.tiller}
              hint={t.tillerHint}
              on={settings.tiller}
              onClick={() => set({ tiller: !settings.tiller })}
            />
          </div>
        </div>

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

function Toggle({
  label,
  hint,
  on,
  onClick,
}: {
  label: string;
  hint: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button className="w-full text-left" onClick={onClick} title={hint}>
      <div className="flex items-center gap-2">
        <span
          className={`inline-grid place-items-center w-5 h-5 border-2 border-wood-dark rounded-sm shrink-0 ${
            on ? 'bg-leaf' : 'bg-parchment-light'
          }`}
        >
          {on ? '✓' : ''}
        </span>
        <span>{label}</span>
      </div>
      <div className="text-ink-soft text-xs ml-7">{hint}</div>
    </button>
  );
}
