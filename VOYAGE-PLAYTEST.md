# Voyage QA and release test plan

**Baseline:** Voyage 0.22, with Classic 4.6.1 regression coverage. **Scope:** simulation, content, saves, interface, assets and release verification.

## Test environment

Run checks from the repository root with Node 22 or later. Serve the game over local HTTP using the command in [README.md](README.md). Use a dedicated test origin/profile, preserve compatibility fixtures and record the tested commit. Keep production saves intact.

## Automated suites

```sh
node tools/documentation-checks.mjs
node tools/voyage-checks.mjs
node tools/voyage-leisure-checks.mjs
node tools/voyage-neighbours-checks.mjs
node tools/voyage-breakwater-checks.mjs
node tools/voyage-ui-checks.mjs
node tools/voyage-boundary-checks.mjs
node tools/voyage-evenings-checks.mjs
node tools/voyage-fishing-checks.mjs
node tools/voyage-craft-checks.mjs
node tools/voyage-halloween-checks.mjs
node tools/adventure-checks.mjs
node tools/sound-checks.mjs
```

| Suite | Coverage |
| --- | --- |
| [tools/documentation-checks.mjs](tools/documentation-checks.mjs) | Local documentation links/anchors, source references and shipped asset metadata |
| [tools/voyage-checks.mjs](tools/voyage-checks.mjs) | Actual navigation steps for port routes, base stories, trading, cargo, ledger, recovery and saves |
| [tools/voyage-leisure-checks.mjs](tools/voyage-leisure-checks.mjs) | Fishing, kitchen, photographs, bounded profiles and individual-trip budgets |
| [tools/voyage-neighbours-checks.mjs](tools/voyage-neighbours-checks.mjs) | Fares, favours, recipes, evidence, consumed catches, practice and learning |
| [tools/voyage-breakwater-checks.mjs](tools/voyage-breakwater-checks.mjs) | Chapters, menus/endings, real coast routes, continuation, contracts and malformed state |
| [tools/voyage-ui-checks.mjs](tools/voyage-ui-checks.mjs) | Production callbacks in a mock DOM, optional help, arrivals, panel return, tutorial and activity integration |
| [tools/voyage-boundary-checks.mjs](tools/voyage-boundary-checks.mjs) | Boundary coverage, contours, unlock transitions, drawing state and portrait selection; native pixel checks when the optional Canvas dependency is installed |
| [tools/voyage-evenings-checks.mjs](tools/voyage-evenings-checks.mjs) | Supper menus/contributions, six actual sailing runs, evidence/capacity, complete itineraries, saves, continuation and production callbacks |
| [tools/voyage-fishing-checks.mjs](tools/voyage-fishing-checks.mjs) | All tackle/quay combinations, shared coastal fights, measurements, bounded records, legacy catches, malformed saves, exact dawn and timer disposal |
| [tools/voyage-craft-checks.mjs](tools/voyage-craft-checks.mjs) | Tea quality/replays, finite recoveries, request evidence, current bounds, old saves, exact dawn, persistent records and production controls |
| [tools/adventure-checks.mjs](tools/adventure-checks.mjs) | Classic cases, dialogue, chapters, cargo, board and compatibility |
| [tools/sound-checks.mjs](tools/sound-checks.mjs) | Mocked Web Audio controls, gating, scheduling and cleanup |

All required suites must exit successfully for a release that changes their area. Run both modes for shared economic, asset or storage changes. Assertion totals include individual simulated frames and do not represent independent player sessions.

The optional native-art check requires separately installed `@napi-rs/canvas`:

```sh
node tools/voyage-render-checks.mjs /tmp/neon-tides-renders
```

Inspect its photographs, decorations, passengers, camera views, coastal scenery and chart. Native Canvas output does not render browser CSS or establish touch comfort.

## Manual scenario matrix

| ID | Procedure | Acceptance criteria |
| --- | --- | --- |
| V01 · First crossing | Start fresh, inspect Menu → How to play, collect Mei's optional tea and deliver to Nao | No forced help window; route/dock/handovers are clear; exactly one 24-cr payment |
| V02 · Arrival and controls | Dock, switch every port tab during the six-second notice, dismiss it, depart and redock | Message identifies the quay, never blocks controls and changes no clock/cash; new arrival receives a complete countdown |
| V03 · Sailing and recovery | Use manual/touch steering, water targeting and Set course; stop/cancel; exhaust fuel and call the tug | Routes avoid land, Dock remains explicit, recovery terms and result match, background tabs do not advance play |
| V04 · Gold and ledger | Buy/sell one and three grams, revisit a remembered scale, compare ledger with purse and lots | Quotes show buy/sell and age; limits apply; cash reconciles; sale revenue and realised profit remain distinct |
| V05 · Cargo and budgets | Compare and complete a stock job, a courier and a route requiring a pump; try full capacity and expiry | Costs/windows are visible, pump advice is actionable, handover pays once, expiry unloads without refund, hold frees correctly |
| V06 · Fishing and kitchen | Cast, close/reopen a pending line, use Relaxed mode, keep/release/share/gift/cook catches and serve all three kitchen customers | No hidden timer action, six catches/three kept slots respected, committed fish cannot be reused, drafts are free |
| V07 · Photos and keepsakes | Accept both photo jobs, capture each view/framing, return them, apply owned decorations and reopen | Actual harbour captures appear, rewards occur once, album is bounded and cosmetics have no rule effect |
| V08 · Passengers | Complete each fare directly and with its tea stop; change route, close one fare and reload another | Boarding/disembarking durations apply; docking alone grants no fare; closure is honest; luggage and dialogue match |
| V09 · Favours and knowledge | Complete all favours, both picnic pickup orders and each bell interpretation in separate runs; read topics and replies | Evidence gate holds, speaker/time/category persist, recipes teach correctly and no topic observes a remote price |
| V10 · Docking practice | Enable/disable practice; approach slowly/aligned and quickly; compare manual/assisted arrival | Optional guidance and cosmetic record only; no damage/fee or altered docking eligibility |
| V11 · Expedition | Complete preparation, coast and homecoming using both menus, tasting routes and endings across saves | Coast opens at chapter two; required case/cooker steps track correctly; crew and final letters match choices |
| V12 · Continuation | Continue an unfinished chapter, carried paid case/courier, moored finish and at-sea finish | Real resources/basis retained, windows renew explicitly, prior receipts are excluded from new income, tug terms match, no unpaid passenger homecoming |
| V13 · Dawn boundaries | Attempt activities with insufficient time, then actions finishing exactly at 06:00 | Insufficient actions charge nothing; exact-dawn commits settle once and retain the report |
| V14 · Saves/recovery | Load older valid Voyage saves and a current expedition; test invalid voyage/profile separately and unavailable storage | Valid progress retained; recovery notice is visible; raw unreadable data retained where possible; Classic unchanged |
| V16 · Supper evenings | Complete a two/three-table route and a hosted station evening; try variations, insufficient resources, close and another night | Ingredients paid once, table order enforced, 12/15-cr contributions only on serving, no duplicate report income, full duration before dawn, outcomes persist |
| V17 · Lantern runs | Complete all three courses in relaxed/timed modes using manual and assisted steering; pause, close and resume a saved run | Ordered gates, real fuel/game time, clear current gate, no cash/damage, completion notice is non-blocking, bounded best records and pennant |
| V18 · Dispatch investigation | Check records in different orders, fill the hold, recover the case and complete both resolutions in separate runs | Specific replies require evidence, full hold blocks recovery, platform supper requires consent, case slot releases and no fee appears |
| V19 · Route board | Add/reorder twelve stops; compare two orders; execute supper/case routes and an early refill; import an older cargo route | Whole refills and actual cash dependencies, no future quote, clear next action, correct stop reconciliation and explicit handovers |
| V20 · Continuing evenings | Continue a completed expedition with an unfinished case; start another supper and revisit courses | Chapter three stays complete, resources/case retained, older checks labelled retained, nightly supper/courses reset, no free fuel or repeated old payment |
| V21 · Advanced angling | Try all lures/depths, read each movement, misread/recover, reach the practice limit, reload a fight, use Relaxed mode in both waters and inspect all eight pages | Four-minute landing only, no reaction deadline or hidden catch, preserved basket/payment rules, readable artwork and numeric meters, bounded largest-catch records, old catch sizes unrecorded |
| V15 · Classic | Resume a saved shift, inspect Captain's guide, complete a trade and case route, continue through three chapters | Original progression, evidence, controls and save origin remain consistent; no Voyage data is used |

For V11, the preparation uses Nao's menu, Mei's 8-cr/six-minute pack and Rin's free ten-minute fitting. Chapter two uses boarding, Aonami tasting, the waterproof case and station cooker; chapter three concludes at Nao's counter. Detailed terms and spoilers are in [VOYAGE-BREAKWATER.md](VOYAGE-BREAKWATER.md).

## Boundary and portrait review

Approach all four outer edges, the locked east coast and a corner in close/wide views. The rectangle walls must be replaced by a feathered navy-black veil, with the Tern and active navigation indicators readable above it. Check the minimap and enlarged chart before and after chapter-two unlock. The gate must remain enforced while locked; opening the coast must restore its normal geography and destinations. Verify night/dawn, portrait/landscape and reduced motion.

At Tsukimi, read Mio’s ordinary chat, knowledge topics, sky-watch reactions, photo errand and illustrated seat. Relaxed, thoughtful and pleased portraits must all use the detailed observatory set. Confirm fallback behaviour and local loading.

## Harbour craft acceptance

- At Kisaragi, brew all three blends, compare a balanced and over-extracted cup, resume a saved partial pour, share six cups and verify the daily limit. Close/reopen at every phase. Serve at 05:54 and reject a new serving at 05:55.
- Find all three recovery sites. Try a wrong gap, high tension, packing, moving away, save/reopen, duplicate retrieval and duplicate handover. Verify four-minute retrieval and return, separate storage, object illustrations and attributed histories.
- Complete selected request goals before and after reading the board. Verify actual progress, location requirements, one-time thank-yous, no inventory consumption and no purse change.
- Continue an expedition. Verify fresh nightly progress, forwarded unreturned objects, retained best tea scores and retained learned histories.
- Sail with, across and against currents through a cycle. Check sheltered approaches, stopped boats, conservative normal-speed estimates, current arrows, Gentle helm and actual lantern-run results.
- At 320/390 px and short landscape sizes, inspect target bands, phase labels, wrapped controls, recovery lanes, notebooks and crowded sailing actions. Check keyboard focus after each repeated action and screen-reader meter values. Repeat with reduced motion.

## Browser and device acceptance

Follow [MOBILE.md](MOBILE.md)'s device matrix. At 320/390 px portrait and short landscape sizes, inspect all tabs, long notebooks, recipe trays, illustrated seats and the enlarged chart. Confirm fixed Back/Close, focus visibility, safe-area spacing, keyboard Escape, panel scroll restoration and usable sea framing.

Listen with music/effects independently enabled, retune repeatedly, hide/lock/return and reopen. Check full and reduced motion. Observe fuel-planner latency, sustained sailing performance and chart panning on physical phones.

Fishing additionally requires manual focus/scroll, 320/390 px catch-card and notebook review, local image loading, relaxed callback disposal after Close/Escape/backgrounding, and the exact-dawn reveal’s report return.

Current real-browser CSS/focus, Safari/iOS, touch comfort, listening and physical-device performance remain outstanding. Record these as separate manual results; mock DOM and native renders do not complete this coverage.

## Defect report format

Record test ID, game version, commit, device/OS/browser, orientation, seed, chapter, starting clock/quay and relevant inventory. Give minimal reproduction steps, expected result and actual result. Include the affected source file where known, console errors and a screenshot or recording for visual defects. Preserve an anonymised local save fixture when the issue is state-dependent; do not overwrite the original fixture.

## Release gate

1. Review the diff and update affected specifications, player guidance and asset inventory.
2. Run required automated suites and JavaScript syntax/whitespace checks; confirm local script and asset paths.
3. Execute the applicable manual scenarios and record any remaining coverage explicitly.
4. Publish the tested revision, verify GitHub Pages completion and confirm the deployment commit.
5. Smoke-test the deployed entry page and both modes, including save/resume on the intended browser origin.

## Halloween mode acceptance

Check and uncheck Menu → Halloween mode using mouse, keyboard and touch. Reload with the box enabled and disabled. Toggle the radio independently, test unavailable storage, and verify game/profile/Classic saves remain untouched. Inspect water, ferry decorations and all eleven quays in close/wide views at night and dawn. Confirm course, current, docking and recovery markers stay readable; compare reduced motion. At 320/390 px, verify the checkbox label, illustration, scrolling and fixed panel controls. Native rendering coverage is available through [tools/voyage-halloween-checks.mjs](tools/voyage-halloween-checks.mjs); browser and phone results must be recorded separately.
