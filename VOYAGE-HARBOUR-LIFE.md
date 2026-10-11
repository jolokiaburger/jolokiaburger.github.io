# Voyage 0.15 · Harbour pastimes

This release adds optional activities and closer views within the existing nine-quay Basin. Classic, the Voyage save key and save version 1 remain unchanged. Nothing opens automatically on a fresh or resumed voyage.

## Where to start

Choose **Menu → Harbour pastimes**, the matching Journal shortcut, or the button under People/Services. Fishing works while moored at every quay. Nao's kitchen is at Lantern Market while she is at her counter. Photo errands begin with Yumi at Metro and Mio at Tsukimi. People at Kurage, Lantern Market and Kisaragi also offers **Take a closer dockside seat**.

## Fishing

- Borrowing the harbour rod and casting are free. The float settles for 2.2 real seconds; after the bite, **Reel in** stays available. There is no reaction deadline, lost bait or failure penalty. **Relaxed mode** reels automatically after that same settling time, including with reduced motion.
- Landing a catch uses four game minutes. Casting, waiting, packing away the line and viewing the basket do not advance the clock. The full four minutes must fit before dawn; a catch may land exactly at 06:00.
- There are six catches per voyage and a separate three-fish basket. This never uses freight slots. Releasing a kept fish frees basket space. Nao at her market counter pays 6 cr for each kept catch; sharing uses no additional game time and can settle only once. A first shared catch unlocks the paper-fish decoration.
- Six species vary with quay, weather and the voyage seed: silver sprat, lantern bream, canal carp, blue mackerel, reef rockfish and moonfin. A cast is deterministic; packing and recasting cannot reroll it. The captain's fish notebook persists between voyages.
- A pending line is saved. Reopening the activity resumes it; departing packs it away. Closing or replacing its panel cancels its UI timer. It never catches fish behind a different menu.

## Nao's kitchen shift

Nao supplies the ingredients; there is no stock purchase. Prepare one bowl and tea for each of Priya, Kenji and Mei, in that order. Choose a broth, topping and tea from the illustrated tray. Their requests describe their preferences.

| Customer | Favourite tray |
| --- | --- |
| Priya | Gentle miso, silken tofu, roasted tea |
| Kenji | Ginger broth, roasted mushrooms, black tea |
| Mei | Gentle miso, spring greens, jasmine tea |

Serving takes six game minutes and pays 4 cr thanks, plus 2 cr for the favourite combination. An alternate tray receives a kind reply and the normal payment. Only serving commits the choice; leaving a draft tray is free. A full shift uses eighteen minutes and pays 12–18 cr, once per customer per voyage. The final tray unlocks a tea-cup decoration. All costs, durations and payments are checked before mutation; exact-dawn completion is valid. The shift is unavailable while Nao is aboard the ferry.

## Photo errands and album

Yumi wants the market lanterns and canal bridge for her sketchbook. Mio wants Hoshimi's light. Accept at the requester's home quay, sail near the marked view and choose **Frame a photo**. The ferry stops while the camera is open. Choose wide or closer framing, then take the photograph for two game minutes and no credits. A view can be captured once per voyage. Neither request has a delivery deadline.

Return both views to Yumi at Metro for her pennant, or the lighthouse view to Mio at Tsukimi for a brass-star decoration. No cash reward or freight slot is involved. Captured views and completed handovers survive reloads; handovers cannot grant duplicate rewards.

Photographs render the actual native Canvas harbour artwork at 480 × 320, centred on the landmark. The three-slot album keeps the latest capture of each view across voyages, with framing, weather and capture time. Thumbnail strings are bounded and restricted to local PNG/WebP data. If a thumbnail cannot be stored, the errand's recorded progress is still retained and the UI explains the limitation. No camera permission, image service or network upload is used.

Decorations are selected through **Harbour pastimes → Ferry decorations**. They appear on the Tern's cabin rail and do not affect navigation, prices, fuel or hold capacity.

## Journey information and trip budgets

The sailing strip puts the selected/tracked destination, estimated arrival, route fuel and nearest cargo deadline together. If the tank cannot cover the leg, it simulates reachable fuel pumps. A workable estimate names the next pump, includes each 30-cr/10-minute refill and tells the captain to set course to that pump first. It never automatically changes an assisted course. An impossible fuel budget shows its reason.

Individual cargo offers and Trading overview include a **Trip budget** through collection, release waits, five-minute handovers and return to Kurage. The simulation checks the tank at each leg, available money, cargo space, deadlines and dawn. It considers early refuelling where useful, and full-tank purchases rather than simply charging a distance rate. Routes are estimates: turns and detours still need allowance.

**Gross margin** is promised payment minus the case's purchase price. **Estimated net cash** subtracts fuel purchases on this simulated trip; starting fuel is already aboard and its earlier purchase is excluded. The card separately shows fuel used, remaining tank, refuelling stops and purse on return. These are not guaranteed profit or guaranteed arrival. The older two-order combined planner retains its distance-based estimate and explicit refuelling limitation.

## Artwork and accessibility

Mei and Priya gain 1024 × 1024 relaxed, thoughtful and pleased portraits. Their faces, ages, hair and work clothes use their own existing identity references. The three 1440 × 960 dockside scenes show Mei's kitchen, Nao's counter and Jun's canal tea table. Original portraits and Classic's references remain available. The other portraits were reviewed; this is a focused art pass rather than a promise that every asset was redrawn.

Dish and fish illustrations use local SVG code; ferry decorations and photo markers use native Canvas. Generated portrait/scene prompts, identity references, export dimensions, byte counts and hashes are in `tools/voyage-15-art-prompts.json`. The image-generation service is used during development only.

All activities open by choice and keep the dialog's persistent Close control. Large recipe buttons expose their selected state. The bite is announced once; decorative bobbing and steam freeze with reduced motion. Photographs, portraits and dishes have descriptive alternative text. Phone layout uses the existing measured camera viewport; real device comfort still needs playtesting.

## Implementation and validation

- `voyage/leisure.js`: activity rules, optional save validation, story steps and fixed rewards.
- `voyage/leisure-profile.js`: bounded album, fish notebook and cosmetic continuity.
- `voyage/leisure-ui.js`: explicit activity panels, recipe choices, fishing timer disposal and close views.
- `voyage/travel-plan.js`: reachable refuelling simulation and a bounded route cache.
- `voyage/voyage.js`, `voyage/index.html`, `voyage/voyage.css`: integration, journey strip, photograph rendering and cabin decorations.
- `voyage/ports.js`: Voyage-only portrait selection.

Required checks: `node tools/voyage-checks.mjs`, `node tools/voyage-leisure-checks.mjs`, `node tools/voyage-ui-checks.mjs`, `node tools/adventure-checks.mjs` and `node tools/sound-checks.mjs`. They cover old saves, malformed optional fields, exact-dawn actions, duplicate payments, both photo jobs, every quay, reward persistence and actual UI callbacks. Optional `tools/voyage-render-checks.mjs` uses `@napi-rs/canvas` to inspect photographs and decorations; the game has no added runtime dependency.

Browser CSS, Safari/iOS, actual touch comfort and real-phone performance remain unverified. Native Canvas art inspection and mock-DOM checks are not browser/phone playtests.
