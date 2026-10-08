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

## Current character art

All fifteen speaking characters now use grounded adult manga portraits from `assets/portraits/*-manga.webp`. The earlier Rei and Mei SVG portraits remain as previous versions. The portrait set is 436,648 bytes; each asset is 512 × 512. The enlarged portrait treatment is shared by the full cast (112 px desktop, 80 px phones). `ART-DIRECTION.md` records the visual direction, character briefs, generation prompts and asset provenance.

Teo's display name remains Rei Minato. Internal `teo` IDs, flags, clues, evidence requirements and save keys are unchanged. The scene figures now use natural adult silhouettes, muted workwear, individual hair and fine outlines. Oduya is visible near the landing hatch. Hollis appears at Landing 3 from 00:20–00:40, then the bar from 00:45–01:40. Rei appears at Pier 9 from 01:30. Picture chat targets follow the character's current location. Bengt remains a radio contact, with his own portrait.

Dialogue frames and expansion stall paint use warmer, quieter colours alongside the harbour's established neon lighting. Portraits and native scene crops were visually inspected. Interactive browser layout and real phone play-testing remain unverified.

## Complete Night Market location

`night-market.js` extends the market after `expansion.js`, retaining the lighthouse action IDs. Sora, Nao and Kenji have distinct stalls, an illustrated arcade, matching market sprites and portrait dialogue. `game.js` adds a free directory inside the scrolling choices panel; choosing a stall filters its actions. The full market scene remains visible in both camera modes. `styles.css` keeps the fixed phone shell unchanged.

The overdue launch has a seeded dispatch route, verifiable journal leads, actual stock replenishment and a small local price event. `market.js` sums scheduled arrivals without resetting purchases or buying caps. Kenji's limited order is a real two-gram sale with a displayed payout; Sora's courier alternative is a one-time adventure reward. Meals recognise investigation progress and the late watch; Kenji and the grill close at 03:30. Rules, balance assumptions and manual testing: `NIGHT-MARKET.md`.

## Nao · The Last Bowl Before Sunrise

`night-market.js` now includes Nao's personal breakfast thread, free story actions, an early warmer repair or later insulated-tray fallback, invitations to Mei/Priya/Lam, and early/late opening dialogue. Food purchases are optional. One extra supply batch can be sourced locally or at Landing 3; actual sales depend on seeded demand, preparation, invitations and timing. This is a one-night subplot, with no persistent business simulation yet.

`game.js` keeps the progress card in the food pane and journal, guards supply settlement, and records optional validated cost/revenue/portion counters without invalidating older saves. The morning report separates the breakfast batch result from gold performance and food/fuel expenses. `index.html` and `styles.css` provide native counter props and opening states. Full rules, deadlines, accounting and test routes: `NAO-STORY.md`.
