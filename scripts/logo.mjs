// App icon source of truth: "Golden Parsnip Coin".
//
// Pixel art on a 32x32 grid. Every colour comes from the app's Tailwind palette
// (tailwind.config.js) so the icon and the UI stay in sync.
//
//   npm run build:icon              # writes build/icon.svg + build/icon.png (1024x1024)
//
// electron-builder picks build/icon.png up automatically and derives the .icns from it.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const N = 32;      // grid cells
const SCALE = 32;  // -> 1024px viewBox, an exact multiple so pixels stay square

const PAL = {
  '.': null,
  k: '#3a2010', // frame outline (darker than ink, so the tile reads on any wallpaper)
  W: '#6b4226', // wood.dark
  w: '#8b5a2b', // wood.DEFAULT
  l: '#c98b4b', // wood.light
  p: '#f5e3c0', // parchment.DEFAULT
  P: '#fbeeca', // parchment.light
  q: '#e8cf9f', // parchment.dark
  c: '#f3c33a', // coin.DEFAULT
  C: '#c98a1e', // coin.dark
  L: '#fbe08a', // coin highlight
  o: '#8a5c10', // engraving
  g: '#7ab317', // leaf.DEFAULT
  G: '#557d12', // leaf.dark
  h: '#b9d96b', // leaf.light
  i: '#4a2717', // ink
  s: '#ffffff', // glint
};

class Grid {
  constructor() {
    this.g = Array.from({ length: N }, () => Array(N).fill('.'));
  }
  set(x, y, ch) {
    if (ch === '.' || x < 0 || y < 0 || x >= N || y >= N) return;
    this.g[y][x] = ch;
  }
  rect(x, y, w, h, ch) {
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) this.set(x + k, y + j, ch);
  }
  disc(cx, cy, r, ch) {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) this.set(x, y, ch);
      }
  }
  stamp(x0, y0, rows) {
    rows.forEach((row, j) => [...row].forEach((ch, k) => this.set(x0 + k, y0 + j, ch)));
  }
  // push a 1px `ch` border outward around every pixel whose char is in `of`
  outline(of, ch) {
    const set = new Set([...of]);
    const add = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (!set.has(this.g[y][x])) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < N && ny < N && !set.has(this.g[ny][nx])) add.push([nx, ny]);
        }
      }
    for (const [x, y] of add) this.set(x, y, ch);
  }
  toSVG() {
    let out = '';
    for (let y = 0; y < N; y++) {
      let x = 0;
      while (x < N) {
        const ch = this.g[y][x];
        let w = 1;
        while (x + w < N && this.g[y][x + w] === ch) w++;
        if (PAL[ch]) {
          out += `<rect x="${x * SCALE}" y="${y * SCALE}" width="${w * SCALE}" height="${SCALE}" fill="${PAL[ch]}"/>`;
        }
        x += w;
      }
    }
    const px = SCALE * N;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${px} ${px}" width="${px}" height="${px}" shape-rendering="crispEdges">${out}</svg>`;
  }
}

const g = new Grid();

// --- wooden frame around a parchment field (the Stardew menu tile) ---
g.rect(0, 0, N, N, 'k');
g.rect(1, 1, N - 2, N - 2, 'w');
g.rect(1, 1, N - 3, 1, 'l');          // bevel: lit from the top-left
g.rect(1, 1, 1, N - 3, 'l');
g.rect(2, N - 2, N - 3, 1, 'W');
g.rect(N - 2, 2, 1, N - 3, 'W');
g.rect(3, 3, 26, 26, 'p');
g.rect(3, 3, 26, 1, 'q');             // inner lip, so the parchment sits *inside* the wood
g.rect(3, 3, 1, 26, 'q');
for (const [x, y] of [[0, 0], [31, 0], [0, 31], [31, 31]]) g.set(x, y, '.');
for (const [x, y] of [[1, 1], [30, 1], [1, 30], [30, 30]]) g.set(x, y, 'k');

// --- the coin: flat face, one shade arc lower-right, one highlight arc upper-left ---
const R = 11.5;
g.disc(16, 16, R, 'c');
for (let y = 0; y < N; y++)
  for (let x = 0; x < N; x++) {
    if (g.g[y][x] !== 'c') continue;
    const dx = x + 0.5 - 16, dy = y + 0.5 - 16;
    const d = Math.hypot(dx, dy);
    if (d > R - 1.6 && dx + dy > 2.5) g.set(x, y, 'C');
    else if (d > R - 1.6 && dx + dy < -2.5) g.set(x, y, 'L');
  }
g.outline('cCL', 'i');

// --- the parsnip struck into the face ---
g.stamp(10, 8, [
  '...o...o.....',
  '..ogo.ogo....',
  '..oggogggo...',
  '...ogggggo...',
  '...oggggo....',
  '....oooo.....',
  '....oPPPo....',
  '....oPPPo....',
  '...oPPPPo....',
  '...oPPPo.....',
  '..oPPPPo.....',
  '..oPPPo......',
  '..oPPo.......',
  '.oPPo........',
  '.oPo.........',
  '.oo..........',
]);

// --- glints ---
g.set(9, 11, 's'); g.set(10, 11, 's'); g.set(9, 12, 's');
g.set(12, 6, 's'); g.set(24, 22, 's');

// --- output -------------------------------------------------------------
// PNG is encoded by hand rather than shelled out to a rasteriser: the art is flat-colour
// pixels, so it deflates directly and the icon stays reproducible with no extra deps.
const CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (const b of buf) c = t[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(CRC(body));
  return Buffer.concat([len, body, crc]);
}

function toPNG(grid, px) {
  const cell = px / N;
  const raw = Buffer.alloc((px * 4 + 1) * px);
  let p = 0;
  for (let y = 0; y < px; y++) {
    raw[p++] = 0; // filter: none
    const row = grid.g[Math.floor(y / cell)];
    for (let x = 0; x < px; x++) {
      const hex = PAL[row[Math.floor(x / cell)]];
      if (!hex) { p += 4; continue; } // transparent
      raw[p++] = parseInt(hex.slice(1, 3), 16);
      raw[p++] = parseInt(hex.slice(3, 5), 16);
      raw[p++] = parseInt(hex.slice(5, 7), 16);
      raw[p++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(px, 0);
  ihdr.writeUInt32BE(px, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const svg = g.toSVG();
mkdirSync(join(ROOT, 'build'), { recursive: true });
writeFileSync(join(ROOT, 'build', 'icon.svg'), svg);
writeFileSync(join(ROOT, 'build', 'icon.png'), toPNG(g, 1024));
// served copy, so the renderer's <link rel="icon"> resolves in dev and in the bundle
mkdirSync(join(ROOT, 'public'), { recursive: true });
writeFileSync(join(ROOT, 'public', 'icon.svg'), svg);
console.log('wrote build/icon.svg, build/icon.png (1024x1024), public/icon.svg');
