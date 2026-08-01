// Curated catalog of processable items. We supply the wiki PAGE TITLE + taxonomy
// (category/tags); scripts/build-data.ts fetches the authoritative base price and the
// official Simplified-Chinese name from stardewvalleywiki.com for each.
//
// Category drives the engine's rules (fruit→Wine, vegetable→Juice, etc.), so SV's own
// fruit/vegetable classification is used (e.g. Hot Pepper & Rhubarb are FRUITS; Tomato is
// a VEGETABLE). Tree fruits carry the 'tree' tag (not eligible for the Tiller bonus).
//
// `price` is an optional override for items the wiki lists as "varies" (Honey, Roe, …).

import { Category } from '../src/engine/types';

export interface CatalogEntry {
  page: string; // exact wiki page title
  id: string;
  category: Category;
  tags: string[];
  price?: number; // override when the wiki price is variable / not a single number
}

const e = (page: string, category: Category, tags: string[] = ['edible'], price?: number): CatalogEntry => ({
  page,
  id: page.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
  category,
  tags,
  price,
});

export const CATALOG: CatalogEntry[] = [
  // ---- Fruits (→ Wine / Jelly / Dried Fruit) ----
  e('Blueberry', 'fruit'),
  e('Melon', 'fruit'),
  e('Strawberry', 'fruit'),
  e('Cranberries', 'fruit'),
  e('Ancient Fruit', 'fruit'),
  e('Starfruit', 'fruit'),
  e('Hot Pepper', 'fruit'),
  e('Grape', 'fruit', ['edible', 'grape']),
  e('Rhubarb', 'fruit'),
  e('Cactus Fruit', 'fruit'),
  e('Crystal Fruit', 'fruit'),
  e('Spice Berry', 'fruit'),
  e('Wild Plum', 'fruit'),
  e('Blackberry', 'fruit'),
  e('Salmonberry', 'fruit'),
  e('Powdermelon', 'fruit'),
  e('Qi Fruit', 'fruit'),
  // Tree fruits (not Tiller-eligible)
  e('Apple', 'fruit', ['edible', 'tree']),
  e('Apricot', 'fruit', ['edible', 'tree']),
  e('Cherry', 'fruit', ['edible', 'tree']),
  e('Orange', 'fruit', ['edible', 'tree']),
  e('Peach', 'fruit', ['edible', 'tree']),
  e('Pomegranate', 'fruit', ['edible', 'tree']),
  e('Banana', 'fruit', ['edible', 'tree']),
  e('Mango', 'fruit', ['edible', 'tree']),

  // ---- Vegetables (→ Juice / Pickles) ----
  e('Parsnip', 'vegetable'),
  e('Summer Squash', 'vegetable'),
  e('Broccoli', 'vegetable'),
  e('Carrot', 'vegetable'),
  e('Green Bean', 'vegetable'),
  e('Cauliflower', 'vegetable'),
  e('Potato', 'vegetable'),
  e('Garlic', 'vegetable'),
  e('Kale', 'vegetable'),
  e('Beet', 'vegetable'),
  e('Radish', 'vegetable'),
  e('Red Cabbage', 'vegetable'),
  e('Artichoke', 'vegetable'),
  e('Corn', 'vegetable', ['edible', 'oilseed']),
  e('Eggplant', 'vegetable'),
  e('Pumpkin', 'vegetable'),
  e('Bok Choy', 'vegetable'),
  e('Yam', 'vegetable'),
  e('Amaranth', 'vegetable'),
  e('Tomato', 'vegetable'),
  e('Tea Leaves', 'vegetable', ['tea_leaves']),
  e('Hops', 'vegetable', ['hops']),
  e('Wheat', 'vegetable', ['wheat']),
  e('Coffee Bean', 'vegetable', ['coffee_bean']),
  e('Unmilled Rice', 'vegetable'),
  e('Taro Root', 'vegetable'),
  e('Fiddlehead Fern', 'vegetable'),

  // ---- Flowers (raw + Tiller; Sunflower → Oil) ----
  e('Tulip', 'flower'),
  e('Blue Jazz', 'flower'),
  e('Summer Spangle', 'flower'),
  e('Poppy', 'flower'),
  e('Sunflower', 'flower', ['oilseed']),
  e('Fairy Rose', 'flower'),

  // ---- Forage (edible forage → Juice/Pickles) ----
  e('Wild Horseradish', 'forage'),
  e('Daffodil', 'forage'),
  e('Leek', 'forage'),
  e('Dandelion', 'forage'),
  e('Spring Onion', 'forage'),
  e('Cave Carrot', 'forage'),
  e('Hazelnut', 'forage'),
  e('Winter Root', 'forage'),
  e('Snow Yam', 'forage'),
  e('Ginger', 'forage'),

  // ---- Mushrooms (→ Pickles / Dried Mushrooms) ----
  e('Common Mushroom', 'mushroom'),
  e('Morel', 'mushroom'),
  e('Chanterelle', 'mushroom'),
  e('Purple Mushroom', 'mushroom'),
  e('Magma Cap', 'mushroom'),

  // ---- Fish (→ Smoked Fish; Fish Pond → Roe → Aged Roe) — full rod-caught roster ----
  // Rivers / lakes / forest
  e('Carp', 'fish', []),
  e('Catfish', 'fish', []),
  e('Chub', 'fish', []),
  e('Bream', 'fish', []),
  e('Dorado', 'fish', []),
  e('Pike', 'fish', []),
  e('Perch', 'fish', []),
  e('Walleye', 'fish', []),
  e('Rainbow Trout', 'fish', []),
  e('Tiger Trout', 'fish', []),
  e('Salmon', 'fish', []),
  e('Smallmouth Bass', 'fish', []),
  e('Largemouth Bass', 'fish', []),
  e('Bullhead', 'fish', []),
  e('Sunfish', 'fish', []),
  e('Shad', 'fish', []),
  e('Lingcod', 'fish', []),
  e('Sturgeon', 'fish', ['caviar']),
  e('Midnight Carp', 'fish', []),
  e('Slimejack', 'fish', []),
  e('Woodskip', 'fish', []),
  e('Void Salmon', 'fish', []),
  e('Goby', 'fish', []),
  // Ocean
  e('Anchovy', 'fish', []),
  e('Sardine', 'fish', []),
  e('Herring', 'fish', []),
  e('Tuna', 'fish', []),
  e('Albacore', 'fish', []),
  e('Halibut', 'fish', []),
  e('Red Snapper', 'fish', []),
  e('Red Mullet', 'fish', []),
  e('Tilapia', 'fish', []),
  e('Flounder', 'fish', []),
  e('Sea Cucumber', 'fish', []),
  e('Super Cucumber', 'fish', []),
  e('Eel', 'fish', []),
  e('Octopus', 'fish', []),
  e('Squid', 'fish', []),
  e('Pufferfish', 'fish', []),
  e('Midnight Squid', 'fish', []),
  e('Spook Fish', 'fish', []),
  e('Blobfish', 'fish', []),
  // Mines / desert / island
  e('Ghostfish', 'fish', []),
  e('Stonefish', 'fish', []),
  e('Ice Pip', 'fish', []),
  e('Lava Eel', 'fish', []),
  e('Sandfish', 'fish', []),
  e('Scorpion Carp', 'fish', []),
  e('Lionfish', 'fish', []),
  e('Blue Discus', 'fish', []),
  e('Stingray', 'fish', []),
  // Crab Pot (wiki: /Crab_Pot). Category Fish in-game, so they're Fisher/Angler-eligible,
  // smokeable ("Any Fish" — the Fish Smoker page footnotes crab-pot fish explicitly), and
  // pond-stockable (Fish Pond → Roe).
  e('Lobster', 'fish', []),
  e('Crab', 'fish', []),
  e('Crayfish', 'fish', []),
  e('Snail', 'fish', []),
  e('Shrimp', 'fish', []),
  e('Clam', 'fish', []),
  e('Cockle', 'fish', []),
  e('Oyster', 'fish', []),
  e('Mussel', 'fish', []),
  e('Periwinkle', 'fish', []),
  // Legendary
  e('Crimsonfish', 'fish', []),
  e('Angler', 'fish', []),
  e('Legend', 'fish', []),
  e('Glacierfish', 'fish', []),
  e('Mutant Carp', 'fish', []),

  // Roe is not catalogued — it's derived per-fish in src/data/items.ts
  // (Fish Pond → Roe = 30 + floor(fish price / 2); Sturgeon → Caviar).

  // ---- Animal products & specials ----
  e('Milk', 'milk', [], 125),
  e('Large Milk', 'milk', [], 190),
  e('Goat Milk', 'milk', ['goat_milk'], 225),
  e('Large Goat Milk', 'milk', ['goat_milk'], 345),
  e('Egg', 'egg', [], 50),
  e('Large Egg', 'egg', [], 95),
  e('Duck Egg', 'egg', ['duck_egg'], 95),
  e('Void Egg', 'egg', ['void_egg'], 65),
  e('Dinosaur Egg', 'egg', ['dino_egg'], 350),
  e('Wool', 'wool', [], 340),
  e('Truffle', 'other', ['truffle'], 625),
  e('Honey', 'other', ['honey'], 100),
];
