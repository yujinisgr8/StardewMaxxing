// Whole-catalog smoke test: runs computeRoutes over EVERY item × a matrix of settings
// and asserts every field the ResultsTable renders is well-formed (no NaN/undefined, no
// throws). This catches data-level render bugs in `npm test` — before launching, let alone
// packaging, the app. Run: tsx src/engine/routes.smoke.test.ts
import assert from 'node:assert/strict';
import { ITEMS } from '../data/items';
import { computeRoutes } from './compute';
import { Settings } from './types';

const matrix: Settings[] = [
  { level5: 'none', level10: 'none', fishingLevel5: 'none', fishingLevel10: 'none', quality: 'normal', rankBy: 'total' },
  { level5: 'tiller', level10: 'artisan', fishingLevel5: 'fisher', fishingLevel10: 'angler', quality: 'iridium', rankBy: 'perDay' },
  { level5: 'rancher', level10: 'shepherd', fishingLevel5: 'fisher', fishingLevel10: 'none', quality: 'gold', rankBy: 'perDay' },
  { level5: 'tiller', level10: 'agriculturist', fishingLevel5: 'trapper', fishingLevel10: 'mariner', quality: 'silver', rankBy: 'total' },
];

console.log('engine/routes.smoke');

let routesChecked = 0;
for (const item of ITEMS) {
  for (const s of matrix) {
    // A throw here (e.g. a bad machine rule) fails the suite loudly with the item id.
    const routes = computeRoutes(item, s);
    assert.ok(routes.length >= 1, `${item.id}: no routes`);
    for (const r of routes) {
      const where = `${item.id} via ${r.machineId} (${JSON.stringify(s)})`;
      assert.ok(Number.isFinite(r.perInputValue), `${where}: perInputValue=${r.perInputValue}`);
      assert.ok(Number.isFinite(r.value), `${where}: value=${r.value}`);
      assert.ok(Number.isFinite(r.extraCost) && r.extraCost >= 0, `${where}: extraCost=${r.extraCost}`);
      assert.ok(Number.isFinite(r.effectiveDays), `${where}: effectiveDays=${r.effectiveDays}`);
      assert.ok(r.effectiveDays >= 0, `${where}: effectiveDays negative`);
      assert.ok(
        r.goldPerDay === null || Number.isFinite(r.goldPerDay),
        `${where}: goldPerDay=${r.goldPerDay}`,
      );
      assert.ok(r.inputCount > 0, `${where}: inputCount=${r.inputCount}`);
      assert.equal(typeof r.outputNameEn, 'string', `${where}: outputNameEn not a string`);
      assert.equal(typeof r.outputNameZh, 'string', `${where}: outputNameZh not a string`);
      routesChecked++;
    }
  }
}

console.log(
  `  ✓ ${ITEMS.length} items × ${matrix.length} settings → ${routesChecked} routes, all fields valid ✅`,
);
