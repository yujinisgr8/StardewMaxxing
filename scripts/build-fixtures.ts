// Generates shared/fixtures/parity.json — the CROSS-PLATFORM CONTRACT.
//
// For every item under a settings matrix that exercises each pricing path, this records the
// ranked routes the TypeScript engine produces. The SwiftUI app's test suite loads this exact
// file and asserts identical output, so the two engines cannot silently drift.
//
// Regenerate deliberately (`npm run build:fixtures`) — a diff here means behaviour changed.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ITEMS } from '../src/data/items';
import { computeRoutes } from '../src/engine/compute';
import { Settings } from '../src/engine/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'shared', 'fixtures', 'parity.json');

const S = (o: Partial<Settings>): Settings => ({
  level5: 'none', level10: 'none', fishingLevel5: 'none', fishingLevel10: 'none',
  quality: 'normal', rankBy: 'total', ...o,
});

// Each case targets a distinct pricing path; together they hit every bonus, quality tier,
// stacking combination and both ranking metrics.
const CASES: { name: string; settings: Settings }[] = [
  { name: 'baseline', settings: S({}) },
  { name: 'tiller+artisan', settings: S({ level5: 'tiller', level10: 'artisan' }) },
  { name: 'rancher', settings: S({ level5: 'rancher' }) },
  { name: 'artisan+iridium', settings: S({ level5: 'tiller', level10: 'artisan', quality: 'iridium' }) },
  { name: 'fisher', settings: S({ fishingLevel5: 'fisher' }) },
  { name: 'angler+artisan+gold', settings: S({ level5: 'tiller', level10: 'artisan', fishingLevel5: 'fisher', fishingLevel10: 'angler', quality: 'gold' }) },
  { name: 'silver-perDay', settings: S({ quality: 'silver', rankBy: 'perDay' }) },
  { name: 'tiller+artisan-perDay', settings: S({ level5: 'tiller', level10: 'artisan', rankBy: 'perDay' }) },
];

const fixture = {
  $comment:
    'Golden outputs of the TypeScript engine. The Swift engine must reproduce these exactly ' +
    '(floats compared with 1e-9 tolerance). Route array order IS the ranking and is significant.',
  generatedFrom: 'src/engine/compute.ts',
  cases: CASES.map((c) => ({
    name: c.name,
    settings: c.settings,
    items: ITEMS.map((item) => ({
      id: item.id,
      routes: computeRoutes(item, c.settings).map((r) => ({
        machineId: r.machineId,
        outputId: r.outputId,
        inputCount: r.inputCount,
        outputCount: r.outputCount,
        value: r.value,
        extraCost: r.extraCost,
        perInputValue: r.perInputValue,
        effectiveDays: r.effectiveDays,
        goldPerDay: r.goldPerDay,
        appliedBonuses: r.appliedBonuses.map((b) => b.key),
        best: r.best,
      })),
    })),
  })),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(fixture, null, 1) + '\n');
const routes = fixture.cases.reduce((n, c) => n + c.items.reduce((m, i) => m + i.routes.length, 0), 0);
console.log(`parity.json: ${CASES.length} settings × ${ITEMS.length} items = ${routes} ranked routes`);
