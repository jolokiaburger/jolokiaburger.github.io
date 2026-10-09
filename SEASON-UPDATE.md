# Neon Tides · A small season of familiar lights

The game now connects Night One, **A Lantern for Tomorrow**, and **Morning After the Lanterns**. Finish a shift and use its report to continue. Earnings, gold purchase history, fuel and relationships carry forward; the next shift has fresh gold allowances and cargo orders. Existing saves still load.

## Places that remember

`harbour-life.js` adds reactions to earlier choices and deliveries. Reef kits appear by Sora's stall, Nao's menu stays visible, Hana's spoons and signed recipe appear in Kisaragi, and Jun's delivered tea waits at the market. A repaired pump remains repaired across chapters. An unfinished brass-star reunion can continue in the next chapter.

## A proper visit to Starling Yard

`index.html` uses the new illustrated workshop in `assets/scenes/starling-yard-manga.webp`. Rin and visiting Kenji have portrait targets; the work board, rescued ferry and kettle have their own targets. Talking to the people is free. The yard offers a bilge-pump repair, a salvage ledger, a brass keepsake to return to Captain Lam, a bracket check, a repair celebration and workshop miso soup. Gold trading and refuelling remain available.

## Small cargo and quiet company

`harbour-life.js` offers one ceramic-bowl case for Mei, one pump-seal case for Mako and one lantern-cloth case for Sora per shift. Two small-cargo slots are separate from the rice ingredient rack. Written prices and deadlines are displayed before buying. There is no automatic delivery payout, and fuel can erase a gross margin. Unfinished commercial cases are set aside at shift end rather than carried into a fresh market.

Nao can join a quiet ferry break after her recipe/breakfast story, or after breakfast in Chapter Three. Visit the lighthouse or canal bench together. Her counter closes while she is aboard; bring her back using the market's return action. These moments require no purchases and change later dialogue.

## Plan before casting off

`game.js` adds a folded **Plan a crossing** card alongside the Ferry controls. Selecting a destination spends nothing. It shows arrival time, fuel, return fuel/time, refill cost and affordability, and held delivery payments/deadlines. Existing direct destination buttons remain available. Recorded quotes show their observation time and age.

## Morning After the Lanterns

`morning-after.js` runs from **06:40 to 11:00**, with rest available from 08:00. Talk to Mei, share Nao's free breakfast, collect Hana's stranded table kit at the yard, and consult Priya's revised route. Three seeded situations have different lock conditions: clear canal, low water with a market handover, or locks reopening at 08:00. Deliver by 10:20, allowing five minutes for handover, then join the crew's late breakfast. The fee is 18 cr, accounted as a courier reward. Repairs and gold trading are optional. A bounded emergency fuel voucher keeps the main delivery finishable with an empty purse.

Morning seed examples are `morning-clear`, `morning-low` and `morning-late` in the chapter definition. Normal progression derives the chapter's seed from your earlier shift, so replaying a whole season repeats its market situations.

## Verification and play-test checklist

Run `node tools/adventure-checks.mjs` and `node tools/sound-checks.mjs`. Checks exercise real engine actions for each morning route, contract costs and payments, deadlines, save/reload, chapter transitions, memories, companion visits, free routes and no repeated rewards. The audio checks use mocked Web Audio; they do not assess sound quality.

Static SVG previews were rendered for visual inspection. A browser executable and a physical phone were not available for this update. Before calling the mobile layout verified, play through on Android and iOS: open the planner and change destinations, tap both yard characters and the ferry, return Nao to her counter, inspect the notebook with several active stories, resume each chapter after closing the browser, and check focus/scrolling with the planner open. Also listen to the repair and meal cues on actual speakers.
