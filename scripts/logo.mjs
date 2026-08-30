// App icon source of truth: "Golden Parsnip Coin".
//
// The coin face is pixel art on a 32x32 grid; the frame around it is drawn in continuous
// space so the icon takes macOS's squircle silhouette instead of a hard-edged square.
// Every colour comes from the app's Tailwind palette (tailwind.config.js) so the icon and
// the UI stay in sync.
//
//   npm run build:icon    # writes build/icon.{svg,png,icns} + public/icon.svg
//
// electron-builder is pointed at build/icon.icns (package.json → build.mac.icon).
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- macOS icon grid ----------------------------------------------------------------
// Big Sur and later expect the artwork to be a rounded square floating in a transparent
// canvas, NOT a full-bleed square: a full-bleed icon reads as oversized next to its
// neighbours and its sharp corners look clipped by the Dock/Finder grid.
// Apple's spec at 1024 is an 824x824 continuous-corner square. We use 832 so one grid
// cell is exactly 26px and the pixel art never lands on a half pixel; the 8px difference
// is invisible at every rendered size.
const N = 32;                          // art grid cells
const CANVAS = 1024;                   // full icon canvas
const ART = 832;                       // the rounded square inside it (26px per cell)
const CELL = ART / N;                  // 26
const INSET = (CANVAS - ART) / 2;      // 96px of transparent margin per side
const SQ = 5;                          // superellipse exponent ≈ Apple's continuous corner
const HALF = ART / 2;

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
}

// --- the coin, as pixel art (the frame/parchment behind it is drawn in continuous space) ---
const g = new Grid();

// flat face, one shade arc lower-right, one highlight arc upper-left
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

// the parsnip struck into the face
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

// glints
g.set(9, 11, 's'); g.set(10, 11, 's'); g.set(9, 12, 's');
g.set(12, 6, 's'); g.set(24, 22, 's');

// --- the frame, in continuous space ---------------------------------------------------
// `f` is the superellipse radius of a point: 1 at the icon's edge, 0 at its centre.
// Ring boundaries are expressed in grid cells inward from that edge, so the frame keeps the
// same proportions as the pixel art it wraps.
function shapeAt(x, y) {
  const dx = (x - CANVAS / 2) / HALF;
  const dy = (y - CANVAS / 2) / HALF;
  const f = (Math.abs(dx) ** SQ + Math.abs(dy) ** SQ) ** (1 / SQ);
  if (f > 1) return null;                     // outside the squircle → transparent
  const inward = (1 - f) * (N / 2);           // distance from the edge, in grid cells
  const lit = dx + dy < 0;                    // the tile is lit from the top-left
  if (inward < 1) return 'k';                 // outline
  if (inward < 1.6) return lit ? 'l' : 'W';   // bevel
  if (inward < 3) return 'w';                 // wood
  const gx = Math.floor((x - INSET) / CELL);
  const gy = Math.floor((y - INSET) / CELL);
  const ch = g.g[gy]?.[gx] ?? '.';
  if (ch !== '.') return ch;                  // the coin sits on top of the field
  if (inward < 4 && lit) return 'q';          // inner lip, so the parchment sits *inside* the wood
  return 'p';
}

// --- raster ---------------------------------------------------------------------------
// Supersampled so the curved frame is antialiased and the small sizes are box-filtered from
// the real geometry rather than downscaled from the 1024 (which mushes the pixel art).
function renderRGBA(px) {
  const ss = Math.max(4, Math.min(32, Math.round(CANVAS / px)));
  const step = CANVAS / px / ss;
  const buf = Buffer.alloc(px * px * 4);
  let p = 0;
  for (let y = 0; y < px; y++) {
    for (let x = 0; x < px; x++) {
      let r = 0, gr = 0, b = 0, hits = 0;
      const x0 = (x * CANVAS) / px, y0 = (y * CANVAS) / px;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const hex = PAL[shapeAt(x0 + (sx + 0.5) * step, y0 + (sy + 0.5) * step)];
          if (!hex) continue;
          r += parseInt(hex.slice(1, 3), 16);
          gr += parseInt(hex.slice(3, 5), 16);
          b += parseInt(hex.slice(5, 7), 16);
          hits++;
        }
      }
      if (hits) {
        buf[p] = Math.round(r / hits);
        buf[p + 1] = Math.round(gr / hits);
        buf[p + 2] = Math.round(b / hits);
        buf[p + 3] = Math.round((hits / (ss * ss)) * 255);
      }
      p += 4;
    }
  }
  return buf;
}

// PNG is encoded by hand rather than shelled out to a rasteriser, so the icon stays
// reproducible with no extra deps.
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

function toPNG(px) {
  const rgba = renderRGBA(px);
  const stride = px * 4;
  const raw = Buffer.alloc((stride + 1) * px);
  for (let y = 0; y < px; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(px, 0);
  ihdr.writeUInt32BE(px, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- vector ---------------------------------------------------------------------------
// The superellipse has no exact SVG primitive (rx gives circular corners, not Apple's
// continuous ones), so each ring is emitted as a dense polygon — smooth at any scale.
function sePath(t, points = 256) {
  let d = '';
  for (let i = 0; i < points; i++) {
    const a = (i / points) * 2 * Math.PI;
    const cs = Math.cos(a), sn = Math.sin(a);
    const x = CANVAS / 2 + Math.sign(cs) * Math.abs(cs) ** (2 / SQ) * HALF * t;
    const y = CANVAS / 2 + Math.sign(sn) * Math.abs(sn) ** (2 / SQ) * HALF * t;
    d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + 'Z';
}

function toSVG({ tight = false } = {}) {
  // Coin pixels, run-length merged along each row.
  let art = '';
  for (let y = 0; y < N; y++) {
    let x = 0;
    while (x < N) {
      const ch = g.g[y][x];
      let w = 1;
      while (x + w < N && g.g[y][x + w] === ch) w++;
      if (PAL[ch]) {
        art += `<rect x="${INSET + x * CELL}" y="${INSET + y * CELL}" width="${w * CELL}" height="${CELL}" fill="${PAL[ch]}"/>`;
      }
      x += w;
    }
  }
  const r = (t) => 1 - t / (N / 2); // ring boundary t cells inward from the edge
  // Bottom-right half-plane, used to carve the lit/shaded halves of the bevel and the lip.
  const br = `<clipPath id="br"><path d="M${CANVAS} 0L${CANVAS} ${CANVAS}L0 ${CANVAS}Z"/></clipPath>`;
  const box = tight ? `${INSET} ${INSET} ${ART} ${ART}` : `0 0 ${CANVAS} ${CANVAS}`;
  const size = tight ? ART : CANVAS;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}" width="${size}" height="${size}" shape-rendering="crispEdges">` +
    `<defs>${br}</defs>` +
    `<path d="${sePath(1)}" fill="${PAL.k}"/>` +
    `<path d="${sePath(r(1))}" fill="${PAL.l}"/>` +
    `<path d="${sePath(r(1))}" fill="${PAL.W}" clip-path="url(#br)"/>` +
    `<path d="${sePath(r(1.6))}" fill="${PAL.w}"/>` +
    `<path d="${sePath(r(3))}" fill="${PAL.q}"/>` +
    `<path d="${sePath(r(3))}" fill="${PAL.p}" clip-path="url(#br)"/>` +
    `<path d="${sePath(r(4))}" fill="${PAL.p}"/>` +
    art +
    `</svg>`
  );
}

// --- output ---------------------------------------------------------------------------
const buildDir = join(ROOT, 'build');
mkdirSync(buildDir, { recursive: true });
writeFileSync(join(buildDir, 'icon.svg'), toSVG());
// served copy for the renderer's <link rel="icon">: cropped to the artwork, since a favicon
// has no Dock grid to sit in and shouldn't waste 19% of its box on macOS margin.
mkdirSync(join(ROOT, 'public'), { recursive: true });
writeFileSync(join(ROOT, 'public', 'icon.svg'), toSVG({ tight: true }));

// A real .icns: every size rendered from the geometry at its own resolution, instead of
// letting the packager downscale one 1024 bitmap.
const ICONSET = [
  [16, 'icon_16x16.png'], [32, 'icon_16x16@2x.png'],
  [32, 'icon_32x32.png'], [64, 'icon_32x32@2x.png'],
  [128, 'icon_128x128.png'], [256, 'icon_128x128@2x.png'],
  [256, 'icon_256x256.png'], [512, 'icon_256x256@2x.png'],
  [512, 'icon_512x512.png'], [1024, 'icon_512x512@2x.png'],
];
const setDir = join(buildDir, 'icon.iconset');
rmSync(setDir, { recursive: true, force: true });
mkdirSync(setDir, { recursive: true });
const cache = new Map();
for (const [px, file] of ICONSET) {
  if (!cache.has(px)) cache.set(px, toPNG(px));
  writeFileSync(join(setDir, file), cache.get(px));
}
writeFileSync(join(buildDir, 'icon.png'), cache.get(1024));
execFileSync('iconutil', ['-c', 'icns', setDir, '-o', join(buildDir, 'icon.icns')]);
rmSync(setDir, { recursive: true, force: true });
console.log(
  `wrote build/icon.icns (${ICONSET.length} sizes, 16→1024), build/icon.png (1024x1024), ` +
    `build/icon.svg, public/icon.svg`
);
