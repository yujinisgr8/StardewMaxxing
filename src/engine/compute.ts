// Turns a raw Item + Settings into a ranked list of ProcessRoutes for the UI.
import { Item, Settings, ProcessRoute, RouteResult, QUALITY_MULT } from './types';
import { MACHINES } from './machines';

const ARTISAN_MULT = 1.4; // Artisan profession: +40%
const TILLER_MULT = 1.1; // Tiller profession: +10%

/** Apply Settings (professions + input quality) to a machine's raw RouteResult. */
function priceRoute(r: RouteResult, s: Settings): ProcessRoute {
  let mult = 1;
  if (r.artisanGood && s.artisan) mult *= ARTISAN_MULT;
  if (r.tillerEligible && s.tiller) mult *= TILLER_MULT;
  if (r.qualitySensitive) mult *= QUALITY_MULT[s.quality];

  const value = Math.round(r.baseValue * mult);
  const perInputValue = value / r.inputCount;
  const goldPerDay = r.days > 0 ? perInputValue / r.days : null;

  return { ...r, value, perInputValue, goldPerDay, best: false };
}

/**
 * Rank every processing route for `item` under `settings`.
 * - rankBy 'total'  → by gold per single input item (fair across batch sizes).
 * - rankBy 'perDay' → by gold/day per input; instant "sell raw" (days 0) sorts last
 *   since it has no rate, but is always kept visible as the baseline.
 */
export function computeRoutes(item: Item, settings: Settings): ProcessRoute[] {
  const routes = MACHINES.map((m) => m.transform(item))
    .filter((r): r is RouteResult => r !== null)
    .map((r) => priceRoute(r, settings));

  routes.sort((a, b) => {
    if (settings.rankBy === 'perDay') {
      // nulls (instant raw) go last
      if (a.goldPerDay === null && b.goldPerDay === null) return b.perInputValue - a.perInputValue;
      if (a.goldPerDay === null) return 1;
      if (b.goldPerDay === null) return -1;
      return b.goldPerDay - a.goldPerDay;
    }
    return b.perInputValue - a.perInputValue;
  });

  if (routes.length > 0) routes[0].best = true;
  return routes;
}
