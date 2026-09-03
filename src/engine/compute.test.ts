// Lightweight engine sanity checks. Run with: npm test  (tsx src/engine/compute.test.ts)
import assert from 'node:assert/strict';
import { Item, Settings } from './types';
import { computeRoutes, profRelevance } from './compute';

const base: Settings = {
  level5: 'none', level10: 'none', fishingLevel5: 'none', fishingLevel10: 'none',
  quality: 'normal', rankBy: 'total',
};

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
const milk: Item = {
  id: 'milk', nameEn: 'Milk', nameZh: '牛奶',
  basePrice: 125, category: 'milk', tags: [],
};
const egg: Item = {
  id: 'egg', nameEn: 'Egg', nameZh: '鸡蛋',
  basePrice: 50, category: 'egg', tags: [],
};
const largeEgg: Item = {
  id: 'large_egg', nameEn: 'Large Egg', nameZh: '大鸡蛋',
  basePrice: 95, category: 'egg', tags: [],
};
const duckEgg: Item = {
  id: 'duck_egg', nameEn: 'Duck Egg', nameZh: '鸭蛋',
  basePrice: 95, category: 'egg', tags: ['duck_egg'],
};
const largeMilk: Item = {
  id: 'large_milk', nameEn: 'Large Milk', nameZh: '大牛奶',
  basePrice: 190, category: 'milk', tags: [],
};
const largeGoatMilk: Item = {
  id: 'large_goat_milk', nameEn: 'Large Goat Milk', nameZh: '大羊奶',
  basePrice: 345, category: 'milk', tags: ['goat_milk'],
};
const hops: Item = {
  id: 'hops', nameEn: 'Hops', nameZh: '啤酒花',
  basePrice: 25, category: 'vegetable', tags: ['hops'],
};
const plainRoe: Item = {
  id: 'roe', nameEn: 'Roe', nameZh: '鱼籽',
  basePrice: 30, category: 'roe', tags: [],
};
const sturgeonRoe: Item = {
  id: 'sturgeon_roe', nameEn: 'Sturgeon Roe', nameZh: '鲟鱼籽',
  basePrice: 100, category: 'roe', tags: ['sturgeon_roe'],
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
  // Artisan lives in the Tiller branch (Lvl 5 Tiller → Lvl 10 Artisan).
  assert.equal(route(starfruit, { ...base, level5: 'tiller', level10: 'artisan' }, 'keg').value, 3150);
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
  assert.equal(route(starfruit, { ...base, level5: 'tiller' }, 'raw').value, 825);
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

check('Fish itself has NO roe routes — only Sell raw + Smoker (roe is its own item)', () => {
  assert.equal(route(bream, base, 'smoker').value, 90); // 2 × 45
  const ids = computeRoutes(bream, base).map((r) => r.machineId);
  assert.deepEqual([...ids].sort(), ['raw', 'smoker']);
  assert.equal(route(sturgeon, base, 'smoker').value, 400);
});
check('Roe items: Bream Roe (52) → Aged Roe 104; Sturgeon Roe → Caviar 500', () => {
  const breamRoe: Item = {
    id: 'bream_roe', nameEn: 'Bream Roe', nameZh: '鲷鱼鱼籽', basePrice: 52, category: 'roe', tags: [],
  };
  assert.equal(route(breamRoe, base, 'jar').value, 104); // Aged Roe = 2 × 52
  assert.equal(route(sturgeonRoe, base, 'jar').value, 500); // Caviar, fixed
  assert.equal(route(sturgeonRoe, base, 'jar').outputNameEn, 'Caviar');
});

check('Rancher +20% → raw Milk 125 → 150; Cheese (artisan good) unaffected', () => {
  const ranch: Settings = { ...base, level5: 'rancher' };
  assert.equal(route(milk, ranch, 'raw').value, 150); // 125 × 1.2
  assert.equal(route(milk, ranch, 'cheese').value, 230); // processed → Artisan, not Rancher
});
check('Whole-day model: Wine 6.25 days → effectiveDays 7, gold/day = value ÷ 7', () => {
  const wine = route(starfruit, base, 'keg');
  assert.equal(wine.effectiveDays, 7);
  assert.equal(wine.goldPerDay, 2250 / 7);
});
check('Whole-day model: Dehydrator (exactly 1 day) stays effectiveDays 1', () => {
  assert.equal(route(starfruit, base, 'dehydrator').effectiveDays, 1);
});

check('Large Egg → GOLD-quality Mayo = 285 (regular egg stays 190)', () => {
  assert.equal(route(largeEgg, base, 'mayo').value, 285); // 190 × 1.5
  assert.equal(route(egg, base, 'mayo').value, 190);
});
check('Large Milk → gold Cheese 345; Large Goat Milk → gold Goat Cheese 600', () => {
  assert.equal(route(largeMilk, base, 'cheese').value, 345); // 230 × 1.5
  assert.equal(route(largeGoatMilk, base, 'cheese').value, 600); // 400 × 1.5
  assert.equal(route(milk, base, 'cheese').value, 230); // regular milk unchanged
});
check('Rancher boosts RAW Duck Egg (+20%) but NOT Duck Mayo (artisan good)', () => {
  const ranch: Settings = { ...base, level5: 'rancher' };
  assert.equal(route(duckEgg, ranch, 'raw').value, 114); // 95 × 1.2
  assert.equal(route(duckEgg, ranch, 'mayo').value, 375); // artisan good → no Rancher bonus
});
check('gold/day: instant Sell raw outranks a slower route that nets less (not buried last)', () => {
  // Iridium + Rancher Milk: raw 300 beats Cheese 230 — raw must rank FIRST, not last.
  const s: Settings = {
    level5: 'rancher', level10: 'none', fishingLevel5: 'none', fishingLevel10: 'none',
    quality: 'iridium', rankBy: 'perDay',
  };
  const ranked = computeRoutes(milk, s);
  assert.equal(route(milk, s, 'raw').value, 300); // 125 × 2 × 1.2
  assert.equal(ranked[0].machineId, 'raw');
});

check('Fish Smoker deducts 1 coal (15g): Bream smoked sells 90g, nets 75g', () => {
  const r = route(bream, base, 'smoker');
  assert.equal(r.value, 90); // gross sell value of Smoked Fish (unchanged, matches wiki)
  assert.equal(r.extraCost, 15); // 1 coal
  assert.equal(r.perInputValue, 75); // 90 − 15 coal = net
  assert.equal(route(starfruit, base, 'keg').extraCost, 0); // no extra cost on other routes
});

check('Fisher +25% / Angler +50% on raw fish; do NOT stack', () => {
  const fisher: Settings = { ...base, fishingLevel5: 'fisher' };
  const angler: Settings = { ...base, fishingLevel5: 'fisher', fishingLevel10: 'angler' };
  assert.equal(route(bream, base, 'raw').value, 45);
  assert.equal(route(bream, fisher, 'raw').value, 56); // 45 × 1.25 = 56.25 → 56
  assert.equal(route(bream, angler, 'raw').value, 68); // 45 × 1.5 = 67.5 → 68 (NOT ×1.25×1.5)
});
check('Smoked Fish gets fish + Artisan bonuses (stack) and is quality-sensitive', () => {
  // Angler (fishing) + Artisan (farming) both apply to smoked fish.
  const both: Settings = { ...base, level5: 'tiller', level10: 'artisan', fishingLevel5: 'fisher', fishingLevel10: 'angler' };
  // 45×2 = 90 base; ×1.5 Angler ×1.4 Artisan = 189; value is gross, perInputValue nets coal.
  assert.equal(route(bream, both, 'smoker').value, 189);
  assert.equal(route(bream, both, 'smoker').perInputValue, 174); // 189 − 15 coal
  // Iridium fish → quality retained: 90 × 2 = 180 (base settings + iridium, no professions)
  assert.equal(route(bream, { ...base, quality: 'iridium' }, 'smoker').value, 180);
});
check('Fishing professions do NOT touch Roe (no category)', () => {
  const angler: Settings = { ...base, fishingLevel5: 'fisher', fishingLevel10: 'angler' };
  assert.equal(route(plainRoe, angler, 'raw').value, 30); // raw roe unchanged by Angler
  assert.equal(route(plainRoe, angler, 'jar').value, 60); // Aged Roe = 2 × 30, no fish bonus
});

check('profRelevance: which profession trees apply per item', () => {
  assert.deepEqual(profRelevance(parsnip), { farming: true, fishing: false }); // crop
  assert.deepEqual(profRelevance(hops), { farming: true, fishing: false }); // crop → Pale Ale, NO fishing
  assert.deepEqual(profRelevance(milk), { farming: true, fishing: false }); // animal product
  assert.deepEqual(profRelevance(bream), { farming: true, fishing: true }); // fish: +Artisan on smoked
  assert.deepEqual(profRelevance(plainRoe), { farming: false, fishing: false }); // nothing affects roe
  assert.deepEqual(profRelevance(sturgeonRoe), { farming: true, fishing: false }); // Caviar is artisan
});

check('Preserves Jar / Keg reject ZERO-ENERGY forage (Daffodil), but accept the rest', () => {
  // The wiki restricts both machines to *positive energy* forage. Daffodil restores 0 energy,
  // so "Pickled Daffodil" and "Daffodil Juice" do not exist in game — selling raw is its only
  // route. Regression guard: the rules used to accept all forage unconditionally.
  const daffodil: Item = {
    id: 'daffodil', nameEn: 'Daffodil', nameZh: '黄水仙',
    basePrice: 30, category: 'forage', tags: ['edible', 'zero_energy'],
  };
  const dandelion: Item = {
    id: 'dandelion', nameEn: 'Dandelion', nameZh: '蒲公英',
    basePrice: 40, category: 'forage', tags: ['edible'], // 25 energy → still allowed
  };
  assert.deepEqual(computeRoutes(daffodil, base).map((r) => r.machineId), ['raw']);
  assert.deepEqual(computeRoutes(dandelion, base).map((r) => r.machineId).sort(), ['jar', 'keg', 'raw']);
  assert.equal(route(dandelion, base, 'jar').value, 130); // 2 × 40 + 50
});

console.log(`\n${passed} checks passed ✅`);
