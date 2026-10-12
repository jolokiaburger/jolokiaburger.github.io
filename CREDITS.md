# Credits and licences

Neon Tides is maintained by [Neon Tides contributors](https://github.com/jolokiaburger/jolokiaburger.github.io/graphs/contributors). The repository contains the game's code, fictional writing, local illustrations and procedural audio.

## Project content

| Content | Source |
| --- | --- |
| Voyage world, navigation and scenery | [voyage/](voyage/), including native Canvas waterfronts, crew and region chart |
| Classic scenes and interface | [classic.html](classic.html), [styles.css](styles.css), [game.js](game.js) |
| Cast, dialogue and chapters | Root content scripts, [voyage/ports.js](voyage/ports.js), [voyage/conversations.js](voyage/conversations.js) and Voyage subsystem modules |
| Portraits, scene plates, market sprites and icons | [assets/](assets/); complete inventory in [tools/asset-manifest.json](tools/asset-manifest.json) |
| Economic definitions and gold accounting | [trade.js](trade.js), [market.js](market.js) |
| Music and sound effects | [game.js](game.js), [halloween-radio.js](halloween-radio.js), [voyage/sound.js](voyage/sound.js) |

Characters, vessels, companies, places and the Basin's economic model are fictional. The illustrations and writing are project content; third-party game characters, dialogue, screenshots and recorded music are not bundled.

## Fonts and dependencies

The interface uses system font stacks. No font files or runtime libraries are bundled or downloaded. The browser supplies DOM, CSS, SVG, Canvas, local storage and Web Audio.

Most validation scripts use Node's built-in modules. The optional [tools/voyage-render-checks.mjs](tools/voyage-render-checks.mjs) uses `@napi-rs/canvas` as a separately installed development dependency. It is not included in the deployed game; its own distribution retains its licence terms.

## Factual references

Two optional character notebook entries paraphrase public scientific background and provide source links:

- Kenji's electrical-contact note: [USGS, Gold Fact Sheet, 2002](https://pubs.usgs.gov/of/2002/of02-303/OFR_02-303.pdf).
- Mio's constellation note: [NASA, Discovering the Universe Through the Constellation Orion](https://science.nasa.gov/universe/stories/quick-reads/discovering-the-universe-through-the-constellation-orion/).

These references support the individual facts in [voyage/conversations.js](voyage/conversations.js). No source illustrations or extended source passages are included. They do not describe the fictional harbour economy or establish a character's rumour as fact.

## Reuse terms

[LICENSE](LICENSE) defines the split:

- **MIT:** executable code, HTML structure, styles, tools and data structures.
- **CC BY 4.0:** artwork, dialogue, story descriptions, endings and documentation prose, including that content embedded in source files.

Retain the MIT copyright and licence notice when redistributing code. For artwork or text, provide appropriate attribution, a link to CC BY 4.0 and an indication of changes. Suggested attribution: “Artwork and story from Neon Tides, CC BY 4.0.” The copyright holder is Neon Tides contributors. Preserve the existing notices when adding your own contribution credit.
