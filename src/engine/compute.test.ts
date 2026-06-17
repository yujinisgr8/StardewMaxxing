// Lightweight engine sanity checks. Run with: npm test  (tsx src/engine/compute.test.ts)
import assert from 'node:assert/strict';
import { Item, Settings } from './types';
import { computeRoutes } from './compute';

const base: Settings = { artisan: false, tiller: false, quality: 'normal', rankBy: 'total' };

const starfruit: Item = {
  id: 'starfruit', nameEn: 'Starfruit', nameZh: '星之果实',
  basePrice: 750, category: 'fruit', tags: ['edible'],
};
const parsnip: Item = {
  id: 'parsnip', nameEn: 'Parsnip', nameZh: '防风草',
  basePrice: 35, category: 'vegetable', tags: ['edible'],
};
const sturgeon: Item = {
  id: 'sturgeon', nameEn: 'Sturgeon', nameZh: '鲟鱼',
  basePrice: 200, category: 'fish', tags: ['caviar'],
};
const bream: Item = {
  id: 'bream', nameEn: 'Bream', nameZh: '鲷鱼',
  basePrice: 45, category: 'fish', tags: [],
};

let passed = 0;
const check = (name: string, fn: () => void) => {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
};

const route = (item: Item, s: Settings, machineId: string) =>
  computeRoutes(item, s).find((r) => r.machineId === machineId)!;

console.log('engine/compute');

check('Starfruit Wine = 3× base = 2250 (no professions)', () => {
  assert.equal(route(starfruit, base, 'keg').value, 2250);
});
check('Artisan +40% → Starfruit Wine = 3150', () => {
  assert.equal(route(starfruit, { ...base, artisan: true }, 'keg').value, 3150);
});
check('Starfruit Jelly = 2×750+50 = 1550', () => {
  assert.equal(route(starfruit, base, 'jar').value, 1550);
});
check('Starfruit Dried Fruit batch = 7.5×750+25 = 5650 (5 in)', () => {
  const r = route(starfruit, base, 'dehydrator');
  assert.equal(r.value, 5650);
  assert.equal(r.inputCount, 5);
  assert.equal(r.perInputValue, 1130);
});
check('Starfruit raw = base = 750, Tiller +10% → 825', () => {
  assert.equal(route(starfruit, base, 'raw').value, 750);
  assert.equal(route(starfruit, { ...base, tiller: true }, 'raw').value, 825);
});
check('Quality affects raw but NOT keg (kegs normalize quality)', () => {
  const irid: Settings = { ...base, quality: 'iridium' };
  assert.equal(route(starfruit, irid, 'raw').value, 1500); // 750×2
  assert.equal(route(starfruit, irid, 'keg').value, 2250); // unchanged
});
check('Cask Wine→Iridium = 3×750×2 = 4500 (most total gold, slow)', () => {
  assert.equal(route(starfruit, base, 'cask').value, 4500);
});
check('rankBy=total → Cask is best by raw gold; Keg(Wine) beats Jar & raw', () => {
  assert.equal(computeRoutes(starfruit, base)[0].machineId, 'cask');
  const ids = computeRoutes(starfruit, base).map((r) => r.machineId);
  assert.ok(ids.indexOf('keg') < ids.indexOf('jar'));
  assert.ok(ids.indexOf('keg') < ids.indexOf('raw'));
});
check('rankBy=perDay → Dehydrator wins; slow Cask drops below it', () => {
  const ranked = computeRoutes(starfruit, { ...base, rankBy: 'perDay' });
  assert.equal(ranked[0].machineId, 'dehydrator');
  const ids = ranked.map((r) => r.machineId);
  assert.ok(ids.indexOf('dehydrator') < ids.indexOf('cask'));
});
check('Low-value veg: Pickles (120) beat Juice (79) — Parsnip', () => {
  assert.equal(route(parsnip, base, 'jar').value, 120);
  assert.equal(route(parsnip, base, 'keg').value, 79);
  assert.equal(computeRoutes(parsnip, base)[0].machineId, 'jar');
});

check('Fish: Bream (45) → Roe 52, Aged Roe 104, Smoked Fish 90', () => {
  assert.equal(route(bream, base, 'pond').value, 52); // 30 + floor(45/2)=30+22
  assert.equal(route(bream, base, 'jar').value, 104); // 2 × 52
  assert.equal(route(bream, base, 'smoker').value, 90); // 2 × 45
});
check('Sturgeon (200) → Roe 130, Smoked 400, and roe→Caviar 500 (not Aged Roe)', () => {
  assert.equal(route(sturgeon, base, 'pond').value, 130); // 30 + 100
  assert.equal(route(sturgeon, base, 'smoker').value, 400);
  assert.equal(route(sturgeon, base, 'jar').value, 500); // Caviar, fixed
  assert.equal(route(sturgeon, base, 'jar').outputNameEn, 'Caviar');
});

console.log(`\n${passed} checks passed ✅`);
