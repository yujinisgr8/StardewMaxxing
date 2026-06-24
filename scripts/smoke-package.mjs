// Post-package smoke test. Launches the PACKAGED app headless, attaches via the Chrome
// DevTools Protocol, and asserts the renderer actually mounted — so a broken build
// (blank screen / raw-source / crash / missing assets) fails CI *before* anyone opens
// the .app by hand. Run directly: `node scripts/smoke-package.mjs` (or via `npm run package`).
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RELEASE = 'release';
const PORT = 9333;

function findBinary() {
  // release/<arch>/StardewMaxxing.app/Contents/MacOS/StardewMaxxing
  for (const dir of existsSync(RELEASE) ? readdirSync(RELEASE) : []) {
    const bin = join(RELEASE, dir, 'StardewMaxxing.app', 'Contents', 'MacOS', 'StardewMaxxing');
    if (existsSync(bin)) return bin;
  }
  return null;
}

const bin = findBinary();
if (!bin) {
  console.error('✗ smoke: packaged app not found under release/ — run `npm run package` first.');
  process.exit(1);
}

const child = spawn(bin, [`--remote-debugging-port=${PORT}`], {
  env: { ...process.env, SMOKE_TEST: '1', ELECTRON_ENABLE_LOGGING: '1' },
  stdio: 'ignore',
});

let finished = false;
const finish = (code, msg) => {
  if (finished) return;
  finished = true;
  if (msg) console[code === 0 ? 'log' : 'error'](msg);
  try { child.kill('SIGKILL'); } catch {}
  process.exit(code);
};
const failTimer = setTimeout(() => finish(1, '✗ smoke: timed out after 25s (app never became inspectable).'), 25000);

async function run() {
  // Wait for the debugger endpoint, then for a page target.
  let page = null;
  for (let i = 0; i < 50 && !page; i++) {
    try {
      const list = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
      page = list.find((t) => t.webSocketDebuggerUrl && t.type === 'page');
    } catch {}
    if (!page) await new Promise((r) => setTimeout(r, 300));
  }
  if (!page) return finish(1, '✗ smoke: no renderer window (the app failed to start).');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const errors = [];
  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
    if (m.method === 'Runtime.exceptionThrown')
      errors.push('exception: ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text || '').slice(0, 200));
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error')
      errors.push('console.error: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200));
    else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error')
      errors.push('log: ' + (m.params.entry.text || '').slice(0, 200));
  });
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', () => rej(new Error('debugger socket failed'))); });
  await send('Runtime.enable');
  await send('Log.enable');
  // Let the renderer mount and surface any load-time errors (failed assets, CSP, React crash).
  await new Promise((r) => setTimeout(r, 1500));
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result?.value;

  const url = (await ev('location.href')) || '';
  const rootCount = (await ev("document.getElementById('root')?.childElementCount ?? 0")) || 0;
  const h1 = (await ev("document.querySelector('h1')?.innerText")) || '';
  const bodyText = (await ev('document.body?.innerText')) || '';
  ws.close();

  const problems = [];
  if (!url.startsWith('app://')) problems.push(`renderer URL is "${url}" (expected app://…)`);
  if (!(rootCount >= 1)) problems.push('#root is empty — React never mounted (blank screen).');
  if (!/StardewMaxxing/.test(h1)) problems.push(`header heading missing (h1="${h1.slice(0, 40)}").`);
  if (/jsxs|\.jsx\(|className:"/.test(bodyText)) problems.push('window is showing raw JS source instead of the UI.');
  if (errors.length) problems.push('runtime/console errors:\n   - ' + errors.slice(0, 8).join('\n   - '));

  if (problems.length) return finish(1, '✗ smoke: PACKAGED APP IS BROKEN —\n - ' + problems.join('\n - '));
  clearTimeout(failTimer);
  finish(0, `✓ smoke: packaged app renders OK (url=${url}, #root=${rootCount} child, h1="${h1.trim()}", no errors).`);
}

run().catch((e) => finish(1, '✗ smoke: ' + (e?.message || e)));
