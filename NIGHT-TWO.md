# Classic Chapter Two: A Lantern for Tomorrow

**Scope:** the second trading chapter in Classic 4.6.1. Complete Night One and select Continue to Night Two on its morning report. Chapter Three follows the second report; see [SEASON-UPDATE.md](SEASON-UPDATE.md).

## Chapter continuity

Night Two starts at Kurage 33 at 23:40. Turn-in is available from 01:30; dawn ends the chapter at 06:00. Carryover retains actual credits, gold lots/purchase basis, fuel, relationships, casual-chat memory and unlocked routes. It grants no overnight refill.

The market has fresh allowances, event history, action counters and benchmarks. Its seed derives from Night One with `:night-2`. Save version remains 2; a valid older save without a chapter field is Night One. Loading chooses chapter data from the save, independently of the title or current chapter.

## Recipe trial

Ask Nao about A lantern for tomorrow and choose smoky mushroom rice or plum-and-sesame rice. The menu choice is exclusive and narrative; it does not secretly change the fixed rice payment. Optional seasoning takes ten minutes and closes at 04:50.

| Result | Window / cost |
| --- | --- |
| First spoonful | 05:00–05:44; free |
| Saved spoonful | 05:45–05:59; free |
| Explicit wait | Advances to 05:00; market continues |
| Full bowl/tea after trial | 7 cr/ten minutes |

No gold, food purchase, invitation or cargo is required for tasting. Early turn-in leaves the trial unfinished. Nao's dialogue remembers actual Night One preparation and opening outcomes.

## Sealed-rice contracts

Two ingredient slots are available. Choose one purchase or courier route per night:

| Route | Purchase | Pickup | Destination settlement |
| --- | --- | --- | --- |
| Landing 3 owned rice | 18 cr/crate; one or two | Ten minutes; start before 04:00 | Nao pays 30 cr/crate |
| Market owned rice | 26 cr/crate; one or two | Five minutes; start before 04:20 | Nao pays 30 cr/crate |
| Co-op courier | No purchase; one crate | Ten minutes; start before 04:00 | 12 cr fee once |

Delivery's five-minute handover must finish by 04:30; last start is 04:25. Owned unopened crates may instead return to Landing 3 for 16 cr each, finishing by 05:45; last start is 05:40. Co-op returns pay nothing and cannot be sold as owned rice.

The two-crate Landing margin is 24 cr before fuel/time; market margin is 8 cr. A dedicated 30-cr refill may erase either margin. Unserved crates earn zero automatic payout and are not valued as cash/gold at the report. Accounts distinguish stock return, courier rewards, food/fuel and gold performance. Successful handover consumes cargo and cannot repeat after reload.

A one-time Landing emergency voucher supplies two fuel/five minutes when cash is below 30 cr and fuel below one. It supports story recovery without a loan or repeatable profit; the ordinary tug remains available.

## Festival economy and exploration

Co-op recycled gold arrives at 01:00. The pier instrument desk is provisionally due at 02:00. Rei gives the provisional order, Priya confirms supply and Matte explains actual desk status. Seeded weather/crew situations produce different demand outcomes, reflected in the wire. Spreads, impact, stock and buying caps remain active.

Night One breakfast stock, dispatch and lighthouse rewards cannot be repeated. Rin can still provide the shared island route for a visit. Nao's festival invitation and town tasting use [CANAL-TOWN.md](CANAL-TOWN.md).

## Implementation and validation

[night-two.js](night-two.js) builds isolated chapter data. [game.js](game.js) guards transitions, validates chapter-aware saves and records rice accounting. [classic.html](classic.html)/[styles.css](styles.css) supply banners and delivered-rice props.

Run `node tools/adventure-checks.mjs` and `node tools/sound-checks.mjs`. Required regressions include real carryover/crossings, all truths/recipes, both suppliers, one/two crates, courier/returns, deadlines, reload, old saves, repeated payment and zero-purse recovery. Manual QA must cover both nights and the subsequent morning, using actual phone layout and audio.
