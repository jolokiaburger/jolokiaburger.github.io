# Classic scene state and festival supply contracts

**Scope:** Classic 4.6.1's waterfront decoration, visible outcomes, board controls and festival supply route.

## Scene presentation

[classic.html](classic.html) contains native kitchen utensils, shelter crates/greenery, Frostline office details, market cables and yard/canal fittings. Muted architectural colours keep amber interiors and character targets prominent. Decoration stays outside semantic interaction targets.

[harbour-life.js](harbour-life.js) and [harbour-wire.js](harbour-wire.js) drive delivered bowls, tea, cloth, repaired pump, breakfast props and Priya's returned umbrella. Eligible outcomes remain visible in later chapters through world memory. Nao's kettle is hidden when she travels; character replies use actual arrival/delivery state.

Small reflected lines, rain and awning drips use SVG/CSS without a separate particle scheduler. Decorative motion stops under reduced motion and small effects rest on phones. Follow [MOBILE.md](MOBILE.md)'s animation budget when changing [styles.css](styles.css).

## Board controls

Read markers store fingerprints, so changed terms and newly stale cargo become unread. Pins/read state persist through chapters. Filters and links to accepted Journal entries are free. Full board rules are in [HARBOUR-WIRE.md](HARBOUR-WIRE.md).

## Festival supplies

Accept one mutually exclusive route at Landing 3: courier work with no stock purchase, or owned cases for resale. Three goods share the existing two-slot small-freight hold with other cargo.

| Goods | Collection → destination | Courier fee | Owned purchase | Owned payment |
| --- | --- | --- | --- | --- |
| Bowls | Jun/Kisaragi → Nao/Market | 6 cr | 18 cr | 28 cr |
| Tea | Mei/Kurage → Hana/Kisaragi | 5 cr | 12 cr | 20 cr |
| Cloth | Sora/Market → Hana/Kisaragi | 5 cr | 10 cr | 18 cr |

Each collection/delivery takes five minutes. The last delivery start is 05:20 at night or 10:20 in Chapter Three, inclusive. Late goods earn no automatic payment. Combined courier fees total 16 cr. Owned stock costs 40 cr and pays 66 cr, a 26-cr gross margin before fuel/travel. Capacity prevents collecting all three simultaneously without handovers.

Completing the route opens Hana's closing cup without extra money. Individual goods and payments settle once. Saved route choice prevents mixing courier and owned terms.

## Implementation and validation

[harbour-life.js](harbour-life.js) defines supply progression and visible outcomes; [game.js](game.js) guards accounts and renders controls; [harbour-wire.js](harbour-wire.js) presents public notices. Existing flags/optional records retain save compatibility.

Run `node tools/adventure-checks.mjs` and `node tools/sound-checks.mjs`. Required regressions include both actual routes, exclusivity, shared capacity, boundary times, morning terms, saves, one-time payouts, props, changed unread state and pins. Manual QA must verify visible delivered goods, board navigation, mobile controls and full/reduced motion.
