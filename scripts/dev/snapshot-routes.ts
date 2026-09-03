// Behaviour guard for the machines.ts -> machines.json refactor.
// Snapshots every machine's raw RouteResult for every item. These are settings-independent,
// so they pin exactly the layer being refactored. Usage: tsx scripts/dev/snapshot-routes.ts <out.json>
import { writeFileSync } from 'node:fs';
import { ITEMS } from '../../src/data/items';
import { MACHINES } from '../../src/engine/machines';

const snap = ITEMS.map((item) => ({
  id: item.id,
  routes: MACHINES.map((m) => ({ machine: m.id, result: m.transform(item) })),
}));

const out = process.argv[2] ?? 'baseline.json';
writeFileSync(out, JSON.stringify(snap, null, 2));
console.log(`snapshot: ${snap.length} items x ${MACHINES.length} machines -> ${out}`);
