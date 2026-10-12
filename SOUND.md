# Audio system

Neon Tides uses procedural Web Audio for music, weather, ferry movement and interaction cues. No recorded music, samples or soundfonts are shipped. Music and harbour effects have separate controls and begin muted for new players.

## Ownership and controls

| Component | Source | Behaviour |
| --- | --- | --- |
| Classic radio and effects | [game.js](game.js) | Radio dial, independent Harbour sounds toggle and effects volume |
| Classic stall palette | [night-market.js](night-market.js) | Action-to-cue mappings and market ambience |
| Ghost Tide FM | [halloween-radio.js](halloween-radio.js) | Shared procedural station and disposable audio graph |
| Voyage ferry/weather effects | [voyage/sound.js](voyage/sound.js) | Engine, wake, wind, rain, departure horn and mooring bell |
| Voyage controls/preferences | [voyage/voyage.js](voyage/voyage.js) | Separate radio/effects state, user-gesture activation and persistence |

Volume controls use 30%, 60% and 100%. Radio Off leaves separately enabled effects available. Disabling harbour effects silences their bus, including an active ferry cue. Existing Classic settings migrate through [game.js](game.js); Voyage preferences use their own radio and sound storage keys.

## Stations

| Station | Mode | Synthesis |
| --- | --- | --- |
| Rain only | Classic | Filtered noise ambience |
| Lantern FM | Classic | Karplus–Strong plucked strings, pentatonic phrases, drone and sparse partial-based bowls |
| Basin Lo-Fi | Classic | 104 BPM sequencer, filtered bass/pads, percussion noise and echo |
| Ghost Tide FM | Classic and Voyage | 72 BPM pulse, minor chords, sea/wind noise and slow modulation |

Ghost Tide FM also selects a pumpkin-orange visual theme. Theme selection changes no economic, quest, clock or collision rules.

## Interaction mix

Classic successful trades use wooden scale contact, quay water and paper rustle. Meals use brief ceramic, grill and kettle textures; repairs use low bench taps. Nao's breakfast opening plays its short pentatonic phrase only through the successful story action. Failed transactions and rereading an exchange do not replay rewards or cues.

Market ambience is sparse, uses the stall palette and follows the late-watch closures. It pauses on crossings, title/end screens, open panels and hidden pages. Shared cooldowns limit rapid action overlap. Interaction noise is filtered to keep the mix soft.

Voyage engine and wake levels follow movement; wind and rain follow cosmetic weather. Pausing sailing, opening panels or hiding the page silences its sailing ambience. Effects and radio have separate buses with shared browser-context/limiting integration.

## Lifecycle requirements

Start or resume audio only through the supported user-gesture flow. A remembered preference must not bypass browser autoplay rules. Ambience must not wake a suspended context.

Station shutdown clears its scheduler, fades output and stops/disconnects owned sources. Finite cues stop and disconnect after their envelope. Page visibility and mode changes gate scheduling; test repeated tuning and reopening for leaked sources or unwanted playback. Unsupported audio must leave gameplay usable.

## Validation

Run `node tools/sound-checks.mjs` for mocked Web Audio contracts and `node tools/adventure-checks.mjs` for Classic gameplay integration. The audio suite covers control independence, missing support, gating, levels, cooldowns and graph cleanup. These checks do not evaluate the final mix or browser autoplay.

Before release, listen on desktop headphones, phone speakers and Safari/iOS. Start at 30%, compare effect/music balance, perform repeated trades, repair and opening actions, then hide, lock, return, retune and reopen. Record clipping, harsh frequencies, overlapping cues, latency and failures to resume. Adjust synthesis in the owning source file and rerun its regression suite.
