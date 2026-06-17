# StardewMaxxing 🌾

A local macOS desktop app that tells you the most profitable thing to do with any Stardew
Valley item — sell it raw, or turn it into wine, jelly, dried fruit, smoked fish, and so on.

Enter an item and get a ranked table of every processing route with its sell value and
gold-per-day, with the best option highlighted. Toggle for the **Artisan** (+40%) and
**Tiller** (+10%) professions, input star quality, and whether to optimize total gold or
gold/day. Fully bilingual: **English + 简体中文** with the official in-game item names.

All game data comes from the [Stardew Valley Wiki](https://stardewvalleywiki.com).

## Develop
```bash
npm install
npm run dev          # launch the app (Electron + Vite HMR)
npm run build:data   # refresh the bundled item dataset from the wiki
npm run package      # build a distributable StardewMaxxing.app
```

See `PROGRESS.md` for build status and `CLAUDE.md` for architecture.

## Credits

Unofficial, non-commercial fan project — not affiliated with ConcernedApe.
Stardew Valley © ConcernedApe. Item sprites & game data from the
[Stardew Valley Wiki](https://stardewvalleywiki.com) (CC BY-NC-SA). See [NOTICE.md](NOTICE.md).
