# Beyond the Breakwater: expedition specification

**Scope:** Voyage 0.17's optional Nao/Rin expedition, outer coast, route knowledge and continuing nights. The world extends east to 5100 × 1800 with eleven quays. The original nine quay IDs and coordinates remain fixed.

## Entry and chapter progression

At Nao's Night Market counter, choose **People → Beyond the Breakwater → Read Nao's invitation**. Acceptance is free and requires Nao at work; bring her home first if she is on another outing. No expedition panel opens automatically on startup or docking. Existing Voyage saves may start the story.

| Chapter | Required steps | Committed cost |
| --- | --- | --- |
| 1 · An invitation folded into a chart | Choose herb bowl or smoked rice; pack Mei's ingredients; fit Rin's trim | Menu free; pack six minutes/8 cr; fitting ten minutes/free |
| 2 · The lantern that answers | Board Nao/Rin at the Market; taste at Aonami; recover the waterproof recipe case; restore Shiosai's cooker | Five, six, six and eight minutes respectively; free |
| 3 · A table with a homeward view | Bring the crew to Nao's counter, choose the supper's future and share it | Homecoming/choice free; supper twelve minutes/free |

Finish a night deliberately or reach 06:00, then choose Continue the expedition on its report. A ready chapter advances; an unfinished chapter remains on another night. Nights run 23:40–06:00 and may total more than three. State accepts at most 99 expedition nights. Full activity duration must fit before dawn, including exact-dawn completion.

Companions occupy no cargo slots. Their deck observations, figures and luggage follow expedition state. Nao/Rin remain aboard for the actual chapter-two-to-three return crossing and leave after supper. Rin's trim reduces actual fuel per distance by 10%, stacking with the tuned engine. It changes neither clock rate nor steering geometry.

## Overnight continuation

| Record | Continuation behaviour |
| --- | --- |
| Purse, gold and fuel | Retain actual values and gold purchase basis; no moored refill |
| Boat | Retain tuned engine, cargo racks and trim |
| Owned sealed cargo, courier and letter cases | Retain aboard in the shared two/three-slot hold; stated desk windows renew |
| Completed contracts | Stay terminal; no repurchase or repeated payment |
| Flags, discoveries, visits, menu and notes | Retain expedition progress and outcomes |
| Finite ordinary pastimes and neighbour jobs | New daily records; fare passengers take an overnight connection without an unpaid fare or claimed homecoming |
| Coastal catches | Shared with the overnight crew; new expedition basket starts empty |
| Ledger and report | Open at carried cash/stock; subtract earlier receipts from new-night settlement results |

Story details remain expedition-wide and labelled accordingly. Profile learning and cosmetics keep their normal persistent behaviour. Continuation does not convert an unfinished story into a completion.

A moored night resumes at the same quay. Finishing at sea uses an explicit overnight tug to Landing 3, charging up to 20 cr bounded by the purse and leaving at least three fuel under the existing recovery allowance. Its fee is reflected in the next opening purse/log. Ordinary fresh-voyage reset is a separate confirmed action and does not transfer expedition resources.

## Coast access and services

Both outer quays unlock in chapter two. Route selection, movement and save validation enforce the preparation boundary. Assisted targeting cannot enter a locked coast. Normal docking remains explicit.

| Quay | Context | Services |
| --- | --- | --- |
| Aonami Tea Island | Grower invitation, terraces and Nao's tasting | Gold co-op; fuel 30 cr/ten minutes; tea rice 5 cr/eight minutes; tasting and illustrated seat |
| Shiosai Coastal Station | Etsuko's recipe/repair notebook, signal room and cooker | Salvage gold scale; fuel 30 cr/ten minutes; miso/tea 5 cr/eight minutes; restoration and illustrated seat |

| Owned contract | Route | Purchase | Payment | Last handover start |
| --- | --- | --- | --- | --- |
| Dried tea leaves | Aonami → Sora at Night Market | 18 cr | 42 cr | 05:00 |
| Recovered fittings | Shiosai → Rin at Starling Yard | 16 cr | 36 cr | 05:00 |

Purchases and handovers each take five minutes and share the normal hold. Fuel/return travel remain extra. Carryover renews the delivery window, not the purchase or payout. Coast gold scales retain ordinary lots, spreads, caps and observed-quote rules.

## Knowledge and choices

| Speaker/place | Knowledge consequence |
| --- | --- |
| Nao, Market | Chooses the expedition menu before packing; the packed menu remains fixed and appears in the ending |
| Priya, Landing 3 | Surveyed inlet note unlocks an actual direct safe route; the default sheltered course uses the outer buoy detour |
| Jun, Kisaragi | Grower introduction unlocks leaf-steamed tasting alongside brewed-tea pairing; both cost six minutes/free |
| Mio, Tsukimi | Test-sequence account gives the physical signal tag checked context |
| Rin, Shiosai | Etsuko's last notebook page, after case recovery, unlocks the station-kitchen ending |

Talks use full authored player choices and matching responses. They require the named character at the proper quay and record the selected reply. Reading is free and observes no remote scale. Route selection is made while moored, then previewed or pinned; shorter travel comes from real waypoint geometry.

The travelling supper book and station kitchen are both complete narrative outcomes without cash awards or penalties. Letters acknowledge the menu, growers, Etsuko and selected future. The kitchen gives its rota to the crew; the book carries named methods onward.

## Water stops and fishing

| Stop | Action | Cost |
| --- | --- | --- |
| The lantern that answers | Inspect the signal test tag | Five minutes/free |
| Waterproof recipe case | Recover labelled pages; required chapter step | Six minutes/free |
| Supper skiff | Share crew tea and hear its method | Six minutes/free |

Coastal stops require the chapter-two expedition crew. Leaving is free and keeps an unsettled stop available. Settled stops remain marked and cannot duplicate rewards or steps. None opens a window automatically.

Coastal fishing appears underway in unlocked outer water. Each catch stops the ferry and takes four game minutes; three catches are available per night. Fictional moon mullet and ribbon mackerel use a separate expedition basket. Share a kept catch at Aonami or Nao's Market counter for four minutes/free, once. There is no fish sale, automatic payment or freight-slot penalty. Normal harbour fishing is also available at both new quays under its separate six-catch/three-kept rules.

## Chart and presentation

Chart opens from the header, Journal, People or expedition notebook. It draws exact world geometry with paper colours, water hatching, native landmarks and a north marker. Red marks the Tern, green visited quays, amber charted quays and squares coastal discoveries. Locked coast content remains covered.

Named controls expose destinations without relying on picture targets. Preview routes, fuel and pump availability; pin waypoints or enlarge the 1020-pixel chart and pan on a phone. Closing a preview spends nothing. Setting a course can cast off explicitly and still requires Dock at arrival.

Native terraces, station structures, lamps, cooker details and markers are in [voyage/coast-art.js](voyage/coast-art.js). Optional Aonami/Shiosai seats use local 1440 × 960 WebP. Asset records are in [tools/asset-manifest.json](tools/asset-manifest.json). Decoration respects reduced motion and does not alter geometry.

## Source and state ownership

| Source | Responsibility |
| --- | --- |
| [voyage/regions.js](voyage/regions.js) | Added geometry, gated destinations and route alternatives |
| [voyage/breakwater.js](voyage/breakwater.js) | Chapters, actions, talks, continuation, receipts, contracts, fishing and validation |
| [voyage/breakwater-profile.js](voyage/breakwater-profile.js) | Bounded notes, menu, completed chapters and ending memories |
| [voyage/breakwater-ui.js](voyage/breakwater-ui.js) | Notebook, choices, continuation controls, chart, pins and seats |
| [voyage/coast-art.js](voyage/coast-art.js) | Native coastal scenery |
| [voyage/travel-plan.js](voyage/travel-plan.js) | Coast pumps and route/trim-aware caching |
| [voyage/voyage.js](voyage/voyage.js), [voyage/index.html](voyage/index.html), [voyage/voyage.css](voyage/voyage.css) | Controller, crew, chart/fishing buttons and responsive integration |

Optional voyage/profile `breakwater` records preserve schema version 1. They bound chapter/night, steps, notes, menu/tasting/ending/route choices, crew, pins, landmarks, catches, dialogue and earlier receipt totals. Validators reject unknown or duplicate IDs and inconsistent receipts before hydration. Profile learning grants no automatic cash, jobs or chapter completion.

## Validation

Run the expedition, engine, activity, neighbour and UI suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md), plus Classic/audio regressions for shared changes. Check both menus/endings, unfinished-night continuation, carried inventory, real routes, consumed catches, exact-dawn actions and invalid saves. Native renders inspect both coast quays and the chart. Manual browser/phone checks must cover panning, focus, pump-planner latency and the complete return crossing.
