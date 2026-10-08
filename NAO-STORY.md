# The Last Bowl Before Sunrise

Nao Mizuno wants to revive her retired father Haruto's breakfast counter, with her own name on the menu. This is an optional, complete one-night subplot. It adds a personal conversation, two ways to help the serving trays, invitations, a small optional supply trade, an opening and a later follow-up. It does not yet create a persistent business or a multi-night character arc.

## Start without spoilers

At the Night Market, choose Nao's food counter and **Nao's folded recipe · Ask about breakfast**. Starting and hearing her story are free. Her pantry covers the first bowls; buying food or stock is not required to finish the story.

The food pane and journal have a separate Nao progress card. It tracks preparation, neighbours and any extra stock. Other market and lighthouse leads remain available. From 05:00 the objective points back to her counter. Choose the explicit wait if you want to stay; its full clock cost is shown, and the rest of the harbour continues moving.

## Choices and timings — spoilers

| Choice | Place | Cost | Availability |
| --- | --- | --- | --- |
| Hear Nao's recipe story | Night Market, food | Free | After accepting, before finishing |
| Help Kenji mend the warmer | Night Market, repairs | 10 min, no credits | Start before 03:20 |
| Help Nao heat insulated trays | Night Market, food | 15 min, no credits | From 03:30; start before 04:45; alternate to repair |
| Invite Mei | Noodle bar | Free conversation; crossing costs apply | Before 05:00 |
| Invite Priya | Landing 3 | Free conversation; crossing costs apply | Before 05:00 |
| Invite Captain Lam | Metro Quay | Free conversation; crossing costs apply | Before 05:00 |
| Buy an optional market batch | Night Market, food | 24 cr, 5 min | Start before 04:50 |
| Read the co-op offer, then buy its batch | Landing 3 | Offer free; stock 18 cr, 10 min | Start collection before 04:30 |
| Hand over the extra batch | Night Market, food | 5 min | Start before 05:40; once |
| Join the opening | Night Market, food | Free | 05:00–05:44 |
| Catch the last bowl | Night Market, food | Free | 05:45–05:59 |
| Buy a sunrise bowl with tea | Night Market, food | 7 cr, 10 min | After finishing |

A free explicit wait from 03:20–03:29 bridges the repair cutoff and the insulated-tray preparation, so buying tea is never necessary to advance that step. Neither preparation nor invitations gate the ending. Without warmer help, Nao serves smaller rounds. The late return remains warm and personal, with notes from invited neighbours. Starting after five has its own introduction. Turning in before attending leaves the story unfinished; the morning wire acknowledges Nao's trial instead of granting an automatic completion or payment.

## Optional supply trading

You can buy **one twelve-portion extra batch**, from either supplier. Purchasing one removes the other offer. It is distinct from Nao's pantry and from paying for a meal. Crossing, fuel and delivery time must be considered when comparing the 18 cr co-op price with the 24 cr market price.

At the opening, sold portions return 4 cr each; unsold portions go to the morning crew. No purchase has guaranteed demand or an automatic payout. You must hand the batch over, then attend an opening before dawn. A batch left aboard or an opening you do not attend earns zero sales. At an available opening, the button previews the exact sales and proceeds before you choose it.

The deterministic demand is 5 portions for `frost-order`, 3 for `vault-light`, and 4 for `two-tides`. Each of the three invitations adds two; a prepared warmer/tray adds two. A late opening subtracts three from demand. Sold portions are bounded between zero and twelve. With all help and invitations, an early opening sells twelve portions on `frost-order`/`two-tides` and eleven on `vault-light`. A quiet unprepared batch can lose money even when you arrive on time.

`game.js` records optional `breakfastCost`, `breakfastRevenue` and `breakfastSold` fields. Purchasing is part of cash spent, but the morning card separates stock cost from food, tea and fuel. It reports breakfast sales minus stock cost **before fuel and time**. Gold-trading performance excludes both the supply cost and its revenue; food sales are not counted as quest gifts. Every batch, delivery and settlement is guarded against repeat payment.

## Presentation and saves

`night-market.js` contains the personal story, offers, source notes, invitation replies, contextual casual talk, opening variants and morning reactions. `game.js` renders the progress card in the food pane and journal, calculates the supply settlement and updates market status. Existing saves remain compatible; new counters are optional and validated.

`index.html` and `styles.css` add native SVG counter props: the planned menu, a signed sunrise menu, covered trays, an extra-stock crate, the breakfast pot and background guests. Nao and the invited characters speak through their existing manga portraits. These changes reuse the shipped artwork and add no bitmap downloads. The fixed phone shell is unchanged; progress lives in the scrolling content panel.

## Validation

Run `node tools/adventure-checks.mjs`. Checks cover both suppliers across all three seeds, real invitation routes and refuelling, cost/proceeds accounting, quiet losses, the zero-credit ending, warmer fallback, late and undelivered outcomes, deadline boundaries, reloads and repeat-payment prevention. The original market, lighthouse and case-file checks remain included.

The opening scene was rendered and inspected. Interactive browser and real-phone layout remain unverified in this environment. The next human play-test should check whether the free story is easy to find, whether the co-op journey feels worthwhile, and whether the risk of extra stock is clear before purchase.
