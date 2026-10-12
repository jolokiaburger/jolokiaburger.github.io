# Classic dialogue, investigations and exploration

**Scope:** Classic 4.6.1. Voyage has separate controls and story systems; its developer architecture is documented in [TUTORIAL.md](TUTORIAL.md).

## Conversation system

[dialogue.js](dialogue.js) supplies authored casual pools. Location, mode, departure times and story conditions determine eligibility. Unseen eligible lines precede rotation, and consecutive repeats are avoided. Casual conversation spends no time, fuel or credits and grants no essential evidence or repeatable trust reward.

[game.js](game.js) presents speaker turns with Previous, Next and Read full exchange. Paging changes presentation only. Current evidence/story responses take their own explicit paths; optional People groups expose casual exchanges without obscuring core actions.

Use stable line IDs in each character's pool and retain an unconditional baseline. Do not place required clues or rewards exclusively in casual text. Chat memory uses optional entries in the existing `used` dictionary. Repeated story exchanges preserve their first response and recognise newly available evidence.

## Case files

[cases.js](cases.js) defines four authored investigations with stable pinned seeds: `high-tide`, `bellwater`, `low-water` and `slack-water`. The selected variant is stored in the save rather than recalculated on reload.

Clues carry proof tags. The player submits held evidence and timeline answers, then chooses an explanation and supporting clue, followed by a final outcome. [game.js](game.js) validates proof coverage and references through the development interface `NeonTides.validateAll()`. Case files retain the original four destinations and separate progression from the trading season.

## Lighthouse exploration

[expansion.js](expansion.js) adds Lantern Night Market, Starling Yard and Hoshimi to Classic trading nights. Ask Sora about the lantern kits, obtain Rin's reef chart, visit Hoshimi and return the kits. The island crossing costs three fuel and 35 minutes each way. Choose 85 cr or one gram of gold as a single completion reward.

The Journal tracks the next step. The morning wire recognises completed or unfinished cargo; the adventure reward is excluded from gold-trading performance. The yard has paid refuelling, and the tug remains a recovery option. Chapter-specific rules prevent repeating a completed reward on a fresh market allowance.

## Presentation and identity

[classic.html](classic.html) contains inline SVG scenes, local scene plates, ringed semantic targets and state overlays. [styles.css](styles.css) controls readable dialogue, phone destination scrolling and reduced motion. Scene targets and matching buttons perform the same guarded action.

Rei Minato retains the internal ID `teo`; Bengt uses the `radio` character/portrait naming. Preserve character, clue, action and save identifiers during visual or dialogue changes. Current portraits and retained variants are catalogued in [tools/asset-manifest.json](tools/asset-manifest.json).

## Related subsystems

| Specification | Content |
| --- | --- |
| [NIGHT-MARKET.md](NIGHT-MARKET.md) | Three stalls, dispatch evidence, stock arrival and contract choices |
| [NAO-STORY.md](NAO-STORY.md) | First-night breakfast preparation and bounded stock trading |
| [NIGHT-TWO.md](NIGHT-TWO.md) | Second chapter, recipes and rice contracts |
| [CANAL-TOWN.md](CANAL-TOWN.md) | Inland route, tea trade, parcel and invitation |
| [SEASON-UPDATE.md](SEASON-UPDATE.md) | Three-chapter continuity and morning shift |

## Validation

Run `node tools/adventure-checks.mjs` for content, actual engine actions, case outcomes, chat rotation, travel, rewards and old saves. Run `node tools/sound-checks.mjs` for audio integration. Manual QA must cover conversation paging, target discoverability, chapter continuation and mobile focus/scrolling; automated engine checks do not establish those visual results.
