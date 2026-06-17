// Validates the seed dataset and confirms every item yields routes in both languages.
// Run: tsx src/data/items.seed.test.ts
import assert from 'node:assert/strict';
import { ITEMS } from './items';
import { computeRoutes } from '../engine/compute';
import { Settings } from '../engine/types';

const s: Settings = { artisan: true, tiller: true, quality: 'gold', rankBy: 'total' };

console.log(`seed dataset: ${ITEMS.length} items`);
let issues = 0;

for (const item of ITEMS) {
  assert.ok(/[一-鿿]/.test(item.nameZh), `${item.id}: nameZh should be Chinese`);
  const routes = computeRoutes(item, s);
  // Every item must at least be sellable raw.
  assert.ok(routes.some((r) => r.machineId === 'raw'), `${item.id}: no raw route`);
  assert.ok(routes.length >= 1, `${item.id}: no routes`);
  // Names present in both languages for every route.
  for (const r of routes) {
    if (!r.outputNameEn || !r.outputNameZh) {
      console.warn(`  ! ${item.id} via ${r.machineId}: missing a localized name`);
      issues++;
    }
  }
}

assert.equal(issues, 0, `${issues} localized-name issues`);
console.log(`✅ all ${ITEMS.length} seed items validate and compute routes in EN + 中文`);
