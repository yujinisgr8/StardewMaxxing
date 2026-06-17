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
import { Item } from '../src/engine/types';
import { validateItems } from '../src/engine/items.schema';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CACHE = join(ROOT, '.cache', 'wiki');
const OUT = join(ROOT, 'src', 'data', 'items.generated.json');
const SPRITES = join(ROOT, 'src', 'assets', 'items');
const WIKI = 'https://stardewvalleywiki.com';
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

function parseZhName(html: string): string | null {
  const m = html.match(/title="([^"]*) – 中文"/);
  return m ? m[1].trim() : null;
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

    items.push({
      id: entry.id,
      nameEn: entry.page,
      nameZh: nameZh ?? entry.page,
      basePrice: basePrice ?? 0,
      category: entry.category,
      tags: entry.tags,
      source: url,
    });
  }

  // Fail loudly rather than ship silently-bad data (wiki is the source of truth).
  const validated = validateItems(items);
  writeFileSync(OUT, JSON.stringify(validated, null, 2) + '\n');

  console.log(`\n✅ wrote ${validated.length} items → ${OUT}`);
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
