// Runtime validation for item datasets (seed + generated). Keeps bad data from
// silently breaking the engine; used by the data loader and the build script.
import { Item, ItemUses, Category } from './types';

const CATEGORIES: Category[] = [
  'fruit', 'vegetable', 'flower', 'forage', 'fish',
  'roe', 'milk', 'egg', 'wool', 'mushroom', 'other',
];

export function validateItem(raw: unknown, index: number): Item {
  const at = `items[${index}]`;
  if (typeof raw !== 'object' || raw === null) throw new Error(`${at}: not an object`);
  const o = raw as Record<string, unknown>;

  const str = (k: string) => {
    if (typeof o[k] !== 'string' || !o[k]) throw new Error(`${at}.${k}: missing/invalid string`);
    return o[k] as string;
  };

  const id = str('id');
  const nameEn = str('nameEn');
  const nameZh = str('nameZh');
  if (typeof o.basePrice !== 'number' || o.basePrice < 0)
    throw new Error(`${at}.basePrice: must be a non-negative number`);
  if (!CATEGORIES.includes(o.category as Category))
    throw new Error(`${at}.category: "${String(o.category)}" not a valid Category`);
  if (!Array.isArray(o.tags) || !o.tags.every((t) => typeof t === 'string'))
    throw new Error(`${at}.tags: must be a string[]`);

  return {
    id,
    nameEn,
    nameZh,
    basePrice: o.basePrice,
    category: o.category as Category,
    tags: o.tags as string[],
    source: typeof o.source === 'string' ? o.source : undefined,
    uses: typeof o.uses === 'object' && o.uses !== null ? (o.uses as ItemUses) : undefined,
  };
}

export function validateItems(data: unknown): Item[] {
  if (!Array.isArray(data)) throw new Error('dataset root must be an array');
  const items = data.map(validateItem);
  const ids = new Set<string>();
  for (const it of items) {
    if (ids.has(it.id)) throw new Error(`duplicate item id: ${it.id}`);
    ids.add(it.id);
  }
  return items;
}
