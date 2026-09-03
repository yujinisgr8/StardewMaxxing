// Derives the full shared item dataset from the raw wiki scrape.
//
// Writes shared/items.json — the SHARED dataset both the Electron app and the SwiftUI iOS app
// load. Doing the roe derivation here (rather than at app startup) means iOS needs no derivation
// logic of its own: it just decodes the file.
//
// Run directly to rebuild from the existing scrape: tsx scripts/derive-items.ts
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Item } from '../src/engine/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SHARED_ITEMS = join(ROOT, 'shared', 'items.json');

// Sturgeon's roe becomes Caviar; every other fish produces ordinary Roe (→ Aged Roe).
const makesCaviar = (f: Item) => f.id === 'sturgeon' || f.tags.includes('caviar');

/**
 * Roe is its own searchable item, derived per fish: a Fish Pond stocked with a fish passively
 * produces Roe worth 30 + ⌊fish price ÷ 2⌋ (wiki /Roe). Kept separate from the fish so
 * "what to do with this fish" (sell/smoke) isn't mixed with pond roe.
 */
export function deriveItems(base: Item[]): Item[] {
  const roe = base
    .filter((i) => i.category === 'fish')
    .map((f): Item => ({
      id: makesCaviar(f) ? 'sturgeon_roe' : `${f.id}_roe`,
      nameEn: makesCaviar(f) ? 'Sturgeon Roe' : `${f.nameEn} Roe`,
      nameZh: makesCaviar(f) ? '鲟鱼籽' : `${f.nameZh}鱼籽`,
      basePrice: 30 + Math.floor(f.basePrice / 2),
      category: 'roe',
      tags: makesCaviar(f) ? ['sturgeon_roe'] : [],
      source: f.source,
    }));
  return [...base, ...roe];
}

export function writeSharedItems(base: Item[]): Item[] {
  const all = deriveItems(base);
  mkdirSync(dirname(SHARED_ITEMS), { recursive: true });
  writeFileSync(SHARED_ITEMS, JSON.stringify(all, null, 2) + '\n');
  return all;
}

// CLI: regenerate shared/items.json from the committed scrape without re-fetching the wiki.
if (process.argv[1] && process.argv[1].endsWith('derive-items.ts')) {
  const raw = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'items.generated.json'), 'utf8'));
  const all = writeSharedItems(raw as Item[]);
  console.log(`shared/items.json: ${raw.length} scraped + ${all.length - raw.length} derived roe = ${all.length} items`);
}
