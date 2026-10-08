# Night Two · A Lantern for Tomorrow

This is the current two-night direction, independent of historical planning documents. It adds a complete second evening with a closing morning report, not a persistent restaurant simulator or an unlimited season.

## Start and continuity

Finish any gold Night One (including an existing saved first night), then choose **Continue to Night Two · Keep earnings & choices** on the morning card or under the story. Continue an active save from the title as usual. Night Two starts at Kurage 33 at 23:40; turn-in is available from 01:30 and dawn ends play at 06:00. After its report, **Start fresh Night One** begins a new, independent chapter.

Carry-over is the actual credits, gold lots and purchase basis, fuel, relationship values, prior chat memory and previously unlocked reef chart. There is no free overnight refill. Prior story memory records Nao's opening/late arrival, warmer help, invitations, and the lighthouse delivery. Nao and Sora acknowledge those choices in authored dialogue. A missed opening gets an honest new introduction; no old quest is automatically marked complete.

Each evening has fresh dealer stock/allowances, rumours, event history, action-use counters and financial benchmarks. Night Two's seed is the first night's seed plus `:night-2`; the same starting seed and choices reproduce the chapter. Saves remain version 2; old saves with no chapter field are Night One. Read validation selects the chapter from the save itself, even when loading from the title or while another chapter is active.

## Nao's festival recipe

Ask Nao about **A lantern for tomorrow**. Choose one recipe: smoky mushroom rice or plum-and-sesame rice. The choice is exclusive and appears in the ending. Optional seasoning help takes ten minutes and closes at 04:50 so it finishes by five. Tasting is free and does not require food purchases, gold, invitations or cargo:

- First spoonful ending: 05:00–05:44.
- Saved spoonful ending: 05:45–05:59.
- Explicit wait action advances to 05:00; the market continues to move while waiting.
- After completing the trial, a full bowl and tea cost 7 cr and ten minutes. A further conversation covers Nao's festival plans and time off.
- Turning in early does not complete the story. Nao finishes with the morning crew in the wire; the player has missed that experience.

The menu choice is a personal narrative choice, not a hidden profitability bonus. The ingredient deal uses a disclosed fixed price. Food, tea, casual rotating dialogue and independent harbour sounds remain available.

## Sealed-rice trade

The Tern reserves two ingredient slots. Choose one purchase or courier route per night:

| Route | Purchase | Collection | Settlement |
| --- | --- | --- | --- |
| Landing 3, owned | 18 cr/crate, one or two | 10 min; start before 04:00 | Nao pays 30 cr/crate |
| Market, owned | 26 cr/crate, one or two | 5 min; start before 04:20 | Nao pays 30 cr/crate |
| Co-op courier | No purchase; one co-op crate | 10 min; start before 04:00 | 12 cr delivery fee, once |

Delivery must finish by 04:30: last start 04:25, five-minute handover. Owned unopened crates can instead return to Landing 3 for 16 cr/crate, finishing by 05:45: last start 05:40, five-minute handover. Co-op cargo returns without a payment; it cannot be sold as owned cargo. Action labels show the actual carried quantity and payout. Successful handover consumes the cargo; reloads/repeated clicks cannot pay twice.

A two-crate wholesale load yields 24 cr before fuel and time; a market load yields 8 cr. A new 30 cr refuel solely for that trade can erase the margin. Owned returns make a loss explicit. Unserved crates go to the morning co-op with zero payout; cargo cost remains incurred. The report and folded cargo log distinguish commodity return, courier reward, food/fuel spending and gold performance. Rice is not valued as cash or gold at the ending.

An empty-tank player can still call the existing tug. At Landing 3, a player with less than 30 cr and less than one fuel can claim a one-time co-op emergency voucher for two fuel, taking five minutes. This keeps the free personal story reachable even after an exhausted first night. It is a bounded courtesy, not a loan or repeatable earnings mechanic.

## Festival gold night

Night Two uses a separate market definition. Co-op recycled gold arrives at 01:00; the pier instrument desk is provisionally due at 02:00. Rei reports the provisional order, Priya confirms the supply, and Matte gives the actual desk status. Clear weather confirms demand; fog postpones the desk; extra festival crews create both supply and demand. The morning wire reflects the actual hidden outcome. Dealer impact, spreads, finite gold stock and buying caps still apply.

Yesterday's salvage rumours, first breakfast quest, shipment investigation and lighthouse delivery cannot be repeated for rewards in this chapter. The shared island route can be unlocked through Rin even if the earlier delivery was skipped; tonight a visit is simply a visit.

## Source files and checks

- `night-two.js`: isolated cloned chapter data, new story, trade terms, market events, scene conditions and casual dialogue.
- `game.js`: guarded transition, chapter-aware data selection and save validation, cargo accounting, journal/controls and morning report.
- `index.html`, `styles.css`: festival banner and delivered-rice props; existing illustration and fixed phone shell retained. No additional downloads or character portraits.
- `tools/adventure-checks.mjs`: actual engine tests for carry-over, real crossings, all three market outcomes, both recipes, both purchase sources, one/two crates, courier fee, return/loss/unsold paths, deadlines, old saves, chapter reloads, repeat guards, memory and zero-purse recovery.
- `tools/sound-checks.mjs`: mock Web Audio regression checks; shared sounds remain independent of the chapter.

Run both scripts with Node 22+. Engine and mock sound checks do not prove browser layout, actual audio quality, real-phone behavior or economic enjoyment. A full human play-through of both nights remains the next validation step.
