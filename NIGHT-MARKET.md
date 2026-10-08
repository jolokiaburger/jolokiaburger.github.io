# Lantern Night Market

The Night Market is now a complete authored location within the trading night: three stalls, free browsing, food conversations, an optional dispatch investigation, a small gold order, scheduled replenishment and a late watch. It is still part of an early game build; human balance testing and browser/mobile layout testing remain outstanding.

## Playing

Cast off for the Night Market using the destination strip or Ferry choices. The market directory and ringed picture targets open Sora's gold scale, Nao's food counter, Kenji's repair bench or the delivery lane. Browsing is free; purchases and searches remain explicit choices. All stalls shows every available action. The camera shows the whole arcade so no stall is cropped away.

Sora trades gold with the existing buy/sell controls. Nao sells skewers (9 cr, 10 min) and barley tea (6 cr, 10 min). Meals can introduce an uncertain courier story, acknowledge your checked dispatch or respond to completing the lead. Later meals rotate quieter ambient moments. Chatting under People is free and rotates authored replies; it does not supply essential evidence or farm money or trust.

Kenji can add one fuel for 6 cr and 5 min, once per night, while your tank is below full. At 03:30 he closes, the grill stops and an 8 cr bun-and-tea order replaces the skewers. Nao's kettle and Sora's gold desk remain open until dawn. The scene changes with deliveries, Kenji's departure and your lantern-wall visit.

## Dispatch investigation — spoilers

Ask Sora about the overdue launch, read the current manifest in the delivery lane (5 min), then verify it with the actual dispatcher. The journal keeps the courier's guess and the checked dispatch separately, with source and time. Essential information is available through labelled actions, without buying food.

| Night seed | Dispatcher | Arrival | Gold added to Sora's selling stock |
| --- | --- | --- | --- |
| `frost-order` | Rin, Salvage Yard | 02:00 | 16 g |
| `two-tides` | Rin, Salvage Yard | 02:00 | 12 g |
| `vault-light` | Priya, Landing 3 | 03:00 | 12 g |

Sora opens with 12 g. Deliveries happen whether you investigate or not. Previous purchases stay deducted. Her 18 g buying allowance never resets; deliveries replenish selling stock only. From 00:40 a shortage adds 7% to the local price over ten minutes. The actual delivery adds a -9% local modifier over fifteen minutes. Other harbour events, seeded noise and your trades still matter, so this is not a guaranteed profit route.

After checking the dispatch, return and choose one outcome:

- Sell exactly 2 g for Kenji's sensor contacts before 03:30 at the current market bid plus 4 cr/g. The button displays the total payout. This is a real sale that consumes held gold, records its cost basis, moves the dealer's bid and uses 2 g of Sora's buying allowance.
- Report the dispatch to Sora for a 25 cr courier fee. This remains possible after Kenji closes and requires no gold. The fee is excluded from the morning card's trading-performance figure.

The outcomes are mutually exclusive and pay once. If you lack gold or buying capacity, the sale button is disabled and the courier option remains available. A verified schedule also offers an explicit wait until arrival, showing the full time cost. Waiting does not order food; the rest of the harbour continues moving.

The lighthouse expedition remains available at Sora's stall with its original action IDs and rewards. Existing saves continue. The market pane selection is temporary presentation state and resets on arrival or loading a save; investigation progress, conversations and rewards autosave normally.

## Source files

- `night-market.js`: cast, stall data, dispatch branches, rumour records, conversations, stock schedules, scene-state rules and ending text. Loads after `expansion.js`, before `game.js`.
- `market.js`: deterministic cumulative stock arrivals, preserving previous purchases and buying caps.
- `game.js`: free stall browsing, action filtering, current payout preview, guarded contract sale and full-arcade camera.
- `index.html`: local illustrated scene, character sprites, semantic map targets and state overlays.
- `styles.css`: directory controls, focus states and late-watch/delivery art. The fixed phone shell is unchanged; the directory lives in the scrolling choices panel.
- `ART-DIRECTION.md` and `CREDITS.md`: asset provenance and exact generation prompts.

## Validation

Run `node tools/adventure-checks.mjs`. The checks exercise the actual engine: both dispatch routes using real crossings and refuelling, both outcomes across all three truths, stock at arrival boundaries, depleted stock and buying capacity, no-gold/low-credit paths, repeat-payment prevention, food conversations, late closure, explicit waiting, save restoration and the old investigations and lighthouse expedition. Asset checks cover shipped files and image dimensions.

The scene, portraits and sprites were inspected visually. Browser execution and real phone layout could not be checked in this environment; no Chromium/Firefox/WebKit executable was available. Before calling the build release-ready, play a full market route on desktop and phone, check touch targets and keyboard navigation, then compare the two dispatch schedules with a player who has not read this walkthrough. Check whether the investigation costs enough fuel/time to make the fee and gold premium feel fair.
