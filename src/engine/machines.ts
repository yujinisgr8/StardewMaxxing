// Machine transform rules. Every formula, time, and multiplier here is taken from
// stardewvalleywiki.com (the source of truth). Times are stored in in-game minutes and
// converted to days via MINUTES_PER_DAY (1600). See CLAUDE.md for the per-machine sources.

import { Item, RouteResult, MINUTES_PER_DAY } from './types';

const days = (mins: number) => mins / MINUTES_PER_DAY;
const has = (item: Item, tag: string) => item.tags.includes(tag);
const isEdible = (item: Item) => !has(item, 'inedible');

// Roe a fish produces in a Fish Pond (wiki /Roe): 30 + floor(Base Fish Price / 2).
const roeValue = (item: Item) => 30 + Math.floor(item.basePrice / 2);
// Sturgeon is the only fish whose roe becomes Caviar (500g) instead of Aged Roe.
const makesCaviar = (item: Item) => has(item, 'caviar') || item.id === 'sturgeon';

export interface Machine {
  id: string;
  nameEn: string;
  nameZh: string;
  /** Returns the route this machine yields for the item, or null if it can't process it. */
  transform: (item: Item) => RouteResult | null;
}

// --- Flavored output name helpers (approximate the game's "X Wine" / "X 酒" naming) ---
const flavored = (
  item: Item,
  en: (n: string) => string,
  zh: (n: string) => string,
) => ({ outputNameEn: en(item.nameEn), outputNameZh: zh(item.nameZh) });

// ---------------------------------------------------------------------------
// Sell raw — the baseline every comparison needs.
// ---------------------------------------------------------------------------
const RAW: Machine = {
  id: 'raw',
  nameEn: 'Sell raw',
  nameZh: '直接出售',
  transform: (item) => ({
    machineId: 'raw',
    outputId: item.id,
    outputNameEn: item.nameEn,
    outputNameZh: item.nameZh,
    inputCount: 1,
    outputCount: 1,
    baseValue: item.basePrice,
    artisanGood: false,
    // Tiller: +10% to crops & flowers. Tree fruit and forage are NOT crops.
    tillerEligible:
      (item.category === 'vegetable' ||
        item.category === 'flower' ||
        (item.category === 'fruit' && !has(item, 'tree'))) &&
      true,
    // Rancher: +20% to raw animal products (milk, eggs, wool, truffle). Processed
    // animal goods (cheese, mayo, cloth, truffle oil) are Artisan, not Rancher.
    rancherEligible:
      item.category === 'milk' ||
      item.category === 'egg' ||
      item.category === 'wool' ||
      has(item, 'truffle'),
    fishEligible: item.category === 'fish', // Fisher/Angler boost raw fish
    qualitySensitive: true,
    days: 0,
  }),
};

// ---------------------------------------------------------------------------
// Keg — fruit→Wine (3×, 10000m), veg/forage→Juice (2.25×, 6000m), plus specials.
// ---------------------------------------------------------------------------
const KEG: Machine = {
  id: 'keg',
  nameEn: 'Keg',
  nameZh: '小桶',
  transform: (item) => {
    const base = (r: Partial<RouteResult>): RouteResult => ({
      machineId: 'keg',
      outputId: '',
      outputNameEn: '',
      outputNameZh: '',
      inputCount: 1,
      outputCount: 1,
      baseValue: 0,
      artisanGood: true, // all keg products are artisan goods
      tillerEligible: false,
      qualitySensitive: false, // kegs normalize quality
      days: 0,
      ...r,
    }) as RouteResult;

    if (has(item, 'hops'))
      return base({ outputId: 'pale_ale', outputNameEn: 'Pale Ale', outputNameZh: '淡啤酒', baseValue: 300, days: days(2250) });
    if (has(item, 'wheat'))
      return base({ outputId: 'beer', outputNameEn: 'Beer', outputNameZh: '啤酒', baseValue: 200, days: days(1750) });
    if (has(item, 'coffee_bean'))
      return base({ outputId: 'coffee', outputNameEn: 'Coffee', outputNameZh: '咖啡', baseValue: 150, inputCount: 5, days: days(120) });
    if (has(item, 'honey'))
      return base({ outputId: 'mead', outputNameEn: 'Mead', outputNameZh: '蜜蜂酒', baseValue: 300, days: days(600) });
    if (has(item, 'tea_leaves'))
      return base({ outputId: 'green_tea', outputNameEn: 'Green Tea', outputNameZh: '绿茶', baseValue: 100, days: days(180) });

    if (item.category === 'fruit') {
      const mult = isEdible(item) ? 3 : 0.25; // inedible fruit → 0.25× (wiki note)
      return base({
        outputId: `${item.id}_wine`,
        ...flavored(item, (n) => `${n} Wine`, (n) => `${n}酒`),
        baseValue: Math.round(item.basePrice * mult),
        days: days(10000),
      });
    }
    if (item.category === 'vegetable' || item.category === 'forage') {
      const mult = isEdible(item) ? 2.25 : 1; // inedible veg → 1× (wiki note)
      return base({
        outputId: `${item.id}_juice`,
        ...flavored(item, (n) => `${n} Juice`, (n) => `${n}汁`),
        baseValue: Math.round(item.basePrice * mult),
        days: days(6000),
      });
    }
    return null;
  },
};

// ---------------------------------------------------------------------------
// Preserves Jar — fruit→Jelly, veg/mushroom/forage→Pickles (2×base+50, 4000m),
// roe→Aged Roe (2×roe), sturgeon roe→Caviar (fixed 500g).
// ---------------------------------------------------------------------------
const JAR: Machine = {
  id: 'jar',
  nameEn: 'Preserves Jar',
  nameZh: '罐头瓶',
  transform: (item) => {
    const base = (r: Partial<RouteResult>): RouteResult => ({
      machineId: 'jar',
      outputId: '', outputNameEn: '', outputNameZh: '',
      inputCount: 1, outputCount: 1, baseValue: 0,
      artisanGood: true, tillerEligible: false, qualitySensitive: false,
      days: days(4000),
      ...r,
    }) as RouteResult;

    if (has(item, 'sturgeon_roe'))
      return base({ outputId: 'caviar', outputNameEn: 'Caviar', outputNameZh: '鱼籽酱', baseValue: 500 });
    // A fish's roe (from a Fish Pond) → Aged Roe, or Caviar for Sturgeon.
    if (item.category === 'fish') {
      if (makesCaviar(item))
        return base({
          outputId: 'caviar', outputNameEn: 'Caviar', outputNameZh: '鱼籽酱', baseValue: 500,
          note: 'Sturgeon Roe → Caviar (needs a Fish Pond for roe)',
        });
      return base({
        outputId: `aged_${item.id}_roe`,
        outputNameEn: `Aged ${item.nameEn} Roe`,
        outputNameZh: `腌${item.nameZh}鱼籽`,
        baseValue: roeValue(item) * 2,
        artisanGood: false,
        note: 'Roe (from a Fish Pond) → Aged Roe',
      });
    }
    if (item.category === 'roe')
      return base({
        outputId: `aged_${item.id}`,
        outputNameEn: item.id === 'roe' ? 'Aged Roe' : `Aged ${item.nameEn}`,
        outputNameZh: item.id === 'roe' ? '腌鱼籽' : `腌${item.nameZh}`,
        baseValue: item.basePrice * 2,
        artisanGood: false, // Aged Roe is not affected by Artisan
      });
    if (item.category === 'fruit') {
      const mult = isEdible(item) ? 2 : 0.5;
      return base({
        outputId: `${item.id}_jelly`,
        ...flavored(item, (n) => `${n} Jelly`, (n) => `${n}果酱`),
        baseValue: Math.round(item.basePrice * mult + (isEdible(item) ? 50 : 0)),
      });
    }
    if (item.category === 'vegetable' || item.category === 'mushroom' || item.category === 'forage') {
      const mult = isEdible(item) ? 2 : 0.5;
      return base({
        outputId: `${item.id}_pickles`,
        ...flavored(item, (n) => `Pickled ${n}`, (n) => `腌${n}`),
        baseValue: Math.round(item.basePrice * mult + (isEdible(item) ? 50 : 0)),
      });
    }
    return null;
  },
};

// ---------------------------------------------------------------------------
// Dehydrator — 5 inputs → 1 stack, 1 day. Fruit/Mushroom: 7.5×base+25. Grapes→Raisins 600g.
// ---------------------------------------------------------------------------
const DEHYDRATOR: Machine = {
  id: 'dehydrator',
  nameEn: 'Dehydrator',
  nameZh: '烘干机',
  transform: (item) => {
    const base = (r: Partial<RouteResult>): RouteResult => ({
      machineId: 'dehydrator',
      outputId: '', outputNameEn: '', outputNameZh: '',
      inputCount: 5, outputCount: 1, baseValue: 0,
      artisanGood: true, tillerEligible: false, qualitySensitive: false,
      days: 1,
      ...r,
    }) as RouteResult;

    if (has(item, 'grape'))
      return base({ outputId: 'raisins', outputNameEn: 'Raisins', outputNameZh: '葡萄干', baseValue: 600 });
    if (item.category === 'fruit')
      return base({
        outputId: `dried_${item.id}`,
        ...flavored(item, (n) => `Dried ${n}`, (n) => `${n}干`),
        baseValue: Math.round(7.5 * item.basePrice + 25),
      });
    if (item.category === 'mushroom')
      return base({
        outputId: `dried_${item.id}`,
        ...flavored(item, (n) => `Dried ${n}`, (n) => `${n}干`),
        baseValue: Math.round(7.5 * item.basePrice + 25),
      });
    return null;
  },
};

// ---------------------------------------------------------------------------
// Fish Smoker — any fish → Smoked Fish, 2×, 50m (+1 coal).
// ---------------------------------------------------------------------------
const SMOKER: Machine = {
  id: 'smoker',
  nameEn: 'Fish Smoker',
  nameZh: '熏鱼机',
  transform: (item) =>
    item.category === 'fish'
      ? {
          machineId: 'smoker',
          outputId: `smoked_${item.id}`,
          ...flavored(item, (n) => `Smoked ${n}`, (n) => `熏${n}`),
          inputCount: 1, outputCount: 1,
          baseValue: item.basePrice * 2,
          // Smoked Fish = 2× fish price, retaining quality; benefits from Fisher/Angler AND
          // Artisan (wiki). So it's quality-sensitive, fish-eligible, and an artisan good.
          artisanGood: true, tillerEligible: false, qualitySensitive: true, fishEligible: true,
          days: days(50),
          extraInputs: ['coal'],
        }
      : null,
};

// ---------------------------------------------------------------------------
// Fish Pond — a stocked fish passively produces Roe (30 + floor(price/2)).
// Modeled as instant/passive (the fish isn't consumed); shown for reference.
// ---------------------------------------------------------------------------
const POND: Machine = {
  id: 'pond',
  nameEn: 'Fish Pond → Roe',
  nameZh: '鱼塘 → 鱼籽',
  transform: (item) =>
    item.category === 'fish'
      ? {
          machineId: 'pond',
          outputId: makesCaviar(item) ? 'sturgeon_roe' : `${item.id}_roe`,
          outputNameEn: makesCaviar(item) ? 'Sturgeon Roe' : `${item.nameEn} Roe`,
          outputNameZh: makesCaviar(item) ? '鲟鱼籽' : `${item.nameZh}鱼籽`,
          inputCount: 1, outputCount: 1,
          baseValue: roeValue(item),
          artisanGood: false, tillerEligible: false, qualitySensitive: false,
          days: 0, // passive Fish Pond income; not consumed like keg/jar inputs
          note: 'Passive: a Fish Pond keeps producing roe without consuming the fish',
        }
      : null,
};

// ---------------------------------------------------------------------------
// Mayonnaise Machine — eggs → mayonnaise (fixed values), 180m.
// ---------------------------------------------------------------------------
const MAYO: Machine = {
  id: 'mayo',
  nameEn: 'Mayonnaise Machine',
  nameZh: '蛋黄酱机',
  transform: (item) => {
    if (item.category !== 'egg') return null;
    const mk = (id: string, en: string, zh: string, value: number): RouteResult => ({
      machineId: 'mayo', outputId: id, outputNameEn: en, outputNameZh: zh,
      inputCount: 1, outputCount: 1, baseValue: value,
      artisanGood: true, tillerEligible: false, qualitySensitive: false, days: days(180),
    });
    if (has(item, 'duck_egg')) return mk('duck_mayo', 'Duck Mayonnaise', '鸭蛋黄酱', 375);
    if (has(item, 'void_egg')) return mk('void_mayo', 'Void Mayonnaise', '虚空蛋黄酱', 275);
    if (has(item, 'dino_egg')) return mk('dino_mayo', 'Dinosaur Mayonnaise', '恐龙蛋黄酱', 800);
    // A Large Egg yields GOLD-quality Mayonnaise (190 × 1.5 = 285), per wiki. Regular eggs
    // always make normal-quality mayo (egg star quality does not carry through).
    if (item.id === 'large_egg') return mk('mayo', 'Mayonnaise', '蛋黄酱', 285);
    return mk('mayo', 'Mayonnaise', '蛋黄酱', 190);
  },
};

// ---------------------------------------------------------------------------
// Cheese Press — milk → cheese, 200m.
// ---------------------------------------------------------------------------
const CHEESE: Machine = {
  id: 'cheese',
  nameEn: 'Cheese Press',
  nameZh: '压酪机',
  transform: (item) => {
    if (item.category !== 'milk') return null;
    const goat = has(item, 'goat_milk');
    // Large Milk / Large Goat Milk yield GOLD-quality cheese (×1.5), per wiki.
    const large = item.id.startsWith('large_');
    const baseValue = goat ? (large ? 600 : 400) : large ? 345 : 230;
    return {
      machineId: 'cheese',
      outputId: goat ? 'goat_cheese' : 'cheese',
      outputNameEn: goat ? 'Goat Cheese' : 'Cheese',
      outputNameZh: goat ? '山羊奶酪' : '奶酪',
      inputCount: 1, outputCount: 1,
      baseValue,
      artisanGood: true, tillerEligible: false, qualitySensitive: false, days: days(200),
    };
  },
};

// ---------------------------------------------------------------------------
// Oil Maker — truffle→Truffle Oil (1065g, 360m); oilseed crops→Oil (100g, 1000m).
// ---------------------------------------------------------------------------
const OIL: Machine = {
  id: 'oil',
  nameEn: 'Oil Maker',
  nameZh: '产油机',
  transform: (item) => {
    if (has(item, 'truffle'))
      return {
        machineId: 'oil', outputId: 'truffle_oil', outputNameEn: 'Truffle Oil', outputNameZh: '松露油',
        inputCount: 1, outputCount: 1, baseValue: 1065,
        artisanGood: true, tillerEligible: false, qualitySensitive: false, days: days(360),
      };
    if (has(item, 'oilseed'))
      return {
        machineId: 'oil', outputId: 'oil', outputNameEn: 'Oil', outputNameZh: '油',
        inputCount: 1, outputCount: 1, baseValue: 100,
        artisanGood: true, tillerEligible: false, qualitySensitive: false, days: days(1000),
      };
    return null;
  },
};

// ---------------------------------------------------------------------------
// Loom — wool → Cloth (470g, 240m).
// ---------------------------------------------------------------------------
const LOOM: Machine = {
  id: 'loom',
  nameEn: 'Loom',
  nameZh: '织布机',
  transform: (item) =>
    item.category === 'wool'
      ? {
          machineId: 'loom', outputId: 'cloth', outputNameEn: 'Cloth', outputNameZh: '布料',
          inputCount: 1, outputCount: 1, baseValue: 470,
          artisanGood: true, tillerEligible: false, qualitySensitive: false, days: days(240),
        }
      : null,
};

// ---------------------------------------------------------------------------
// Cask — ages a Keg/Cheese-Press product to Iridium (×2). Two-step route, so it
// includes the upstream machine's time. Days to iridium (wiki): Wine 56, Cheese 14.
// ---------------------------------------------------------------------------
const CASK: Machine = {
  id: 'cask',
  nameEn: 'Cask (→ Iridium)',
  nameZh: '木桶（→铱星）',
  transform: (item) => {
    // Fruit → Wine → Cask
    if (item.category === 'fruit' && isEdible(item)) {
      return {
        machineId: 'cask',
        outputId: `${item.id}_wine_iridium`,
        ...flavored(item, (n) => `${n} Wine (Iridium)`, (n) => `${n}酒（铱星）`),
        inputCount: 1, outputCount: 1,
        baseValue: Math.round(item.basePrice * 3 * 2), // 3× wine, ×2 iridium
        artisanGood: true, // Artisan applies to the wine base
        tillerEligible: false, qualitySensitive: false,
        days: days(10000) + 56,
        note: 'Keg→Wine then aged to Iridium in a Cask',
      };
    }
    // Milk → Cheese → Cask
    if (item.category === 'milk') {
      const goat = has(item, 'goat_milk');
      return {
        machineId: 'cask',
        outputId: goat ? 'goat_cheese_iridium' : 'cheese_iridium',
        outputNameEn: goat ? 'Goat Cheese (Iridium)' : 'Cheese (Iridium)',
        outputNameZh: goat ? '山羊奶酪（铱星）' : '奶酪（铱星）',
        inputCount: 1, outputCount: 1,
        baseValue: (goat ? 400 : 230) * 2,
        artisanGood: true, tillerEligible: false, qualitySensitive: false,
        days: days(200) + 14,
        note: 'Cheese Press then aged to Iridium in a Cask',
      };
    }
    return null;
  },
};

export const MACHINES: Machine[] = [
  RAW, KEG, JAR, DEHYDRATOR, SMOKER, POND, MAYO, CHEESE, OIL, LOOM, CASK,
];
