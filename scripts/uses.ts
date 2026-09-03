// Parsers for the "other uses" sections of a wiki item page: bundles, loved-by gifts,
// recipes and Help Wanted quests. Used by build-data.ts.
//
// Both the English and Chinese wikis are parsed. Where the two pages order things differently
// (the zh bundle sentence puts the ROOM first, English puts the bundle first) we classify by
// content rather than position, so a layout difference can't silently swap the two.

import { Named } from '../src/engine/types';
export type { Named };

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

/** Slice out one `<h2>` section by its visible heading text (works for zh headings too). */
export function section(html: string, headings: string[]): string | null {
  for (const h of headings) {
    const re = new RegExp(`<span class="mw-headline"[^>]*>\\s*${h}\\s*</span>`);
    const m = html.match(re);
    if (!m || m.index === undefined) continue;
    const rest = html.slice(m.index);
    const end = rest.indexOf('<h2', 10);
    return end > 0 ? rest.slice(0, end) : rest;
  }
  return null;
}

const linkRe = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

/** All links in a fragment, in document order, skipping image-only and File: links. */
function links(fragment: string): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  for (const m of fragment.matchAll(linkRe)) {
    if (m[1].startsWith('/File:')) continue;
    const text = strip(m[2]);
    if (text) out.push({ href: safeDecode(m[1]), text });
  }
  return out;
}

const linkTexts = (fragment: string) => links(fragment).map((l) => l.text);

function safeDecode(href: string): string {
  try {
    return decodeURIComponent(href);
  } catch {
    return href;
  }
}

// --- Bundles ---------------------------------------------------------------------------------
// EN: "... used in the <Spring Foraging Bundle> in the <Crafts Room>."
// ZH: "... 是<工艺室>中<春季采集收集包>的一部分。"  (room first!)
// So: a bundle is the link whose text ends in "Bundle" / "收集包"; the room is the other link.
const isBundleName = (s: string) => /\bBundle$/.test(s) || /收集包$/.test(s);

// "Remixed Bundles" are the alternate Community Center layout chosen at world creation. They
// are excluded: most saves use the standard bundles, the zh wiki doesn't mirror the remixed
// pages, and mixing the two would make the panel misleading rather than more complete.
const isRemixed = (href: string) => /Remixed|重混/i.test(href);

export function parseBundles(html: string, zh: boolean): { bundle: string; room: string }[] {
  const seg = section(html, zh ? ['收集包'] : ['Bundles']);
  if (!seg) return [];
  const texts = links(seg).filter((l) => !isRemixed(l.href)).map((l) => l.text);
  const bundles = texts.filter(isBundleName);
  const rooms = texts.filter((t) => !isBundleName(t));
  // Pair each bundle with the room mentioned alongside it; a single room usually serves all.
  return bundles.map((bundle, i) => ({ bundle, room: rooms[i] ?? rooms[0] ?? '' }));
}

// --- Gifting ---------------------------------------------------------------------------------
// The "Love" row of the Villager Reactions table. Only villager NAMES are taken here; their
// Chinese names come from each villager's own wiki page (reliable), not from row position.
export function parseLovedBy(html: string): string[] {
  const seg = section(html, ['Gifting']);
  if (!seg) return [];
  // Rows look like: <tr><th>Love</th><td>…links…</td></tr>
  for (const row of seg.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cell = row[1];
    const th = cell.match(/<th[^>]*>([\s\S]*?)<\/th>/);
    if (!th || strip(th[1]) !== 'Love') continue;
    const td = cell.match(/<td[^>]*>([\s\S]*?)<\/td>/);
    return td ? linkTexts(td[1]) : [];
  }
  return [];
}

// --- Recipes ---------------------------------------------------------------------------------
// A wikitable whose 2nd column is the dish/craft name. Rows align between the EN and zh pages,
// so these ARE zipped positionally — but only within the table, never across sections.
// The zh wiki splits this heading four ways depending on whether the item is cooked or crafted
// (配方 / 食谱 / 烹饪 / 打造); English always says "Recipes".
const ZH_RECIPE_HEADINGS = ['配方', '食谱', '烹饪', '打造'];

export function parseRecipes(html: string, zh: boolean): string[] {
  const seg = section(html, zh ? ZH_RECIPE_HEADINGS : ['Recipes']);
  if (!seg) return [];
  const out: string[] = [];
  for (const row of seg.matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    if (cells.length < 2) continue; // header row
    const name = linkTexts(cells[1])[0];
    if (name) out.push(name);
  }
  return out;
}

// --- Quests ----------------------------------------------------------------------------------
// Only the fact that it can be randomly requested, plus the gold reward. The prose itself is
// rendered by the apps in the user's language rather than scraped.
export function parseQuest(html: string): { reward: number | null } | undefined {
  const seg = section(html, ['Quests']);
  if (!seg) return undefined;
  const text = strip(seg);
  if (!/Help Wanted|randomly requested|may be requested/i.test(text)) return undefined;
  const m = text.match(/reward of\s*(?:data-sort-value="\d+">)?\s*([\d,]+)g/);
  return { reward: m ? parseInt(m[1].replace(/,/g, ''), 10) : null };
}

/** Zip EN and zh lists, falling back to the English string when the zh page lacks the entry. */
export function zip(en: string[], zhList: string[]): Named[] {
  return en.map((e, i) => ({ en: e, zh: zhList[i] ?? e }));
}
