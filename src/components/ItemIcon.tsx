import { Category } from '../engine/types';

// Real game sprites downloaded by `npm run build:data` into src/assets/items/<id>.png.
// Vite bundles them; we resolve id → URL at build time.
const SPRITE_URLS = import.meta.glob('../assets/items/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const SPRITES: Record<string, string> = Object.fromEntries(
  Object.entries(SPRITE_URLS).map(([path, url]) => [
    path.split('/').pop()!.replace(/\.png$/, ''),
    url,
  ]),
);

// Fallback (no sprite): colored tile + category glyph.
const FALLBACK: Record<Category, { bg: string; glyph: string }> = {
  fruit: { bg: '#c0392b', glyph: '🍇' },
  vegetable: { bg: '#e67e22', glyph: '🥕' },
  flower: { bg: '#c2418a', glyph: '🌸' },
  forage: { bg: '#558b2f', glyph: '🌿' },
  fish: { bg: '#2e6fa3', glyph: '🐟' },
  roe: { bg: '#d98a2b', glyph: '🟠' },
  milk: { bg: '#cfc5a5', glyph: '🥛' },
  egg: { bg: '#e0b94e', glyph: '🥚' },
  wool: { bg: '#a98fce', glyph: '🧶' },
  mushroom: { bg: '#8d5a3c', glyph: '🍄' },
  other: { bg: '#6b4226', glyph: '✨' },
};

export function ItemIcon({
  id,
  category,
  size = 28,
}: {
  id?: string;
  category: Category;
  size?: number;
}) {
  const sprite = id ? SPRITES[id] : undefined;

  if (sprite) {
    return (
      <span
        className="inline-grid place-items-center rounded-sm border-2 border-wood-dark shrink-0 bg-parchment-light"
        style={{ width: size, height: size }}
      >
        <img
          src={sprite}
          alt=""
          width={size - 6}
          height={size - 6}
          style={{ imageRendering: 'pixelated' }}
        />
      </span>
    );
  }

  const f = FALLBACK[category] ?? FALLBACK.other;
  return (
    <span
      className="inline-grid place-items-center rounded-sm border-2 border-wood-dark shrink-0"
      style={{ width: size, height: size, background: f.bg, fontSize: size * 0.55, lineHeight: 1 }}
      aria-hidden
    >
      {f.glyph}
    </span>
  );
}
