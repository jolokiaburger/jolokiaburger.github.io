# Voyage engineering quality register

**Baseline:** Voyage 0.19. **Scope:** gameplay correctness, financial reporting, save compatibility, authored dialogue and interface contracts. This register describes implemented safeguards and outstanding validation; release procedures are in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md).

## Implemented safeguards

| ID | Requirement and current behaviour | Source / regression coverage |
| --- | --- | --- |
| Q01 | Expired cargo and couriers can be closed or unloaded at a quay. Slots are released; no payout or refund is granted and delivery cannot later pay. | [voyage/model.js](voyage/model.js); engine/UI suites |
| Q02 | An activity requires its full displayed time, funds and capacity before mutation. Exact-dawn completion is valid; rejected actions leave state unchanged. | Model and subsystem status functions; engine, activity and expedition suites |
| Q03 | Save validation checks object shapes before references, owned IDs, timestamps, finite numbers and consistent terminal outcomes. | Model and profile validators; malformed/legacy fixtures |
| Q04 | Unreadable Voyage and profile data are retained independently in local recovery slots where storage permits. Storage failure allows session play with a notice. | [voyage/voyage.js](voyage/voyage.js); UI suite |
| Q05 | Story objectives and destination markers follow the same next-step rules. Closing cargo refreshes any saved combined route. | [voyage/model.js](voyage/model.js), [voyage/breakwater.js](voyage/breakwater.js); engine/UI suites |
| Q06 | Ledger, logbook and history distinguish actual cash, realised gold profit, settled cargo and stock held at purchase cost. | [voyage/model.js](voyage/model.js), [voyage/profile.js](voyage/profile.js); engine suite |
| Q07 | Legacy travelling-gold terms retain their advertised price; new voyages use the current offer. Actual lot purchase basis is preserved. | [voyage/ports.js](voyage/ports.js), [voyage/model.js](voyage/model.js); engine/UI suites |
| Q08 | Gold comparisons support one or three grams and use observed quotes with age. Conversation topics do not observe unseen scales. | Model/conversation modules; engine/neighbour/UI suites |
| Q09 | Current dialogue reactions and news take priority over previous-voyage greetings. Replies recognise time, work and story outcomes. | [voyage/ports.js](voyage/ports.js), controller; engine/UI suites |
| Q10 | Startup guidance is optional. Arrival notices are orange, non-blocking and dismissible, with six real seconds of reading time. | [voyage/voyage.js](voyage/voyage.js), [voyage/voyage.css](voyage/voyage.css); UI suite |
| Q11 | Fishing callbacks are disposed on close/replacement. Consumed fish have a matching serving/gift record and cannot be reused. | Leisure/neighbour modules; focused model/UI suites |
| Q12 | Fares pay only through explicit destination handover. Draft recipes, reading, docking and dawn do not award money. | [voyage/neighbours.js](voyage/neighbours.js); neighbour/UI suites |
| Q13 | Expedition continuation retains real resources and owned stock, renews delivery windows explicitly and prevents duplicate completion receipts. | [voyage/breakwater.js](voyage/breakwater.js); expedition suite |
| Q14 | Coastal access is gated, geometry remains authoritative and route knowledge changes actual waypoints. Original quay coordinates are retained. | [voyage/regions.js](voyage/regions.js), navigation; engine/expedition suites |
| Q15 | Classic remains a separate mode with its own saves and content progression. Shared changes require Classic regression coverage. | [game.js](game.js), Classic engine/audio suites |
| Q16 | The uncharted-water veil follows current region access, hides perimeter artwork and keeps navigation indicators visible without changing collision or save rules. | [voyage/sea-boundary.js](voyage/sea-boundary.js); boundary/UI/engine suites |

| Q17 | Supper ingredients are bought once per agreed evening; only explicit six-minute servings award 12/15 cr. The result counts contributions once and ingredient costs separately. | [voyage/supper-routes.js](voyage/supper-routes.js); evening suite |
| Q18 | Lantern runs advance ordered gates through actual sailing, retain real fuel/time spending and award only cosmetics. | [voyage/sailing-challenges.js](voyage/sailing-challenges.js); real-sailing and UI coverage |
| Q19 | Dispatch recovery requires three physical records and shared freight capacity. Platform supper additionally requires Nao’s consent; neither resolution pays a fee. | [voyage/harbour-mystery.js](voyage/harbour-mystery.js); evening/neighbour suites |
| Q20 | The active route board and two-order comparison simulate whole refills, purchase funding, capacity, waits and handovers; next-stop advice follows early refills required by the full itinerary. | [voyage/route-board.js](voyage/route-board.js), [voyage/travel-plan.js](voyage/travel-plan.js); evening suite |

## Accounting and planning contracts

Cargo gross margin is promised payment minus purchase cost. It excludes fuel, travel and other spending. [voyage/travel-plan.js](voyage/travel-plan.js) evaluates individual routes with reachable pumps, current cash, full refills, release waits, capacity, handovers and return travel. Starting-tank fuel is excluded from the displayed net-cash estimate because it is already aboard.

The active route board and two-order comparison use [voyage/travel-plan.js](voyage/travel-plan.js) for complete pump schedules. An early refill may be needed to leave a later quay even when the immediate crossing fits. [voyage/model.js](voyage/model.js) retains the earlier distance-based helper for legacy saved cargo routes, which can be imported into the board. Estimates do not guarantee future gold quotes or exact manually steered arrival; turns and detours need allowance.

Current-night expedition reports subtract carried settlement receipts from earlier nights. The ledger opens at the carried purse and stock; expedition-wide story outcomes remain labelled as such. Moored continuation grants no free fuel. An at-sea continuation uses the stated bounded tug fee and recovery allowance.

## Dialogue and knowledge contracts

Character text is authored in finite pools. It will repeat after eligible material is exhausted. Stable topic/reply IDs and evidence gates preserve notebook attribution and actual player knowledge. Working rules, history, rumours, recipes and science remain distinct categories.

Story-critical information belongs to explicit actions or properly gated dialogue. No essential progression should depend on repeatedly buying a meal or guessing a hidden casual line. Topics pause sailing and reveal no remote live quote. Science entries retain their source links; fictional accounts remain labelled as fiction or local lore.

## Save compatibility

Voyage state and profiles retain version 1. Optional `leisure`, `neighbours`, `breakwater`, supper, lantern-run, dispatch-investigation and route-board records accept valid older saves before hydration. Persistent IDs and legacy price terms must remain stable. Profile reconciliation may restore recorded learning, but cannot create money, completed jobs or chapter progress.

Reject duplicate records, invalid choices, inherited identifiers, future timestamps, unsafe thumbnails and orphan inventory consumption. Preserve bounded histories and immutable completed accounting. Test recovery independently for voyage and profile corruption; neither path may read or overwrite Classic storage.

## Outstanding validation and technical limits

| Item | Status / next evidence |
| --- | --- |
| Browser CSS, native dialog focus and keyboard behaviour | Requires current real-browser execution of the manual plan |
| Touch comfort, Safari/iOS, safe areas and physical-phone performance | Requires device observations with version and commit recorded |
| Audio quality and interruption/resume | Requires listening and lifecycle checks on actual browsers/speakers |
| Economic balance and objective clarity | Requires observed first routes and complete playthroughs; automated assertions do not establish enjoyment |
| Route board and cargo comparison | Pump-aware rules covered automatically; twelve-stop interaction latency and clarity require browser/phone observations |
| Controller size | [voyage/voyage.js](voyage/voyage.js) still combines input, drawing and several interfaces; extraction should preserve model/UI boundaries and existing coverage |
| Coastal route searches and enlarged chart | Additional geography increases navigation work; profile interaction latency on phones |

Automated rule, simulated-navigation, mock DOM and mock-audio checks cover specific contracts. Native Canvas inspection covers drawing output. These are separate from browser/device certification. Keep the current loop and its compatibility guarantees verifiable when extending content.
