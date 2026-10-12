# Developer tutorial

**Baseline:** Voyage 0.19 and Classic 4.6.1. This guide covers the current source layout, simulation boundaries and the workflow for integrating content. Player instructions are in [PLAYER-GUIDE.md](PLAYER-GUIDE.md).

## 1. Set up the project

Clone the repository, open its root in an editor and run a static server:

```sh
git clone https://github.com/jolokiaburger/jolokiaburger.github.io.git
cd jolokiaburger.github.io
python3 -m http.server 8123
```

Open `http://localhost:8123/`. Use Node 22 or later for the checks in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Production gameplay has no package dependencies or build step. The optional native rendering check requires a development installation of `@napi-rs/canvas`.

Use a separate browser origin or profile for test saves. Both modes autosave changes; retain copies of compatibility fixtures before testing reset, recovery or chapter transitions.

## 2. Understand the entry points

| File | Role |
| --- | --- |
| [index.html](index.html) | Launcher, mode descriptions and repository link |
| [voyage/index.html](voyage/index.html) | Voyage Canvas, controls, port panel, dialog and ordered script loading |
| [classic.html](classic.html) | Classic inline SVG scenes, encounter panel, notebook and ordered script loading |
| [voyage/voyage.css](voyage/voyage.css), [styles.css](styles.css) | Mode-specific layout, visual states and motion policies |

Both games use ordered classic script tags and explicit globals. Story and rules load before the controller that uses them. Preserve the dependency order in each entry page; changing a filename or query version requires checking its consumers and local asset links.

Voyage loads shared economics, world/regions, navigation, ports and the base model first. Activity and expedition modules extend the model next. Profiles and UI modules load before audio, camera, art and the final controller. Classic loads base case/trade data and the market before its dialogue, location and chapter extensions; [game.js](game.js) loads last.

## 3. Navigate the Voyage architecture

| Layer | Source | Responsibility |
| --- | --- | --- |
| World | [voyage/world-map.js](voyage/world-map.js), [voyage/regions.js](voyage/regions.js) | Geometry, ports, discoveries and coastal access |
| Navigation | [voyage/navigation.js](voyage/navigation.js) | Water tests, assisted routes, steering, collision sampling and approach assessment |
| Economy | [market.js](market.js), [trade.js](trade.js) | Deterministic quotes, events, dealer impact and gold lots |
| Content | [voyage/ports.js](voyage/ports.js), [voyage/conversations.js](voyage/conversations.js) | Cast, contracts, meals, stories, topics and reply branches |
| Base rules | [voyage/model.js](voyage/model.js) | State, time, fuel, actions, cargo, ledger and validation |
| Activity rules | [voyage/leisure.js](voyage/leisure.js), [voyage/neighbours.js](voyage/neighbours.js), [voyage/breakwater.js](voyage/breakwater.js) | Pastimes, fares, favours, recipes and expedition state |
| Evening rules | [voyage/supper-routes.js](voyage/supper-routes.js), [voyage/sailing-challenges.js](voyage/sailing-challenges.js), [voyage/harbour-mystery.js](voyage/harbour-mystery.js) | Finite suppers, actual sailing records and dispatch evidence |
| Planning | [voyage/travel-plan.js](voyage/travel-plan.js), [voyage/route-board.js](voyage/route-board.js) | Shared pump-aware budgets, ordered action IDs and dependencies |
| Profiles | [voyage/profile.js](voyage/profile.js) and the leisure, neighbour, breakwater and [evenings](voyage/evenings-profile.js) profile extensions | Bounded cross-voyage history, learning and cosmetics |
| Evening UI | [voyage/evenings-ui.js](voyage/evenings-ui.js), [voyage/route-board-ui.js](voyage/route-board-ui.js) | Explicit evening choices and a consolidated route editor |
| Activity UI | [voyage/leisure-ui.js](voyage/leisure-ui.js), [voyage/neighbours-ui.js](voyage/neighbours-ui.js), [voyage/breakwater-ui.js](voyage/breakwater-ui.js) | Explicit panels, callbacks, notebooks and chart |
| Rendering/input | [voyage/voyage.js](voyage/voyage.js), [voyage/camera.js](voyage/camera.js), [voyage/harbour-art.js](voyage/harbour-art.js), [voyage/coast-art.js](voyage/coast-art.js), [voyage/sea-boundary.js](voyage/sea-boundary.js), [voyage/shoreline-art.js](voyage/shoreline-art.js) | Controller, shared camera transform, native drawing and input |

Subsystem extensions wrap selected model functions. Inspect the final exported function after all scripts load when tracing validation, costs or story integration. A change to the base model can affect every extension.

## 4. Trace an action

A player action follows this contract:

1. The controller or subsystem UI obtains a status from the model and displays duration, price and any disabled reason.
2. The rule function checks location, eligibility, funds, capacity, inventory and the full time budget again at commit.
3. A successful action mutates state, records the actual outcome and adds any cash transaction to the ledger. Rejected actions leave resources and progression unchanged.
4. The controller saves state and refreshes the affected controls. Profile updates record eligible memories or learning separately.

Reading a conversation is free. Sailing runs through the animation frame and navigation functions; mooring, paused state, open panels, ended voyages and page visibility gate progression. Cosmetic animation must not change simulation results.

To inspect a topic without altering the active save, use a new state in the Voyage console:

```js
const sample = VoyageModel.create('harbour-demo');
const firstTopic = VoyageConversations.available(sample, 'mei')[0];
const exchange = VoyageConversations.read(sample, 'mei', firstTopic.id);
console.log(exchange.text, firstTopic.choices);
```

The object is independent of the active controller state. The same globals are loaded into the Node validation harnesses, allowing rule checks without a browser.

## 5. Integrate a Voyage content change

For a conversation in [voyage/conversations.js](voyage/conversations.js), use a stable topic ID, an existing speaker ID, a knowledge category, attributed notebook text, NPC speech and complete player choices. Gate evidence-dependent choices on records the player actually owns. Keep optional topics free and leave essential story actions accessible through explicit controls.

For a contract in [voyage/ports.js](voyage/ports.js), define stable IDs, collection and destination quays, purchase/payment amounts, release time and handover deadline. Integrate its state with capacity, validation, expiry, accounting and the relevant UI. A gross margin must remain distinct from net cash after refuelling.

For a new state field, accept older valid saves without it, then add bounded defaults during hydration. Validate shapes before following references. Reject unknown IDs, duplicated terminal outcomes and inconsistent payments. Add the relevant rules to the existing focused suite; use a legacy-save fixture as well as a current state.

For UI changes in [voyage/voyage.js](voyage/voyage.js) or an activity UI module, preserve visible Back/Close controls, panel timer disposal, keyboard access and per-port scroll behaviour. Panels open through player actions. Reading or drafting a choice must not commit its resource cost.

## 6. Understand Classic

[game.js](game.js) owns Classic state, guarded actions, fixed-cost travel, save validation, rendering and procedural audio. [cases.js](cases.js) defines investigations; [trade.js](trade.js) defines the base gold night. The root location and chapter scripts extend those definitions in the order shown by [classic.html](classic.html).

Classic has two state families: case investigations and trading chapters. Shared fields include clock, location, fuel, flags, action-use counters and visits. Trade state adds credits, gold lots, observed quotes, rumours and cargo accounts. Case state adds clues, selected evidence and confrontation progress. Transient crossing timers and open-panel state are presentation concerns.

Case content uses conditional text, stable clue IDs and proof tags. `buildCase()` assembles the selected variant; `validateCase()` checks locations, actions, proof coverage and ending references. Evidence submission tests the required proof tags and timeline answers. Explanation submission requires the correct explanation and a held supporting clue. Preserve pinned case seeds and existing IDs so saved cases retain their selected truth.

Classic's development interface is `window.NeonTides`, exposed by [game.js](game.js). Use `NeonTides.validateAll()` after editing content. Gold-night helpers live under `NeonTides.trade`. These are development interfaces, not player controls.

## 7. Economics and saves

[market.js](market.js) calculates prices from the selected truth, seed, quay, clock, local offsets and event envelopes. Dealer spread and trade impact produce the buy/sell quotes. Gold lots retain quantity and per-gram purchase cost; realised sales use the lot accounting rather than treating all sale revenue as profit.

Voyage separates cash change, realised gold profit, cargo settlement and stock held at purchase cost. The ledger records actual purse movements. Carrying stock through an expedition night is not a new purchase; retaining an old completion is not new income. [voyage/travel-plan.js](voyage/travel-plan.js) simulates whole refills for individual trips, the active two-order comparison and the route board. The board stores action IDs; current prices and rewards remain authoritative in rule modules. Its full itinerary schedules early refills needed after later destinations. Legacy combined cargo saves remain valid and can be imported. See [VOYAGE-EVENINGS.md](VOYAGE-EVENINGS.md) for the dependency and save contracts.

| Store | Owner | Schema |
| --- | --- | --- |
| `neon-tides:voyage:v1` | Voyage controller and model validators | Version 1, optional validated subsystem records |
| `neon-tides:voyage:profile:v1` | Voyage profile modules | Version 1, bounded histories and learning |
| `neon-tides:voyage:radio:v1`, `neon-tides:voyage:sound:v1` | Voyage audio controls | Separate radio/effects preferences |
| `neon-tides:save:v1` | Classic `game.js` | Internal save version 2 |
| `neon-tides:settings:v1`, `neon-tides:profile:v1` | Classic `game.js` | Settings and discovered case endings |
| `neon-tides:release-seen` | Classic release display | Viewed release marker |

Voyage preserves unreadable raw data under the relevant key plus `:unreadable` where storage permits. Classic rejects and clears incompatible saves with a notice. Storage failures allow in-memory play; they do not establish persistence. Changes to these behaviours need explicit compatibility tests.

## 8. Verify and publish

Use [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md) to select automated suites and manual scenarios. [MOBILE.md](MOBILE.md) defines viewport, focus and animation constraints. [ART-DIRECTION.md](ART-DIRECTION.md) and [tools/asset-manifest.json](tools/asset-manifest.json) document shipped visuals. [SOUND.md](SOUND.md) describes audio lifecycle and listening checks.

Before publication, run documentation/asset checks and relevant regression suites, review the complete diff, verify script/asset paths and retain save compatibility. GitHub Pages serves the root directly. Confirm the deployed commit after merging. Record actual device observations separately from automated results.
