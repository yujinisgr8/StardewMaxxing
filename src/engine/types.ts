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

export interface Settings {
  artisan: boolean; // Artisan profession: +40% to artisan goods
  tiller: boolean; // Tiller profession: +10% to raw crops & flowers
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
  qualitySensitive: boolean; // value scales with the input's star quality
  days: number; // processing time in days (0 = instant / sell raw)
  extraInputs?: string[]; // e.g. ['coal'] for the Fish Smoker
  note?: string;
}

/** A fully-costed route after applying Settings, ready for the UI. */
export interface ProcessRoute extends RouteResult {
  value: number; // total batch value after professions/quality, rounded
  perInputValue: number; // value normalized to a single raw input item
  goldPerDay: number | null; // perInputValue / days; null when instant (raw)
  best: boolean;
}
