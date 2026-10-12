# Neon Tides

Neon Tides is a browser game about a night ferry, small trades and the people who work around a lantern-lit harbour. Sailing, food, tea and character stories share a quiet JRPG and lo-fi atmosphere.

[Play Neon Tides](https://jolokiaburger.github.io/) · [Source repository](https://github.com/jolokiaburger/jolokiaburger.github.io) · [Player guide](PLAYER-GUIDE.md) · [Developer tutorial](TUTORIAL.md)

## Game modes

| Mode | Entry point | Current version | Experience |
| --- | --- | --- | --- |
| Voyage | [voyage/index.html](voyage/index.html) | 0.19 | Direct and assisted sailing, eleven quays, fourteen neighbours, gold and cargo trading, passenger trips, fishing, cooking and a continuing expedition |
| Classic | [classic.html](classic.html) | 4.6.1 | Authored harbour scenes, three connected trading chapters and four investigation case files |

[index.html](index.html) is the mode selector. Both modes use local browser saves with separate storage keys. The release version is independent of the save-format version. Existing saves remain supported by the current validators.

Voyage's **Beyond the Breakwater** expedition starts at Nao's Night Market counter through **People → Beyond the Breakwater**. Preparation opens Aonami Tea Island and Shiosai Coastal Station; further conversations affect routes, recipes and the final supper. See [VOYAGE-BREAKWATER.md](VOYAGE-BREAKWATER.md) for the complete subsystem specification.

Voyage 0.19 makes the existing harbour more playable through travelling/hosted supper evenings, three optional lantern sailing courses, **The Wrong Supper Crate**, a unified route board and refined shoreline, coast and character art. Completed expeditions can continue into further harbour nights. Rules and integration contracts are in [VOYAGE-EVENINGS.md](VOYAGE-EVENINGS.md); visual specifications are in [ART-DIRECTION.md](ART-DIRECTION.md).

## Run locally

The game uses HTML, CSS and JavaScript directly. There is no production build step, package installation or backend service.

From the repository root:

```sh
python3 -m http.server 8123
```

Open `http://localhost:8123/`. A static HTTP server provides consistent asset loading and save origins. For phone testing, use the server's address on the same local network. Keep testing saves separate from the production site's origin.

The entry pages can also be opened directly on desktop, but file-origin storage varies by browser. Prefer HTTP for development and QA. Once the files are available locally, gameplay needs no external service. Optional source links in the notebook open external websites only when selected.

## Controls

| Action | Voyage | Classic |
| --- | --- | --- |
| Movement | WASD/arrows, held touch directions, water targeting or Set course | Choose a destination in the scene or destination strip |
| Dock | E or Dock | Arrival follows the selected crossing |
| Journal | J | N |
| Menu | M | M |
| Radio | R | R |
| Pause | P | Reading and panels do not advance simulation time |
| Choose an action | Visible buttons | Visible buttons or 1–9 |
| Close/cancel | Escape | Escape |

Voyage help is available through **Menu → How to play**. Story and activity panels open through explicit player choices. The orange docking message identifies the arrival, closes after six real seconds and can be dismissed immediately.

## Repository structure

| Path | Responsibility |
| --- | --- |
| [voyage/](voyage/) | Voyage world geometry, navigation, rules, content, profiles, interface and Canvas rendering |
| [game.js](game.js), [classic.html](classic.html), [styles.css](styles.css) | Classic simulation and scene interface |
| [trade.js](trade.js), [market.js](market.js) | Shared economic definitions, deterministic prices and gold-lot accounting |
| Root content scripts | Classic case files, chapters, conversations, markets and community stories |
| [assets/](assets/) | Local portraits, scenes, sprites and icons |
| [tools/](tools/) | Node validation suites and production asset metadata |

## Documentation

| Reference | Purpose |
| --- | --- |
| [PLAYER-GUIDE.md](PLAYER-GUIDE.md) | Controls, first routes, trading, activities and save behaviour |
| [TUTORIAL.md](TUTORIAL.md) | Developer setup, module responsibilities, action flow and content integration |
| [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md) | Test commands, manual scenarios, acceptance criteria and defect reporting |
| [VOYAGE-AUDIT.md](VOYAGE-AUDIT.md) | Current engineering safeguards, compatibility requirements and known limitations |
| [VOYAGE-HARBOUR-LIFE.md](VOYAGE-HARBOUR-LIFE.md) | Fishing, kitchen shifts, photographs and travel budgets |
| [VOYAGE-NEIGHBOURS.md](VOYAGE-NEIGHBOURS.md) | Passenger fares, favours, recipes, conversations and docking practice |
| [VOYAGE-EVENINGS.md](VOYAGE-EVENINGS.md) | Supper evenings, sailing courses, dispatch investigation and unified itineraries |
| [VOYAGE-BREAKWATER.md](VOYAGE-BREAKWATER.md) | Expedition chapters, coast navigation and overnight continuation |
| [ADVENTURE.md](ADVENTURE.md) | Classic dialogue, case files and lighthouse exploration |
| [NIGHT-MARKET.md](NIGHT-MARKET.md), [NAO-STORY.md](NAO-STORY.md) | Classic market dispatch and breakfast story |
| [NIGHT-TWO.md](NIGHT-TWO.md), [CANAL-TOWN.md](CANAL-TOWN.md), [SEASON-UPDATE.md](SEASON-UPDATE.md) | Classic chapter progression, canal content and morning shift |
| [HARBOUR-REFINEMENTS.md](HARBOUR-REFINEMENTS.md), [HARBOUR-WIRE.md](HARBOUR-WIRE.md), [HARBOUR-POLISH.md](HARBOUR-POLISH.md) | Classic community systems, reading, scene state and festival supplies |
| [MOBILE.md](MOBILE.md), [SOUND.md](SOUND.md) | Responsive interface and audio engineering |
| [ART-DIRECTION.md](ART-DIRECTION.md), [tools/asset-manifest.json](tools/asset-manifest.json) | Visual standards and shipped asset inventory |
| [CREDITS.md](CREDITS.md), [LICENSE](LICENSE) | Attribution and licence scope |

## Validation and release

Run the commands in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md) from the repository root. Automated suites cover rules, navigation, saves, DOM integration and mocked audio. Native Canvas rendering is an optional development check. Real-browser layout, phone performance, touch accessibility and listening require separate manual validation.

GitHub Pages serves the static repository. A release must retain valid script ordering and asset paths, pass the relevant suites, and verify the deployed revision. Browser storage belongs to the site's origin; moving between local and hosted builds does not transfer saves.

## Licence

Code is MIT-licensed. Artwork, story and documentation prose are licensed under CC BY 4.0. See [LICENSE](LICENSE) and [CREDITS.md](CREDITS.md) for attribution and reuse terms.
