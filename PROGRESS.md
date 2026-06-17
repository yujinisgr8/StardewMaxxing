# StardewMaxxing — Build Progress

> Single source of truth for resuming this build after a context/token reset.
> Update the **Current state** block + check off the task at the end of every task.

## Current state
- **Done:** v0.1 (T0–T9) + v0.2 (V1–V6). ✅ App complete, verified, and re-packaged.
- **v0.2 added:** full fish roster (**140 items, 56 fish** incl. Bream/Chub/legendaries);
  per-fish roe routes (Fish Pond→Roe `30+floor(price/2)`, Preserves Jar→Aged Roe `2×`,
  Sturgeon→Caviar 500); **real game sprites** for all 140 items in `src/assets/items/<id>.png`
  (committed, downloaded by `build:data`); `ItemIcon` renders them (`import.meta.glob`, pixelated,
  emoji-tile fallback); attribution (NOTICE.md + README + in-app footer + build credit line).
- **Next step:** none — feature-complete. Future ideas: crab-pot shellfish, product/output
  icons in the results rows, app icon (electron-builder still uses the default), tidy the
  generated zh aged-roe names (e.g. 腌鲷鱼鱼籽 has a redundant 鱼).
- **Artifacts:** `release/StardewMaxxing.app` (in `release/mac-arm64/`) +
  `release/StardewMaxxing-0.1.0-arm64.dmg` (94 MB). Signed locally, not notarized
  (Gatekeeper may need right-click→Open the first time).
- **Verified (v0.2):** `npm test` = **12 green**; Blueberry shows the real blueberry sprite
  (not a grape); Bream → Aged Roe 104 / Smoked 90 / Roe 52 / raw 45 with the fish sprite;
  EN↔中文 ✓; attribution footer ✓; re-packaged ✓.

### Wiki gotchas (for future data work)
- Default WebFetch UA → 403; `action=raw` & `api.php` → disabled. Use `fetch`/curl with a
  **browser User-Agent** against the rendered HTML.
- Chinese lives on a **separate wiki** `zh.stardewvalleywiki.com`, reached via each English
  page's interlanguage link (`title="… – 中文"`). build-data.ts parses that for nameZh.
- Per-item base price = first `\d+g` after the "Sell Price" infobox label (reliable).
- Official zh MACHINE names differ from in-game: Keg=小桶, Preserves Jar=罐头瓶, Cask=木桶,
  Dehydrator=烘干机, Cheese Press=压酪机, Oil Maker=产油机. Mead=蜜蜂酒, Caviar=鱼籽酱,
  Jelly suffix=果酱, Aged Roe=腌鱼籽, Smoked Fish=熏X, Goat Cheese=山羊奶酪. (machines.ts uses these.)

### Verified engine numbers
Wine 3× 10000m, Juice 2.25× 6000m, Pale Ale 300g/2250m, Beer 200g/1750m, Coffee 150g/120m,
Mead 300g/600m, Green Tea 100g/180m; Jelly/Pickles 2×+50 4000m, Aged Roe 2×, Caviar 500g;
Dried 7.5×+25 (5→1, 1 day), Raisins 600g; Smoked 2× 50m; Cask→Iridium ×2 (Wine 56d, Cheese 14d).
DAY = 1600 min.
- **How to run:** `npm install` (done), then `npm run dev` to launch the Electron window.
  `npm run build` to type-check + build headlessly.
- **Blockers:** none. (Note: `npm install` reports audit vulns from electron-builder deps — cosmetic, ignore.)

## What this app is
Local macOS (Electron) desktop app. Type/search a Stardew Valley item → ranked table of
every processing route (sell raw / Keg / Preserves Jar / Cask / Dehydrator / Fish Smoker /
Mayo / Cheese Press / Oil Maker / Loom / Mill …) with sell value + gold/day, best highlighted.
Bilingual EN + 简体中文 (official in-game zh-Hans names). Stardew Valley pixel-art UI.

Source of truth for ALL game data = **https://stardewvalleywiki.com and its child pages.**
When prior knowledge disagrees with the wiki, the wiki wins.

## Task checklist
- [x] **T0** Repo bootstrap & tracking — PROGRESS.md, CLAUDE.md, .gitignore, README.md
- [x] **T1** Electron + Vite + React + TS scaffold — builds clean; `npm run dev` launches window
- [x] **T2** Tailwind + Stardew theme foundation — SV utility classes + bundled Zpix pixel font
- [x] **T3** Engine types & machine rules — `src/engine/{types,machines}.ts` (wiki-verified)
- [x] **T4** Compute + modifiers — `src/engine/compute.ts` + tests; `npm test` = 10 green
- [x] **T5** Data: schema + small seed — `items.schema.ts`, `items.seed.json` (26 items)
- [x] **T6** Data: comprehensive build script — `scripts/{catalog,build-data}.ts` → 97 items
- [x] **T7** i18n + language toggle — `src/i18n/*`, `LanguageToggle.tsx`
- [x] **T8** UI: search, settings, results — SV-styled ranked table, live toggles
- [x] **T9** Verify & package — verified in-app; `release/StardewMaxxing.app` + DMG built

## v0.2 — complete fish/roe + real sprites (done)
- [x] **V1** Roe routes in engine — Fish Pond→Roe, Jar→Aged Roe/Caviar; +2 tests (12 green)
- [x] **V2** Full fish roster — catalog.ts ~56 fish; build:data → 140 items
- [x] **V3** Sprite download — build-data.ts pulls infobox PNGs → src/assets/items/ (committed)
- [x] **V4** ItemIcon real sprites — import.meta.glob, pixelated, fallback; both call sites
- [x] **V5** Attribution — NOTICE.md, README credit, in-app footer, build credit line
- [x] **V6** Verify & re-package — Blueberry/Bream verified in-app; .app + DMG rebuilt

## Verification (run at T9, spot-check earlier)
1. `npm run dev` → Electron window with HMR.
2. Search **Starfruit / 星之果实**, Artisan ON → **Wine** best (~2,250g+); cross-check wiki.
3. Switch ranking to gold/day → faster routes (Jar/Dehydrator) can overtake Keg.
4. Input quality = iridium → Sell raw / Cask rises vs Keg (which ignores quality).
5. Switch to 中文 → every item/machine/UI string shows official names.
6. `npm run build && npm run package` → launchable `StardewMaxxing.app`.
