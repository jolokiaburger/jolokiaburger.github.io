# Adventure dialogue update

The harbour keeps its deterministic trading night and four investigations. This update gives conversations a warmer adventure tone, named character roles, a paged dialogue box and optional full-exchange reading. Gold trading appears before exploration, food and tea in the action panel.

## Conversation rules

`dialogue.js` contains authored casual lines for ten characters. Availability follows location, mode and the existing departure times. Characters exhaust unseen eligible lines before rotating through the pool; the same line does not repeat consecutively. Contextual lines can become available as the night advances. Casual conversation costs no time, fuel or credits and awards no evidence or trust.

Chat history uses optional keys in the existing `state.used` save field. Existing saves remain compatible. Repeated story conversations preserve their first response, and new evidence produces the relevant response before casual variations. Character and clue IDs are unchanged.

Add lines with stable unique IDs to each character’s `lines` array. Keep at least five unconditional lines per character. Do not put essential evidence only in casual text: use the existing action, clue and rumour system.

## Interface

`game.js` renders one speaker turn at a time with Previous, Next and Read full exchange controls. Paging is presentation only and has no simulation cost. Optional People groups keep casual conversation from crowding the main choices. `styles.css` adds warm gold, teal and blue panels, readable sans-serif story text and larger conversation controls while retaining the existing phone shell and reduced-motion rules.

## Validation

Run `node tools/adventure-checks.mjs` (Node 22+, no dependencies). The checks cover content validity, chat rotation and save restoration, old saves, departure boundaries, food and rumour delivery, trading costs, repeat dialogue and all twelve investigation outcomes through the real engine.

These engine checks do not establish browser layout, device performance, market balance or how enjoyable the new dialogue feels. Real phone and Safari/iOS play-tests remain useful before expanding the game.

## Beyond the breakwater

`expansion.js` adds three destinations to trading nights: Lantern Night Market, Starling Salvage Yard and Hoshimi Lighthouse Island. It loads after the existing data scripts and before `game.js`. Investigations keep their original four destinations. The destination strip scrolls horizontally on phones, preserving a single row in the fixed shell; desktop trading nights also show it.

Ask Sora at the market about the lantern kits, obtain Rin's reef chart at the yard, refuel, visit Hoshimi and bring the kits back to Sora. The island costs three fuel and 35 minutes each way. Sora pays either 85 credits or one gram of gold, once. Quest flags and optional reward counters use the existing save schema; no migration or restart is needed. The journal tracks the next expedition step. The morning wire acknowledges completion or unfinished cargo, and reward value is excluded from the trading-performance statistic.

All three destinations have distinct inline SVG scenes and authored characters, bounded gold stock and buying limits. The yard provides paid refuelling; the existing tug remains an escape route when stranded. New markets retain the existing deterministic price simulation and price impact. Their initial spreads and limits are provisional balance choices.

Run `node tools/adventure-checks.mjs` for the full engine checks, including all three world truths, both expedition rewards, real travel costs, save restoration, depleted stock, rescue and reward accounting. This does not replace visual testing on a real phone or a browser play-test.
