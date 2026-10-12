# Classic breakfast story: The Last Bowl Before Sunrise

**Scope:** Classic Night One. Nao Mizuno prepares a breakfast counter under her own name, carrying forward her father Haruto's recipes. The personal story is free to complete; food purchases and extra stock are optional.

## Entry and progress

At the Night Market food counter, choose Nao's folded recipe. The separate food-pane/Journal card tracks preparation, invitations and extra stock. From 05:00 it points back to the opening. An explicit wait shows its full clock cost and allows the market to continue advancing.

## Actions and timing — story spoilers

| Action | Location | Cost | Window |
| --- | --- | --- | --- |
| Hear the recipe story | Nao | Free | Before completion |
| Mend the warmer | Kenji | Ten minutes/free | Start before 03:20 |
| Heat insulated trays | Nao | Fifteen minutes/free | From 03:30; start before 04:45; alternative to repair |
| Invite Mei, Priya or Lam | Their home quays | Free conversation; normal crossings | Before 05:00 |
| Buy local extra batch | Nao | 24 cr/five minutes | Start before 04:50 |
| Read co-op offer and collect batch | Landing 3 | Offer free; 18 cr/ten minutes | Start collection before 04:30 |
| Hand over extra batch | Nao | Five minutes | Start before 05:40 |
| Join opening | Nao | Free | 05:00–05:44 |
| Catch last bowl | Nao | Free | 05:45–05:59 |
| Sunrise bowl and tea | Nao | 7 cr/ten minutes | After story completion |

A free wait bridges 03:20–03:29 to the tray fallback. Preparation/invitations influence the scene without gating completion. Late arrival and starting after five have distinct text. Turning in before attending leaves the story unfinished; the wire acknowledges Nao's trial without automatic completion or stock revenue.

## Optional batch account

Choose one twelve-portion batch from either supplier; purchasing one removes the other offer. Nao's pantry remains separate. Sales return 4 cr per served portion only after handover and an attended opening. A batch left aboard or an unattended opening earns zero sales. The opening button previews exact portions/proceeds before commitment.

| Demand component | Portions |
| --- | --- |
| `frost-order` base | 5 |
| `vault-light` base | 3 |
| `two-tides` base | 4 |
| Each invited neighbour | +2 |
| Prepared warmer or trays | +2 |
| Late opening | −3 |

Sold portions are bounded to 0–12. Unsold stock goes to the morning crew without payment. Gross stock result is sales minus batch purchase; fuel/time remain extra and a quiet batch can lose money.

[game.js](game.js) records optional validated `breakfastCost`, `breakfastRevenue` and `breakfastSold`. Purchase is an actual cash expense. The morning report separates breakfast stock from food/fuel and gold-trading performance. Purchase, handover and settlement each have repeat guards.

## Presentation, memory and validation

[night-market.js](night-market.js) owns the story and replies. [game.js](game.js) owns progress, settlement and saves. [classic.html](classic.html) and [styles.css](styles.css) render menus, trays, stock and guests. Later chapter dialogue remembers preparation, invitations and opening/late outcomes without replaying rewards.

Run `node tools/adventure-checks.mjs` for both suppliers, all seeds, real invitation routes, quiet losses, zero-credit completion, repair fallback, late/undelivered stock, deadline boundaries and reload. Manual checks must confirm the optional purchase risk is visible and the free personal ending remains discoverable. Chapter continuity is specified in [NIGHT-TWO.md](NIGHT-TWO.md) and [SEASON-UPDATE.md](SEASON-UPDATE.md).
