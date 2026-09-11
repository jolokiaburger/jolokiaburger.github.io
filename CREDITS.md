# Credits and licences

Everything in this folder was made for Neon Tides. Nothing was copied from another game, stock library, font foundry or sound pack. Two reference images were shown during development as mood references only (a synthwave sunset over a grid, and a neon noodle-shop logo); neither was traced, reproduced or reused — the moon, the tube lettering, the neon jellyfish and the grid here are original drawings in the same spirit.

## Origins

| Asset | Where it lives | Origin |
| --- | --- | --- |
| Harbour illustration (sky, banded moon, skyline, Line 9 viaduct and train, water grid and waves, four destinations, the KURAGE 33 tube sign with its neon jellyfish, ferry, jellyfish, rain) | inline SVG in `index.html` | Drawn by hand as SVG shapes, gradients and patterns for this project |
| Character portraits (Teo, Auntie Mei, Priya, Matte, Dex, Yumi, Old Lam, the radio) | `assets/portraits/*.svg` | Original SVG, same style |
| Favicon (jellyfish) | `assets/favicon.svg` | Original SVG |
| Story, characters, dialogue, place names, brands (Kurage 33, Tiger Volt, OX-9, Frostline, Meridian Private Aquaria, Bellwater Basin, Line 9) | `cases.js` | Written for this project. All people, companies, brands and places are fictional |
| Interface text and layout | `index.html`, `styles.css`, `game.js` | Original |
| Boat radio: rain ambience, *Lantern FM*, *Basin Lo-Fi*, and the ferry's horn, engine, hull bump and bell | generated at runtime in `game.js` (the *BOAT RADIO* section) | Filtered noise, a Karplus-Strong plucked-string model and oscillator synthesis through the Web Audio API. Both stations and all effects are original procedural sounds; no recorded audio, samples or sound fonts are bundled |

## Fonts

No font files are bundled and none are downloaded. The stylesheet asks for fonts that already exist on the player's device and falls back gracefully:

- Interface: Bahnschrift → Trebuchet MS → Segoe UI → system sans-serif
- Story text: Georgia → Iowan Old Style → Palatino Linotype → serif
- Clue text: Cascadia Mono → Consolas → SF Mono → Menlo → monospace
- Signage in the picture: Impact → Arial Black → Bahnschrift → sans-serif

## Third-party code

None. The game uses only what browsers provide (DOM, CSS, SVG, `localStorage`, Web Audio). The optional test tooling in `tools/` (Node scripts that drive a headless Chromium browser over the DevTools Protocol) uses only Node's built-in modules and is not needed to play.

## Licence

See the `LICENSE` file. In short:

- Code (`game.js`, `styles.css`, the markup of `index.html`, `tools/*.mjs`, the data structure of `cases.js`): MIT.
- Artwork and story text (the SVG illustration, portraits, dialogue, clue wording, scene descriptions, endings, documentation prose): Creative Commons Attribution 4.0 (CC BY 4.0).

If you reuse the artwork or text elsewhere, credit it as "Artwork and story from *Neon Tides*, CC BY 4.0". The copyright line in `LICENSE` names "Neon Tides contributors"; replace it with your own name if you publish under yours.
