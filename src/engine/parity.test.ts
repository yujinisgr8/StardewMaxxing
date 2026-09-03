// Verifies the TypeScript engine still matches shared/fixtures/parity.json — the same golden
// file the SwiftUI app's test suite asserts against. If this fails, either the engine changed
// (regenerate with `npm run build:fixtures` and review the diff) or a regression crept in.
import { ITEMS } from '../data/items';
import { computeRoutes } from './compute';
import { Settings } from './types';
import fixture from '../../shared/fixtures/parity.json';

const EPS = 1e-9;
let checks = 0;
const fail = (msg: string): never => {
  console.error(`  ✗ ${msg}`);
  process.exit(1);
};

const byId = new Map(ITEMS.map((i) => [i.id, i]));

for (const c of fixture.cases) {
  for (const expected of c.items) {
    const item = byId.get(expected.id) ?? fail(`unknown item ${expected.id}`);
    const actual = computeRoutes(item, c.settings as Settings);

    if (actual.length !== expected.routes.length)
      fail(`${c.name}/${expected.id}: ${actual.length} routes, expected ${expected.routes.length}`);

    expected.routes.forEach((e, i) => {
      const a = actual[i]; // array order IS the ranking — significant
      const same =
        a.machineId === e.machineId &&
        a.outputId === e.outputId &&
        a.inputCount === e.inputCount &&
        a.outputCount === e.outputCount &&
        a.value === e.value &&
        a.extraCost === e.extraCost &&
        Math.abs(a.perInputValue - e.perInputValue) < EPS &&
        a.effectiveDays === e.effectiveDays &&
        (a.goldPerDay === null
          ? e.goldPerDay === null
          : e.goldPerDay !== null && Math.abs(a.goldPerDay - e.goldPerDay) < EPS) &&
        a.best === e.best &&
        a.appliedBonuses.map((b) => b.key).join(',') === e.appliedBonuses.join(',');
      if (!same)
        fail(
          `${c.name}/${expected.id} route ${i} (${e.machineId}):\n` +
            `    expected ${JSON.stringify(e)}\n    actual   ${JSON.stringify(a)}`,
        );
      checks++;
    });
  }
}

console.log('engine/parity');
console.log(`  ✓ ${fixture.cases.length} settings × ${ITEMS.length} items → ${checks} routes match shared/fixtures/parity.json ✅`);
