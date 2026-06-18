import { useMemo } from 'react';
import { Item, Settings } from '../engine/types';
import { computeRoutes } from '../engine/compute';
import { MACHINES } from '../engine/machines';
import { useI18n } from '../i18n';
import { ItemIcon } from './ItemIcon';

const MACHINE = Object.fromEntries(MACHINES.map((m) => [m.id, m]));
const g = (n: number) => Math.round(n).toLocaleString('en-US');

export function ResultsTable({ item, settings }: { item: Item; settings: Settings }) {
  const { t, lang, name } = useI18n();
  const routes = useMemo(() => computeRoutes(item, settings), [item, settings]);

  const machineName = (id: string) => {
    const m = MACHINE[id];
    return m ? (lang === 'zh' ? m.nameZh : m.nameEn) : id;
  };

  return (
    <div className="sv-frame">
      <div className="sv-panel p-3">
        {/* Selected item header */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <ItemIcon id={item.id} category={item.category} size={36} />
          <div>
            <div className="text-xl leading-tight">{name(item)}</div>
            <div className="text-ink-soft text-sm">
              {item.nameEn} · {item.nameZh} · <span className="sv-coin">{g(item.basePrice)}g</span>{' '}
              {t.rawValueNote}
            </div>
          </div>
        </div>

        {/* Column headers — the active sort metric is highlighted with a ▼. */}
        <div className="grid grid-cols-[1.3fr_1.6fr_0.9fr_0.9fr] gap-2 px-2 pb-1 text-ink-soft text-sm border-b-2 border-wood/40">
          <span>{t.colRoute}</span>
          <span>{t.colOutput}</span>
          <span
            className={`text-right ${settings.rankBy === 'total' ? 'font-bold text-leaf-dark' : ''}`}
            title={t.explainTotal}
          >
            {t.colValue}
            {settings.rankBy === 'total' && ' ▼'}
          </span>
          <span
            className={`text-right ${settings.rankBy === 'perDay' ? 'font-bold text-leaf-dark' : ''}`}
            title={t.explainPerDay}
          >
            {t.colPerDay}
            {settings.rankBy === 'perDay' && ' ▼'}
          </span>
        </div>

        {/* Rows */}
        <div className="mt-1 space-y-1">
          {routes.map((r, idx) => {
            const batched = r.inputCount > 1;
            return (
              <div
                key={`${r.machineId}-${r.outputId}-${idx}`}
                className={`grid grid-cols-[1.3fr_1.6fr_0.9fr_0.9fr] gap-2 items-center px-2 py-1.5 rounded-sm sv-panel ${
                  r.best ? 'sv-selected' : ''
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {r.best && (
                    <span className="text-xs bg-leaf-dark text-parchment-light px-1 rounded-sm">
                      {t.best}
                    </span>
                  )}
                  {machineName(r.machineId)}
                </span>

                <span className="truncate" title={lang === 'zh' ? r.outputNameZh : r.outputNameEn}>
                  {lang === 'zh' ? r.outputNameZh : r.outputNameEn}
                  {batched && <span className="text-ink-soft text-xs"> · {t.batch(r.inputCount)}</span>}
                </span>

                <span className="text-right">
                  {/* Emphasize this metric only when it's the active sort; dim it otherwise. */}
                  <span
                    className={settings.rankBy === 'total' ? 'sv-coin justify-end' : 'text-ink-soft text-sm'}
                  >
                    {g(r.perInputValue)}g
                  </span>
                  {batched && (
                    <div className="text-ink-soft text-xs">
                      ×{r.inputCount} → {g(r.value)}g
                    </div>
                  )}
                  {r.extraCost > 0 && (
                    <div className="text-ink-soft text-xs">
                      {g(r.value / r.inputCount)}g − {g(r.extraCost)}g {t.coal}
                    </div>
                  )}
                </span>

                <span className="text-right">
                  {r.goldPerDay === null ? (
                    <span className="text-ink-soft text-sm">{t.instant}</span>
                  ) : (
                    <>
                      <span
                        className={settings.rankBy === 'perDay' ? 'sv-coin justify-end' : 'text-ink-soft text-sm'}
                      >
                        {g(r.goldPerDay)}
                      </span>
                      {/* Whole "collect next morning" days; tooltip shows the raw game time. */}
                      <div className="text-ink-soft text-xs" title={t.actualTime(round1(r.days))}>
                        {t.days(r.effectiveDays)}
                      </div>
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Metric legend — what the two ranking numbers mean (gold/day intuition). */}
        <div className="mt-3 pt-2 border-t-2 border-wood/40 text-ink-soft text-xs space-y-1">
          <div>{t.explainTotal}</div>
          <div>{t.explainPerDay}</div>
        </div>
      </div>
    </div>
  );
}

const round1 = (n: number) => Math.round(n * 10) / 10;
