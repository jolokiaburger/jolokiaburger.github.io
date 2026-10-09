# Kisaragi Canal Town

Kisaragi is an inland destination in both trading nights. Ask Priya at Landing 3 for the canal pilot sheet. The route costs **2 fuel and 40 minutes each way** from harbour quays, or **4 fuel and 55 minutes** from Hoshimi. The unlock carries into Night Two. Investigations keep their original four destinations.

The town has three residents with rotating free conversation: **Hana Tsukino**, festival organiser; **Jun Arai**, tea merchant; **Mako Senda**, lockkeeper. Explore the ceramics arcade and bridge notice, eat dumplings, drink tea, trade capped quantities of gold, or refuel for 30 cr and 10 minutes. If stranded, radio the existing tug for a tow to Landing 3.

## A bounded tea trade

Jun sells **one sealed case for 24 cr**, with five minutes to load. Sora pays **38 cr** at Lantern Market, with five minutes to hand over. This is a 14 cr gross margin, before fuel and time. Purchases close at 05:10 to leave room for a return crossing; the last handover starts at 05:55. There is no replenishment or automatic payout. An unsold case is set aside for the morning crew and does not carry into the next night.

`game.js` stores the case in the optional `canalTrade` save field and reports its cost and revenue separately. Tea sales and the parcel fee are excluded from the gold-versus-holding statistic. Old saves without this field remain valid. Rice retains its own two-slot account.

## Mako's unfinished address

Accept Mako's parcel, read the festival notice and ask Jun about the fourth table. Deliver to Hana for **12 cr**, once. No purchases are required. Reading, talking and the parcel handover are free; checking the notice costs five minutes.

## Nao's invitation (Night Two)

1. Start Nao's new recipe and choose smoky mushroom or plum-and-sesame rice.
2. Read Hana's invitation at Nao's food counter. It also supplies the canal pilot sheet.
3. Help Nao prepare a sample (10 minutes, free), meet Hana in Kisaragi, and ask Jun about the tea pairing (free, no stock purchase).
4. Return to Nao and choose either a small festival table or sending her signed recipe while keeping her afternoon with Haruto.
5. Return to Kisaragi. Attending the preview supper takes ten minutes; from 05:50 there is a free quiet-table ending until dawn. Delivering the signed card is free. Neither branch grants money or gold.

When Nao travels with you, her original free recipe tasting can also be completed in Kisaragi after 05:00. The public festival happens tomorrow; tonight is the crew's preview supper. The chapter still ends at dawn. Turning in early records an unfinished invitation without automatically resolving it. Completion changes subsequent conversation and the morning wire.

The sample, contacts, selected branch, parcel and trade progress appear in a folded **Kisaragi · Routes, tea & festival log**, both beneath the story and in the notebook.

## Source and checks

- `canal-town.js`: world registration, actions, dialogue, commerce definitions and the chapter builder extension.
- `game.js`: tea accounting, save validation, route carry-over, progress log and full-scene camera.
- `index.html`, `styles.css`: illustrated canal, three portrait interaction targets and title-screen introduction; the fixed phone shell is retained.
- `assets/scenes/kisaragi-canal.webp`, `assets/portraits/{hana,jun,mako}-manga.webp`: original generated illustrations, optimized for static delivery.
- `tools/adventure-checks.mjs`: actual engine tests for travel, resource costs, parcel prerequisites, repeated reward prevention, save consistency, both invitation branches across all three market truths, original recipe completion in town, late arrival and tug recovery.

Run `node tools/adventure-checks.mjs` and `node tools/sound-checks.mjs`. Automated engine tests do not replace real-device playtesting or listening.

Validation for this change: **2,701 engine/data checks** and **56 mocked sound checks** passed. The canal SVG composition was rendered and inspected separately. Full browser and real-phone checks remain pending because Chromium was unavailable and its download failed in this environment.
