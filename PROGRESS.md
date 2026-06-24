# StardewMaxxing — Build Progress

> Single source of truth for resuming this build after a context/token reset.
> Update the **Current state** block + check off the task at the end of every task.

## Current state
- **Done:** v0.1 (T0–T9) + v0.2 (V1–V6) + v0.3 (P1–P3). ✅ App complete & verified in-browser.
- **v0.3 added (player-feedback pass):** game-accurate **profession tree** (Lvl 5 Rancher⊕Tiller →
  Lvl 10 Artisan/Agriculturist or Coopmaster/Shepherd) as two labeled dropdowns; added missing
  **Rancher +20%** to raw animal products (milk/egg/wool/truffle); **whole-day "collect next
  morning" model** for gold/day (`effectiveDays = ⌈days⌉`, Wine 6.25→7); ranking toggle now
  **highlights the active column with ▼**; **metric legend** explains Total gold (per-input) vs
  Gold/day. Settings shape changed: `artisan`/`tiller` booleans → `level5`/`level10` enums.
- **v0.2 added:** full fish roster (**140 items, 56 fish** incl. Bream/Chub/legendaries);
  per-fish roe routes (Fish Pond→Roe `30+floor(price/2)`, Preserves Jar→Aged Roe `2×`,
  Sturgeon→Caviar 500); **real game sprites** for all 140 items in `src/assets/items/<id>.png`
  (committed, downloaded by `build:data`); `ItemIcon` renders them (`import.meta.glob`, pixelated,
  emoji-tile fallback); attribution (NOTICE.md + README + in-app footer + build credit line).
- **Next step:** none — v0.3 verified & **re-packaged** (`release/StardewMaxxing.app` + DMG rebuilt
  2026-06-17, includes the ErrorBoundary). Future ideas: crab-pot shellfish, product/output icons in
  the results rows, app icon
  (electron-builder still uses the default), tidy the generated zh aged-roe names (e.g. 腌鲷鱼鱼籽 has
  a redundant 鱼).
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
DAY = 1600 min. **gold/day uses whole-day occupancy: effectiveDays = ⌈rawMinutes/1600⌉** (machines
emptied each morning), so Wine 6.25→7d, Jelly 2.5→3d, sub-day machines →1d, Dehydrator stays 1d.
Professions affecting price: Tiller +10% raw crops/flowers, Rancher +20% raw animal products
(milk/egg/wool/truffle), Artisan +40% artisan goods. zh: 农耕人/畜牧人/工匠/农业学家/鸡舍大师/牧羊人.
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

### Packaged-app blank window (fixed)
The renderer always rendered fine (verified via CDP: full DOM, CSS, no errors), but the packaged
window could show a blank/half-painted frame on some macOS GPU setups. Fix in `electron/main.ts`:
`app.disableHardwareAcceleration()` + `show:false` until `ready-to-show` + a 3s `isVisible` fallback
so the window can't get stuck hidden. Diagnose packaged-render issues with
`--remote-debugging-port` + CDP `Page.captureScreenshot` (screencapture needs screen-recording perms).

## v0.3 — player-feedback pass (done & re-packaged)
- [x] **P1** Profession tree — `Settings.level5/level10` enums; +Rancher 1.2 in compute; raw
      animal-product `rancherEligible` flag; two labeled dropdowns in SettingsPanel; updated tests
- [x] **P2** Whole-day gold/day — `effectiveDays = ⌈days⌉` in compute; ResultsTable shows whole
      days + raw-time tooltip; ranking toggle highlights active column (▼); metric legend added
- [x] **P3** i18n — rancher/agriculturist/coopmaster/shepherd/level5/level10/legend strings (EN+zh,
      official wiki zh names); verified in-browser (Starfruit, Milk+Rancher, EN↔中文); 15 tests green
- [x] **P4** Error safeguards — `ErrorBoundary` wraps the app (renders the real error + stack inline
      instead of a blank screen; smoke-test via `?boom`); `routes.smoke.test.ts` validates every route
      field over all items × settings; `npm test` now runs all 3 test files; added `npm run verify`
      (tsc + tests). Goal: surface render errors in `npm run dev`, not after packaging.
- [x] **P5** Animal-product accuracy + ranking — (a) **gold/day no longer buries instant "Sell raw"**:
      an instant route ranks at its full value, so it wins when it nets more than a slower route
      (compute.ts `rateOf`). (b) **Large Egg → gold-quality Mayo 285** (was flat 190); **Large Milk →
      gold Cheese 345**, **Large Goat Milk → gold Goat Cheese 600** (machines.ts). Confirmed correct
      (not bugs): artisan goods don't inherit input STAR quality (only large eggs/milk + Cask aging
      raise quality), and Rancher (+20% raw animal products) does NOT apply to Mayo/Cheese — those are
      Artisan goods, and Artisan is the opposite Lvl-5 branch from Rancher. +4 tests (19 green).
- [x] **P6** Fish Smoker coal cost — the smoker burns 1 coal/fish; `perInputValue` is now NET of
      consumable costs (`EXTRA_INPUT_COST = { coal: 15 }`, coal's wiki sell value). `value` stays the
      gross Smoked-Fish sell price; the row shows "<gross>g − 15g coal" and ranks on net. e.g. Bream
      Smoked 90g → nets 75g. Legend updated. To value coal differently, edit `EXTRA_INPUT_COST` in
      compute.ts. +1 test (20 green).
- [x] **P7** Fishing professions — second skill tree in Settings (`fishingLevel5/10`): **Fisher +25%**,
      **Angler +50%** (Angler supersedes Fisher, no stacking); Trapper/Pirate/Mariner/Luremaster are
      informational. Applies to **raw fish + Smoked Fish only** (`fishEligible`); Roe/Aged Roe/Caviar
      have no category → unaffected (wiki). Also fixed **Smoked Fish**: it's an artisan good AND keeps
      input quality (`artisanGood/qualitySensitive/fishEligible: true`), so Fisher/Angler + Artisan +
      quality all stack on it (e.g. Sturgeon Smoked = 200×2×1.5 Angler ×1.4 Artisan). zh names from
      wiki (渔夫/捕猎者/垂钓者/海盗/水手/诱饵大师). +3 tests (23 green).
- [x] **P8** Context-aware profession selectors — `profRelevance(item)` (compute.ts) returns which
      trees can change ANY of the item's routes; `App` passes it to `SettingsPanel`, which shows the
      Farming and/or Fishing block only when relevant (else "No profession affects this item."). Crops/
      animal products → Farming only; **fish → BOTH** (fishing for raw/smoked + farming because Artisan
      boosts Smoked Fish & Caviar); plain Roe → neither; hops → Farming only (no fishing). +1 test (24).
- [x] **P9** Active-metric emphasis + Summer Squash — the ranked metric's number now carries the coin
      and the OTHER is dimmed (ResultsTable), so the BEST row's prominent number always matches the
      sorted column (fixes "Dehydrator 125 looks best but Wine 240 is higher" — that was Gold/day mode:
      Dehydrator 1d beats Wine 7d). Added **Summer Squash** (45g vegetable, zh 夏南瓜) to catalog +
      generated.json → 141 items.
- [x] **P10** Instant-price display + fish/roe split — (a) "Sell raw" now shows its price in the
      Gold/day column with a small "instant" tag (so its rank is legible). (b) **Roe is its own
      searchable item, derived per-fish** in `data/items.ts` (`30 + ⌊fish price ÷ 2⌋`; Sturgeon →
      Caviar). Removed the Fish Pond machine + the fish→roe Jar branch + the standalone generic roe
      items, so a **fish's table is just Sell raw + Smoker** and roe stands alone (Bream Roe 52 → Aged
      104; Sturgeon Roe 130 → Caviar 500). 195 items, 24 tests green.
- [x] **P11** One-click profession picker — replaced the 2 dropdowns/skill with single-row sv-btn
      groups collapsed to the price-relevant picks (Farming: None/Tiller/Artisan/Rancher; Fishing:
      None/Fisher/Angler), so a full build is 1 click/skill (was ~4). Each button maps to the
      underlying level5/level10; a hint line shows the selected bonus. Speed/utility perks omitted
      (no sell-value effect). Context-aware show/hide + i18n preserved.
- **Packaging:** renderer served over a custom `app://` scheme (not file://) to fix raw-text/blank
  windows; `npm run package` self-runs a CDP smoke test (`scripts/smoke-package.mjs`) that fails the
  build if the packaged app doesn't render. `package.json` backed up/restored around electron-builder.

## Verification (run at T9, spot-check earlier)
1. `npm run dev` → Electron window with HMR.
2. Search **Starfruit / 星之果实**, Artisan ON → **Wine** best (~2,250g+); cross-check wiki.
3. Switch ranking to gold/day → faster routes (Jar/Dehydrator) can overtake Keg.
4. Input quality = iridium → Sell raw / Cask rises vs Keg (which ignores quality).
5. Switch to 中文 → every item/machine/UI string shows official names.
6. `npm run build && npm run package` → launchable `StardewMaxxing.app`.
