// Deep-compares two route snapshots, ignoring key order.
import { readFileSync } from 'node:fs';
const norm = (v) => Array.isArray(v) ? v.map(norm)
  : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, norm(v[k])]))
  : v;
const [a, b] = process.argv.slice(2).map(f => JSON.parse(readFileSync(f, 'utf8')));
let diffs = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  const x = JSON.stringify(norm(a[i])), y = JSON.stringify(norm(b[i]));
  if (x !== y) { if (diffs < 8) { console.log(`\nDIFF #${i} ${a[i]?.id ?? b[i]?.id}`); console.log(' old:', x.slice(0, 700)); console.log(' new:', y.slice(0, 700)); } diffs++; }
}
console.log(diffs === 0 ? `\n✅ IDENTICAL — ${a.length} items, byte-for-byte equal route output` : `\n❌ ${diffs} items differ`);
process.exit(diffs === 0 ? 0 : 1);
