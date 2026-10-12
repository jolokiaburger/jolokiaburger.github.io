# Voyage neighbours, knowledge and recipes

**Scope:** passenger trips, favours, learned recipes, authored topics and optional docking practice in Voyage 0.18. These systems share the existing quays and profile while keeping fare passengers, recipe packets and fish separate from freight capacity.

## Passenger fares

Open Passenger trips through People, Menu, Journal or Harbour pastimes. Named passengers also offer their route in their person view.

| Passenger | Boarding quay → destination | Available from | Fare | Optional thermos quay |
| --- | --- | --- | --- | --- |
| Priya | Landing 3 → Metro | 00:50 | 18 cr | Kurage 33 |
| Captain Lam | Metro → Kisaragi | 01:40 | 22 cr | Night Market |
| Rin | Starling Yard → Kurage 33 | 00:30 | 20 cr | Night Market |

Boarding takes three game minutes. Explicit destination disembarking takes two and pays once; docking alone pays nothing. One fare passenger can accompany Nao or Yumi and uses no freight slot. Figures, luggage and crossing dialogue follow the active passenger.

A thermos stop is optional, free and eight minutes long. The captain may revise the route before sharing it or go directly to the destination. Fuel and detours remain costs outside the fare. Waiting for release is an explicit time advance at the boarding quay. Closing a fare at any quay pays nothing and consumes that person's once-per-voyage availability. Full actions must fit by dawn. Recorded completed trips produce matching follow-up letters.

## Neighbour favours

Acceptance is free through the board or favours view. Closing an unfinished favour at a quay awards nothing. All steps are tracked in the Journal.

| Favour | Required steps | Settlement |
| --- | --- | --- |
| Supper for the cook | Give Mei a kept fish at Kurage; four minutes | Consumes the fish; no cash |
| Tea for the late crew | Jun's flask at Kisaragi; five minutes, then Matte at Frostline; five minutes | 8 cr once, before fuel |
| A picnic under the charts | Mei's rice and Jun's tea; five minutes each in either order, then Mio; five minutes | Shared picnic; no cash |
| The twice-rung bell | Hear Priya's register and Mako's bracket account, then compare at Landing 3; three minutes | Choose the checked repair account or explicitly labelled legend |

Packets are free and use no freight slot. Bell comparison requires both accounts in the current voyage. Its selected interpretation appears in the board and Journal; it does not reveal hidden market truth.

## Learned recipes

Read the teacher's optional topic, then cook at Nao's Market counter while she is working. Learning persists in the profile. Each recipe can be served once per voyage.

| Recipe | Teacher | Broth | Garnish | Tea | Captain's ingredient |
| --- | --- | --- | --- | --- | --- |
| Lantern catch bowl | Mei | Gentle miso | Spring greens | Roasted | One selected kept fish |
| Rain-window ginger bowl | Nao | Ginger | Silken tofu | Black | One selected kept fish |
| Canal garden supper | Jun | Gentle miso | Roasted mushrooms | Jasmine | None |

Nao supplies the other ingredients. Broth, garnish, tea and fish selection are a free draft. Share the bowl takes six game minutes, no credits and consumes the chosen fish once. Variations receive authored responses without cash or a failure penalty. Leaving the tray spends nothing.

Cooked or gifted catches leave the kept basket; they cannot be released, sold or consumed again. Validators require the actual matching catch record. Species discoveries remain. Favourite kitchen-customer combinations are remembered separately from recipe servings.

## Conversation contract

[Voyage conversations](voyage/conversations.js) supplies two topics for each of fourteen neighbours: 28 topics with complete player replies and NPC responses. Topics appear inside the relevant person view and never open automatically.

Reading/replying is free and pauses sailing. State stores first-heard times and selected replies; profile memory stores learned topic/recipe IDs. Older learning is identified without inventing a current hearing time. Notebook categories separate harbour rules/outlooks, history/rumours and recipes/science.

Practical text explains implemented spreads, quote age, capacity, fuel, activity duration, upgrades and fares. Evidence-dependent replies require owned accounts. Topics do not observe remote scales or promise future bids. Essential story actions remain available through explicit controls.

Two science notes include optional primary references: Kenji's gold-contact explanation links to [USGS](https://pubs.usgs.gov/of/2002/of02-303/OFR_02-303.pdf); Mio's constellation-depth explanation links to [NASA](https://science.nasa.gov/universe/stories/quick-reads/discovering-the-universe-through-the-constellation-orion/). Attribution is recorded in [CREDITS.md](CREDITS.md).

## Docking practice and keepsakes

Practice is opt-in through Passenger trips. Near a quay, a dotted line and ring provide alignment/speed feedback. A gentle result requires speed at most 18 map units per second and heading difference at most 0.8 radians toward the quay. Dock remains an explicit action within the normal radius.

The assessment changes no collision, fuel, damage, price or time rules. A quicker landing records Secured alongside. A voyage retains up to sixty landing records; the profile remembers distinct gentle quays and the preference.

| Cosmetic | Requirement |
| --- | --- |
| Homeward ferry ticket | First completed fare |
| Neighbour's thank-you ribbon | First completed non-bell favour |
| Little harbour bell | Bell comparison, either interpretation |
| Recipe bowl | All three recipes served across voyages |
| Patient mooring knot | Gentle landings at three distinct quays across voyages |

These join the four pastimes decorations. None affects gameplay statistics.

## UI, state and source ownership

Fixed port/dialog Back and Close controls sit outside scrolling content. Scroll memory is keyed by quay, tab and person. Optional Metro, yard and observatory seats load local images when opened and retain functional actions. Native luggage, passenger figures, blinking and steam respect reduced motion. See [MOBILE.md](MOBILE.md) and [ART-DIRECTION.md](ART-DIRECTION.md).

| Source | Responsibility |
| --- | --- |
| [voyage/neighbours.js](voyage/neighbours.js) | Trips, favours, cooking, state validation and story/board integration |
| [voyage/conversations.js](voyage/conversations.js) | Topics, replies, evidence gates, sources and recipe learning |
| [voyage/neighbours-profile.js](voyage/neighbours-profile.js) | Bounded learning, preferences, memories and charms |
| [voyage/neighbours-ui.js](voyage/neighbours-ui.js) | Fares, inline topics, notebook, recipe trays and practice controls |
| [voyage/navigation.js](voyage/navigation.js) | Pure approach assessment |
| [voyage/leisure.js](voyage/leisure.js) and profile/UI extensions | Consumed catches, shared cosmetics, kitchen memories and seats |
| [voyage/voyage.js](voyage/voyage.js), [voyage/harbour-art.js](voyage/harbour-art.js) | Input/port integration and native figures |

The optional `neighbours` voyage/profile records preserve version 1. Validation checks owned IDs, uniqueness, time bounds, permitted choices, canonical payments and fish links. Load reconciliation restores existing learning without granting completed jobs. A fresh voyage retains learning/cosmetics and practice preference, not money, fish, fares or daily completions. Expedition overnight rules are defined in [VOYAGE-BREAKWATER.md](VOYAGE-BREAKWATER.md).

## Validation

Run the neighbour, leisure, UI and base suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Required cases include direct/tea routes, closures, both bell interpretations, ingredient drafts, actual consumption, malformed saves and exact-dawn settlement. Manual checks cover full topic/reply readability, focus, luggage, practice feedback and phone layout.
