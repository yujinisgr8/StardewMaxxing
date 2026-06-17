# CLAUDE.md — StardewMaxxing

Local Electron macOS app: a Stardew Valley income optimizer. Enter an item → ranked table of
every processing route with sell value + gold/day, best highlighted. Bilingual EN/简体中文.

**Read `PROGRESS.md` first** — it holds the live task checklist and the current state/next step.

## Stack
- Electron + Vite + React + TypeScript, Tailwind CSS.
- Light state via React state/Context.
- Game data bundled as static JSON → app is fully offline.

## Source of truth
**https://stardewvalleywiki.com and its child pages** are authoritative for all prices,
formulas, batch sizes, processing times, and names (incl. official zh-Hans via the wiki's
Chinese pages). If memory disagrees with the wiki, the wiki wins. Each generated item carries
a `source` URL.

## Layout
```
electron/{main,preload}.ts     # window + lifecycle; contextIsolation on
scripts/catalog.ts             # curated list: page title + category/tags (taxonomy)
scripts/build-data.ts          # fetch wiki → src/data/items.generated.json (npm run build:data)
src/
  engine/
    types.ts                   # Item, Machine, ProcessRoute, Settings
    machines.ts                # machine transform rules (the formulas)
    compute.ts                 # computeRoutes(item, settings) -> ranked ProcessRoute[]
    items.schema.ts            # runtime validation
  data/items.generated.json    # 97 wiki-sourced items (loaded by data/items.ts)
  data/items.seed.json         # 26 hand-verified items (test reference/fallback)
  i18n/{index,en,zh}.ts
  components/{SearchBar,SettingsPanel,ResultsTable,ItemIcon,LanguageToggle}.tsx
  styles/theme.css             # Stardew palette / parchment panels / wooden frames
  App.tsx, main.tsx
```

## Core formulas (encode exactly per wiki; verify against the machine pages)
- **Keg:** fruit→Wine `base×3`; veg→Juice `round(base×2.25)`; specials Hops→Pale Ale,
  Wheat→Beer, Coffee Bean×5→Coffee, Honey→Mead, Tea Leaves→Green Tea, etc.
- **Preserves Jar:** fruit→Jelly `2×base+50`; veg→Pickles `2×base+50`; roe→Aged Roe.
- **Dehydrator:** fruit→Dried Fruit `7.5×base+25` (×5 batch); mushroom→Dried Mushroom; Grapes→Raisins.
- **Cask:** ages Wine/Beer/Mead/Pale Ale/Cheese/Goat Cheese → iridium `×2`.
- **Fish Smoker:** fish→Smoked Fish `×2`.
- **+ Sell raw** baseline.

## Modifiers (each a Settings toggle)
- Artisan +40% (artisan goods only). Tiller +10% (raw crops).
- Input quality (normal/silver×1.25/gold×1.5/iridium×2) → raw sale & cask only; kegs/jars/
  dehydrator normalize to base quality.
- Ranking metric: total gold vs gold/day (value ÷ processing days, account for batch size).

## Run
- Dev: `npm install && npm run dev`
- Refresh data: `npm run build:data`
- Package: `npm run build && npm run package`
