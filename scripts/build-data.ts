// Builds src/data/items.generated.json from stardewvalleywiki.com (the source of truth).
// For each catalog entry we fetch its English page and read:
//   - base sell price  = first "<n>g" after the "Sell Price" infobox label
//   - official zh name = the page's interlanguage link to zh.stardewvalleywiki.com
// Pages are cached under .cache/wiki so re-runs are fast and polite.
//
// Run: npm run build:data
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOG } from './catalog';
import { Item, ItemUses, Named } from '../src/engine/types';
import { parseBundles, parseLovedBy, parseRecipes, parseQuest, zip } from './uses';
import { validateItems } from '../src/engine/items.schema';
import { writeSharedItems } from './derive-items';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE = join(ROOT, '.cache', 'wiki');
const OUT = join(ROOT, 'src', 'data', 'items.generated.json');
const SPRITES = join(ROOT, 'shared', 'sprites');
const WIKI = 'https://stardewvalleywiki.com';
const ZH_WIKI = 'https://zh.stardewvalleywiki.com';
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const CREDIT =
  'Stardew Valley © ConcernedApe · sprites & data from the Stardew Valley Wiki (CC BY-NC-SA).';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(page: string): Promise<string> {
  mkdirSync(CACHE, { recursive: true });
  const cacheFile = join(CACHE, page.replace(/[^a-z0-9]+/gi, '_') + '.html');
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf-8');

  const url = `https://stardewvalleywiki.com/${encodeURIComponent(page.replace(/ /g, '_'))}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${page}`);
  const html = await res.text();
  writeFileSync(cacheFile, html);
  await sleep(250); // be polite
  return html;
}

/** The Chinese wiki lives on its own host; pages are keyed by the official zh title. */
async function fetchZhPage(zhTitle: string): Promise<string | null> {
  mkdirSync(CACHE, { recursive: true });
  const cacheFile = join(CACHE, 'zh_' + zhTitle.replace(/[^\w\u4e00-\u9fff]+/g, '_') + '.html');
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf-8');
  const url = `${ZH_WIKI}/${encodeURIComponent(zhTitle.replace(/ /g, '_'))}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return null;
  const html = await res.text();
  writeFileSync(cacheFile, html);
  await sleep(250);
  return html;
}

// Villager Chinese names come from each villager's OWN page (via its interlanguage link) rather
// than from the position of a name inside a table row, which the two wikis order differently.
const villagerZh = new Map<string, string>();
async function zhVillager(en: string): Promise<string> {
  const hit = villagerZh.get(en);
  if (hit !== undefined) return hit;
  let zh = en;
  try {
    zh = parseZhName(await fetchPage(en)) ?? en;
  } catch {
    /* villager page missing → fall back to the English name */
  }
  villagerZh.set(en, zh);
  return zh;
}

/** Assemble the bundles / loved-by / recipes / quest block for one item. */
async function buildUses(enHtml: string, nameZh: string | null): Promise<ItemUses> {
  const zhHtml = nameZh ? await fetchZhPage(nameZh) : null;

  const enBundles = parseBundles(enHtml, false);
  const zhBundles = zhHtml ? parseBundles(zhHtml, true) : [];
  const bundles = enBundles.map((b, i) => ({
    bundle: { en: b.bundle, zh: zhBundles[i]?.bundle ?? b.bundle } as Named,
    room: { en: b.room, zh: zhBundles[i]?.room ?? b.room } as Named,
  }));

  const lovedEn = parseLovedBy(enHtml);
  const lovedBy: Named[] = [];
  for (const v of lovedEn) lovedBy.push({ en: v, zh: await zhVillager(v) });

  const recipes = zip(parseRecipes(enHtml, false), zhHtml ? parseRecipes(zhHtml, true) : []);

  return { bundles, lovedBy, recipes, quest: parseQuest(enHtml) };
}

function parseZhName(html: string): string | null {
  const m = html.match(/title="([^"]*) – 中文"/);
  return m ? m[1].trim() : null;
}

// Base (normal-quality) energy from the infobox "Energy / Health" row. Items that restore no
// energy show 0; inedible items have no row at all (null). This gates the Preserves Jar and Keg,
// which per the wiki accept only *positive energy* forage.
function parseEnergy(html: string): number | null {
  // <style>/<script> bodies survive naive tag-stripping and sit between the label and the
  // number in the infobox, so drop those blocks first.
  const text = html
    .replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ');
  const m = text.match(/Energy\s*\/\s*Health\s+(-?\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function parseBasePrice(html: string): number | null {
  const i = html.search(/Sell Price/);
  if (i < 0) return null;
  const seg = html.slice(i, i + 2500).replace(/&#?\w+;/g, ' ');
  const m = seg.match(/(\d[\d,]*)\s*g\b/);
  return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
}

// The infobox sprite: the full-size (non-thumb) /mediawiki/images PNG whose alt is
// "<PageName>.png". Falls back to the first non-thumb game image that isn't a UI glyph.
const UI_GLYPHS = /^(Energy|Health|Gold|Silver|Iridium|Quality|Star|Time|Clock)\b/;
function parseSpriteUrl(html: string, page: string): string | null {
  const tags = html.match(/<img\b[^>]*>/g) ?? [];
  const parsed = tags
    .map((tag) => ({
      alt: tag.match(/alt="([^"]*)"/)?.[1] ?? '',
      src: tag.match(/src="([^"]*)"/)?.[1] ?? '',
    }))
    .filter((x) => /^\/mediawiki\/images\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+\.png$/i.test(x.src));

  const exact = parsed.find((x) => x.alt === `${page}.png`);
  const chosen = exact ?? parsed.find((x) => !UI_GLYPHS.test(x.alt));
  return chosen ? WIKI + chosen.src : null;
}

async function downloadSprite(url: string, id: string): Promise<boolean> {
  mkdirSync(SPRITES, { recursive: true });
  const dest = join(SPRITES, `${id}.png`);
  if (existsSync(dest)) return true;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) return false;
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  await sleep(150);
  return true;
}

async function build() {
  const items: Item[] = [];
  const warnings: string[] = [];

  for (const entry of CATALOG) {
    const url = `https://stardewvalleywiki.com/${entry.page.replace(/ /g, '_')}`;
    let html: string;
    try {
      html = await fetchPage(entry.page);
    } catch (err) {
      warnings.push(`FETCH FAIL ${entry.page}: ${(err as Error).message}`);
      continue;
    }

    const nameZh = parseZhName(html);
    const wikiPrice = parseBasePrice(html);
    const basePrice = entry.price ?? wikiPrice;

    if (nameZh === null) warnings.push(`no zh name: ${entry.page}`);
    if (basePrice === null) warnings.push(`no price: ${entry.page}`);
    if (entry.price !== undefined && wikiPrice !== null && wikiPrice !== entry.price)
      warnings.push(`price override ${entry.page}: catalog=${entry.price} wiki=${wikiPrice}`);

    // Download the real game sprite (bundled, committed, offline).
    const spriteUrl = parseSpriteUrl(html, entry.page);
    if (!spriteUrl) {
      warnings.push(`no sprite: ${entry.page}`);
    } else {
      try {
        if (!(await downloadSprite(spriteUrl, entry.id)))
          warnings.push(`sprite download failed: ${entry.page} (${spriteUrl})`);
      } catch (err) {
        warnings.push(`sprite error ${entry.page}: ${(err as Error).message}`);
      }
    }

    // Forage with no energy (e.g. Daffodil) is rejected by the Preserves Jar and the Keg, so
    // tag it for the rules in shared/machines.json.
    const energy = parseEnergy(html);
    const tags = energy !== null && energy <= 0 ? [...entry.tags, 'zero_energy'] : entry.tags;

    const uses = await buildUses(html, nameZh);

    items.push({
      id: entry.id,
      nameEn: entry.page,
      nameZh: nameZh ?? entry.page,
      basePrice: basePrice ?? 0,
      category: entry.category,
      tags,
      source: url,
      uses,
    });
  }

  // Fail loudly rather than ship silently-bad data (wiki is the source of truth).
  const validated = validateItems(items);
  writeFileSync(OUT, JSON.stringify(validated, null, 2) + '\n');

  // Derive roe and publish the shared dataset the iOS app reads.
  const all = writeSharedItems(validated);

  console.log(`\n✅ wrote ${validated.length} items → ${OUT}`);
  console.log(`   shared → ${all.length} items (incl. ${all.length - validated.length} derived roe)`);
  console.log(`   sprites → ${SPRITES}`);
  if (warnings.length) {
    console.warn(`\n⚠️  ${warnings.length} warnings (review in PROGRESS.md):`);
    for (const w of warnings) console.warn('   - ' + w);
  }
  console.log(`\n📜 ${CREDIT}`);
}

build().catch((err) => {
  console.error('\n❌ build-data failed:', err.message);
  console.error('If the wiki is unreachable, PAUSE T6 and record the blocker in PROGRESS.md.');
  process.exit(1);
});
