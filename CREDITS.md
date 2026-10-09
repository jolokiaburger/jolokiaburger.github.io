# Credits and licences

Everything in this folder was made for Neon Tides. Nothing was copied from another game, stock library, font foundry or sound pack. Two reference images were shown during development as mood references only (a synthwave sunset over a grid, and a neon noodle-shop logo); neither was traced, reproduced or reused — the moon, the tube lettering, the neon jellyfish and the grid here are original drawings in the same spirit.

## Origins

| Asset | Where it lives | Origin |
| --- | --- | --- |
| Harbour illustration (sky, banded moon, skyline, Line 9 viaduct and train, water grid and waves, four destinations, the KURAGE 33 tube sign with its neon jellyfish, ferry, jellyfish, rain, the case-specific pieces: the Grey Kittiwake's masts, the wild green jelly, the stacked tank lids, and Mei's gold board for the gold night) | inline SVG in `index.html` | Drawn by hand as SVG shapes, gradients and patterns for this project |
| Current character portraits (all 15 speakers) | `assets/portraits/*-manga.webp` | Original images generated with OpenAI's built-in image-generation tool, exported as compact 512 px WebP. Direction and complete prompts: `ART-DIRECTION.md`. No existing manga characters or panels were used as assets. |
| Earlier character portraits | `assets/portraits/*.svg` | Original native SVG illustrations, retained as earlier versions |
| Updated harbour figures, salvage yard and lighthouse | inline SVG in `index.html` | Original native SVG, with clothing and hair coordinated with the current portraits |
| Night Market scene and three character sprites | `assets/scenes/lantern-market.webp`, `assets/sprites/*-market.webp` | Original illustrations generated with OpenAI's built-in image-generation tool. Sprite identities reference the game's own portraits. Native SVG signage, map targets and state overlays are authored in `index.html`. Prompts: `tools/night-market-art-prompts.json`. |
| Favicon (jellyfish) and the home-screen icons rendered from it | `assets/favicon.svg`, `assets/*.png` | Original SVG; the PNGs are rendered from it by `tools/icons.mjs` |
| Story, characters, dialogue, place names, brands (Kurage 33, Tiger Volt, OX-9, Frostline, Meridian Private Aquaria, Haldane Marine Credit, the Grey Kittiwake, tug Vidar, Bellwater Basin, Bell Reef, Line 9; for the gold night, Hollis, Oduya, the salvage boat Long Patience, Harbour Savings, the Heron) | `cases.js`, `trade.js`, `dialogue.js`, `expansion.js`, `night-market.js` | Written for this project. All people, companies, brands, vessels and places are fictional |
| The gold market's numbers and model (base price, district offsets, event envelopes, seeded noise) | `trade.js`, `market.js` | Invented for the game; not modelled on any real market's data |
| Interface text and layout | `index.html`, `styles.css`, `game.js` | Original |
| Boat radio: rain ambience, *Lantern FM*, *Basin Lo-Fi*, the ferry's horn, engine, hull bump and bell, gold-scale/receipt cues, market ceramics/grill/repair ambience, and Nao's pentatonic opening phrase | generated at runtime in `game.js` (the *BOAT RADIO* section) | Filtered noise, a Karplus-Strong plucked-string model and oscillator synthesis through the Web Audio API. Both stations and all effects are original procedural sounds; no recorded audio, samples or sound fonts are bundled |

## Kisaragi expansion

`assets/scenes/kisaragi-canal.webp` and the Hana, Jun and Mako portraits in `assets/portraits/` are original illustrations created with OpenAI's built-in image-generation tool for this game. They use adult manga-inspired fine ink, crosshatching and muted amber/teal colour. The town, characters, festival invitation and parcel dialogue in `canal-town.js` are original fictional content. Scene labels and interaction targets in `index.html` are native SVG. Artwork and story follow the project's CC BY 4.0 split; code follows MIT.

## Fonts

No font files are bundled and none are downloaded. The stylesheet asks for fonts that already exist on the player's device and falls back gracefully:

- Interface: Bahnschrift → Trebuchet MS → Segoe UI → sans-serif-condensed (Android's Roboto Condensed) → system sans-serif
- Story text: Trebuchet MS → Segoe UI → system-ui → sans-serif
- Clue text: Cascadia Mono → Consolas → SF Mono → Menlo → monospace
- Signage in the picture: Impact → Arial Black → Bahnschrift → Arial Narrow → sans-serif-condensed → sans-serif (the KURAGE 33 sign is pinned to its width with `textLength`, so any fallback fits)

## Third-party code

None. The game uses only what browsers provide (DOM, CSS, SVG, `localStorage`, Web Audio). The optional test tooling in `tools/` (Node scripts that drive a headless Chromium browser over the DevTools Protocol) uses only Node's built-in modules and is not needed to play.

## Licence

See the `LICENSE` file. In short:

- Code (`game.js`, `market.js`, `styles.css`, the markup of `index.html`, `tools/*.mjs`, the data structures of `cases.js`, `trade.js`, `dialogue.js`, `expansion.js` and `night-market.js`): MIT.
- Artwork and story text (the SVG illustration, portraits, dialogue, clue wording, scene descriptions, endings, documentation prose): Creative Commons Attribution 4.0 (CC BY 4.0).

If you reuse the artwork or text elsewhere, credit it as "Artwork and story from *Neon Tides*, CC BY 4.0". The copyright line in `LICENSE` names "Neon Tides contributors"; replace it with your own name if you publish under yours.

