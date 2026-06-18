// Core engine types. All game numbers are sourced from stardewvalleywiki.com.
// In-game day for machine timing = 1600 minutes (the wiki's convention).

export const MINUTES_PER_DAY = 1600;

export type Category =
  | 'fruit'
  | 'vegetable'
  | 'flower'
  | 'forage'
  | 'fish'
  | 'roe'
  | 'milk'
  | 'egg'
  | 'wool'
  | 'mushroom'
  | 'other';

export type Quality = 'normal' | 'silver' | 'gold' | 'iridium';

/** Quality price multipliers for RAW produce (wiki: Quality). */
export const QUALITY_MULT: Record<Quality, number> = {
  normal: 1,
  silver: 1.25,
  gold: 1.5,
  iridium: 2,
};

export interface Item {
  id: string;
  nameEn: string;
  nameZh: string; // official simplified-Chinese name from the wiki
  basePrice: number; // base sell price at normal quality
  category: Category;
  /**
   * Free-form flags driving special-case rules, e.g.:
   * 'edible' | 'inedible' | 'tree' (tree fruit, not Tiller-eligible) |
   * 'hops' | 'wheat' | 'coffee_bean' | 'honey' | 'tea_leaves' | 'grape' |
   * 'sturgeon_roe' | 'truffle' | 'goat_milk' | 'large' |
   * 'duck_egg' | 'void_egg' | 'dino_egg' | 'oilseed'
   */
  tags: string[];
  source?: string; // wiki URL the data came from
}

// Farming professions, modeled as the in-game skill tree (wiki: Skills/Farming).
// Level 5 is a single mutually-exclusive pick; Level 10 branches off it.
export type Level5Prof = 'none' | 'rancher' | 'tiller';
export type Level10Prof = 'none' | 'artisan' | 'agriculturist' | 'coopmaster' | 'shepherd';

// Fishing professions (wiki: Skills/Fishing). Only Fisher (+25%) and Angler (+50%)
// affect sell value; Trapper/Pirate/Mariner/Luremaster are crab-pot/treasure perks.
export type FishL5 = 'none' | 'fisher' | 'trapper';
export type FishL10 = 'none' | 'angler' | 'pirate' | 'mariner' | 'luremaster';

export interface Settings {
  // Lvl-5: Rancher (+20% animal products) XOR Tiller (+10% crops & flowers).
  level5: Level5Prof;
  // Lvl-10: branch-dependent. Only Artisan (+40% artisan goods) affects sell value;
  // Agriculturist/Coopmaster/Shepherd change growth/production speed, not price.
  level10: Level10Prof;
  // Fishing tree (independent skill). Fisher +25% fish; Angler +50% fish (does NOT stack
  // with Fisher). Applies to raw fish & smoked fish, not roe.
  fishingLevel5: FishL5;
  fishingLevel10: FishL10;
  quality: Quality; // star quality of the raw input item
  rankBy: 'total' | 'perDay'; // ranking metric
}

/** Pre-modifier economic facts a machine produces for an item. */
export interface RouteResult {
  machineId: string;
  outputId: string;
  outputNameEn: string;
  outputNameZh: string;
  inputCount: number; // raw items consumed per batch
  outputCount: number; // products produced per batch
  baseValue: number; // total batch sell value at normal quality, no professions
  artisanGood: boolean; // Artisan +40% applies to this output
  tillerEligible: boolean; // Tiller +10% applies (raw crops/flowers only)
  rancherEligible?: boolean; // Rancher +20% applies (raw animal products only); defaults false
  fishEligible?: boolean; // Fisher/Angler apply (raw fish & smoked fish only); defaults false
  qualitySensitive: boolean; // value scales with the input's star quality
  days: number; // processing time in days (0 = instant / sell raw)
  extraInputs?: string[]; // e.g. ['coal'] for the Fish Smoker
  note?: string;
}

/** A fully-costed route after applying Settings, ready for the UI. */
export interface ProcessRoute extends RouteResult {
  value: number; // total batch sell value after professions/quality, rounded (gross, no costs)
  extraCost: number; // cost of consumable extra inputs (e.g. Fish Smoker coal), per batch
  perInputValue: number; // NET gold per single raw input: (value - extraCost) / inputCount
  effectiveDays: number; // days rounded up to whole "collect next morning" slots (0 = instant)
  goldPerDay: number | null; // perInputValue / effectiveDays; null when instant (raw)
  best: boolean;
}
