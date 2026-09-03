// Item dataset loader.
//
// Loads shared/items.json — the SHARED, fully-derived dataset (wiki scrape + per-fish roe)
// that the SwiftUI iOS app reads too. Regenerate with `npm run build:data` (re-scrapes the wiki)
// or `npm run build:shared` (re-derives from the committed scrape).
// The hand-verified items.seed.json remains as a small reference/fallback used by tests.
import { validateItems } from '../engine/items.schema';
import { Item } from '../engine/types';
import shared from '../../shared/items.json';

export const ITEMS: Item[] = validateItems(shared);

export const findItem = (id: string) => ITEMS.find((i) => i.id === id);
