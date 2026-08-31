// Turns a raw Item + Settings into a ranked list of ProcessRoutes for the UI.
import { Item, Settings, ProcessRoute, RouteResult, AppliedBonus, QUALITY_MULT } from './types';
import { MACHINES } from './machines';

const ARTISAN_MULT = 1.4; // Artisan profession: +40%
const TILLER_MULT = 1.1; // Tiller profession: +10%
const RANCHER_MULT = 1.2; // Rancher profession: +20%
const FISHER_MULT = 1.25; // Fisher profession: +25% (fish)
const ANGLER_MULT = 1.5; // Angler profession: +50% (fish); supersedes Fisher (no stacking)

// Opportunity cost of consumable extra inputs, at their wiki sell value.
const EXTRA_INPUT_COST: Record<string, number> = { coal: 15 }; // Fish Smoker burns 1 coal/fish

/** Apply Settings (professions + input quality) to a machine's raw RouteResult. */
function priceRoute(r: RouteResult, s: Settings): ProcessRoute {
  // Derive active price-affecting professions from the skill-tree selection.
  // The tree guarantees Artisan ⇒ Tiller branch, so Tiller's bonus stacks with it.
  const tiller = s.level5 === 'tiller';
  const rancher = s.level5 === 'rancher';
  const artisan = s.level10 === 'artisan';
  const fisher = s.fishingLevel5 === 'fisher';
  const angler = s.fishingLevel10 === 'angler';

  // Collect the bonuses that actually fire so the UI can show what's stacking on a route
  // (Smoked Fish is the case that stacks two: a fishing bonus AND Artisan).
  const applied: AppliedBonus[] = [];
  if (r.artisanGood && artisan) applied.push({ key: 'artisan', mult: ARTISAN_MULT });
  if (r.tillerEligible && tiller) applied.push({ key: 'tiller', mult: TILLER_MULT });
  if (r.rancherEligible && rancher) applied.push({ key: 'rancher', mult: RANCHER_MULT });
  // Fishing professions don't stack with each other: Angler (+50%) supersedes Fisher (+25%).
  if (r.fishEligible && angler) applied.push({ key: 'angler', mult: ANGLER_MULT });
  else if (r.fishEligible && fisher) applied.push({ key: 'fisher', mult: FISHER_MULT });

  let mult = applied.reduce((m, b) => m * b.mult, 1);
  if (r.qualitySensitive) mult *= QUALITY_MULT[s.quality];

  const value = Math.round(r.baseValue * mult);
  // Subtract any consumable cost (e.g. the Fish Smoker's coal) so routes compare on NET gold.
  const extraCost = (r.extraInputs ?? []).reduce((sum, id) => sum + (EXTRA_INPUT_COST[id] ?? 0), 0);
  const perInputValue = (value - extraCost) / r.inputCount;
  // Whole-day collection model: a machine is emptied/refilled once each morning, so a
  // job ties it up for ⌈days⌉ whole "collect next morning" slots (Wine 6.25 → 7).
  const effectiveDays = r.days > 0 ? Math.ceil(r.days) : 0;
  const goldPerDay = effectiveDays > 0 ? perInputValue / effectiveDays : null;

  return {
    ...r,
    value,
    extraCost,
    perInputValue,
    effectiveDays,
    goldPerDay,
    appliedBonuses: applied,
    best: false,
  };
}

/**
 * Rank every processing route for `item` under `settings`.
 * - rankBy 'total'  → by gold per single input item (fair across batch sizes).
 * - rankBy 'perDay' → by gold/day. Instant "sell raw" has no machine time, so its rate is its
 *   full value (you bank it immediately) — this stops a slower route that nets LESS than selling
 *   raw from being ranked above it.
 */
export function computeRoutes(item: Item, settings: Settings): ProcessRoute[] {
  const routes = MACHINES.map((m) => m.transform(item))
    .filter((r): r is RouteResult => r !== null)
    .map((r) => priceRoute(r, settings));

  // In gold/day mode an instant route (days 0 → goldPerDay null) is worth its whole value "today",
  // so compare it at its per-input value against the timed routes' gold/day.
  const rateOf = (r: ProcessRoute) => (r.goldPerDay !== null ? r.goldPerDay : r.perInputValue);
  routes.sort((a, b) =>
    settings.rankBy === 'perDay' ? rateOf(b) - rateOf(a) : b.perInputValue - a.perInputValue,
  );

  if (routes.length > 0) routes[0].best = true;
  return routes;
}

/**
 * Which profession trees can change ANY route's value for this item — drives which
 * profession selectors the Settings panel shows. Note a fish is BOTH fishing-relevant
 * (raw/smoked) and farming-relevant, because Artisan boosts Smoked Fish & Caviar.
 */
export function profRelevance(item: Item): { farming: boolean; fishing: boolean } {
  const routes = MACHINES.map((m) => m.transform(item)).filter(
    (r): r is RouteResult => r !== null,
  );
  return {
    farming: routes.some((r) => r.tillerEligible || r.rancherEligible || r.artisanGood),
    fishing: routes.some((r) => r.fishEligible === true),
  };
}
