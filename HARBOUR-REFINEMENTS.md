# Classic reading, assay and afternoon systems

**Scope:** Classic 4.6.1's optional lessons, reading shelf, cargo information, assay investigation and settled afternoon vignette.

## Trading lessons and magazine

[dialogue.js](dialogue.js) contains four Nao trading topics and five magazine selections. Each lesson uses a saved counter; conditional replies recognise a realised losing sale or completed delivery. Lessons are unavailable while Nao travels. Reading/lessons do not change time, fuel, money, gold, relationship values or rumours.

The Lantern Review rack at Mei's counter offers harbour, summer, gold, Halloween and Christmas fiction. Summer excerpts recognise current/earlier project outcomes. Seasonal summaries are reading content, not live market orders. [classic.html](classic.html)/[styles.css](styles.css) own rack targets and the folded reading view.

## Cargo offer contract

[game.js](game.js) derives offer cards from existing definitions. They show purchase, payment, gross margin, destination, crossing fuel/time, arrival after pickup and five-minute handover/latest start. Warnings expose unavailable routes and late arrivals without creating a reservation or promising net profit. Owned rice, courier rice and other accounts remain distinct.

## The wrong golden parcel — story spoilers

[harbour-life.js](harbour-life.js) defines a bounded record investigation:

1. Rin quarantines the gold-coloured fitting.
2. Kenji identifies P-17 as plated brass.
3. Priya's dispatch copy describes bullion F-17.
4. Rin compares the two records; Priya corrects the envelope error.

The fitting never enters the captain's gold lots or dealer inventory. [market.js](market.js) provides the record comparison; ordinary gold prices/purity acceptance are unaffected. No stock purchase or repeatable reward is required.

## An afternoon off — story spoilers

In Chapter Three, share Nao's breakfast, pack Mei's free picnic for five minutes, consult Priya and return to Nao before ending the morning. Once prepared, the settled report opens a 12:30 vignette with one choice: join the picnic, carry the basket, or leave Nao and Haruto family time.

Low water places the meeting at the harbour bench. Otherwise the family uses the scheduled day ferry to Kisaragi. Haruto is a named story speaker, not a separate portrait target. The scene changes no settled credits, gold, fuel, transactions or valuation. [canal-town.js](canal-town.js) owns the vignette and preparations.

## Persistence and validation

Existing flags and `used` counters store lesson/assay memory, parcel outcomes and picnic choice. These remain compatible with valid older saves. Reopening a completed vignette cannot choose a second result or duplicate income. Delivery props recognise current or earlier chapters.

Run `node tools/adventure-checks.mjs` for loss-sensitive lessons, offer deadlines, assay routes, archive notes, all morning truths/afternoon choices, reload and actual modal callbacks. Run audio checks for shared changes. Manual QA must verify reading focus, long-panel scroll and clear separation between the settled report and the afternoon scene.
