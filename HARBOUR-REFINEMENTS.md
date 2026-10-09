# Harbour refinements: trading, reading and an afternoon off

## Content and integration

`dialogue.js` holds four optional Nao lesson topics and five magazine issue selections. Each lesson uses its own saved counter so repeating a topic offers new replies; conditional replies take priority after a realised losing gold sale or completed delivery. Neither lessons nor reading change credits, gold, fuel, relationships, rumours or clock time. Lessons are unavailable while Nao is travelling.

`game.js` derives cargo offer cards from existing definitions. Cards show purchase cost, promised payment, gross margin, destination, current crossing fuel and minutes, arrival after pickup, five-minute handover and its latest start. They warn when a route is unavailable or arrival is too late; they do not invent a reservation or guarantee a net profit. Owned rice and co-op courier rice remain separate accounts.

`harbour-life.js` adds an optional, bounded assay investigation: Rin quarantines a gold-coloured fitting; Kenji identifies P-17 as plated brass; Priya's copy mistakenly describes bullion F-17; Rin compares records; Priya corrects the envelope mix-up. The parcel never enters the player's gold lots or a dealer's inventory. `market.js` provides a pure record comparison; standard prices and purity acceptance are unchanged.

`index.html` draws the clickable magazine rack and small delivered-cargo props. `styles.css` styles compact offer cards, warnings and the folded reading shelf. Summer excerpts recognise current and prior story completions. Seasonal summaries are companion fiction, not live seasonal market orders.

`canal-town.js` authors Nao and Haruto's Chapter Three picnic preparations and the afternoon vignette. Haruto is a named story speaker, without a new portrait or freestanding scene character. Pack Mei's picnic for free (five minutes), consult Priya, then return to Nao before ending the morning. Once ready, the shift report offers three mutually exclusive afternoon choices. This is a post-shift 12:30 scene, not a fourth trading chapter. In the low-water seed the meeting is at the harbour; otherwise the family uses a scheduled day ferry to Kisaragi. Morning credits, gold, fuel, trades and valuation stay settled.

## Saves and memories

Existing save version remains valid. Features use existing flag and `used` counter dictionaries, so older saves need no migration. Lesson and assay counters carry through chapter transitions. Completed parcel flags carry too. Delivery reactions and visible bowls, cloth and seals recognise current or earlier shifts. Picnic outcome and choice autosave; reopening the scene cannot choose a second outcome or duplicate money.

## Validation

- `node tools/adventure-checks.mjs`: 3011 engine/data and DOM-contract checks passed, including all three seed conditions, all three afternoon choices, real crossing paths for the parcel and picnic preparation, lesson changes after a realised loss, deadline previews, archive notes, save reloads and production modal button handlers.
- `node tools/sound-checks.mjs`: 56 mock Web Audio checks passed.
- JavaScript syntax and whitespace checks passed.
- Browser visual review was not run for this update: Playwright is available, but its Chromium executables are absent in this environment. The DOM mock checks labels and handlers; it does not verify visual layout, touch hit areas, focus trapping or mobile scrolling. Desktop and phone play-testing remain necessary.
