# Harbour sounds — a quiet adventure mix

The sound update uses a warm, understated JRPG mood: low wooden scale contacts and quay water when gold changes hands, dry paper receipts, short soft ceramics, filtered grill and kettle textures, felted repair taps, and a short rising pentatonic phrase for Nao's opening. These are original procedural cues, not samples from any game or anime. No audio files or network requests are needed.

## Listen

Open Menu (`M`) and turn **Harbour sounds** on. **Effects volume** cycles through 30%, 60% and 100%, with 60% as the initial setting. Music stays on the separate radio (`R`): try **Lantern FM** for plucked-string ambience or **Basin Lo-Fi** for the existing 104 bpm groove. Turning radio Off leaves enabled effects available. Turning Harbour sounds off silences the effects bus, including a ferry cue already playing.

New players start silent. Existing settings with a tuned radio migrate with effects enabled to preserve the earlier ferry sounds. Browser autoplay rules may require the first click or key press after reopening. Settings persist locally; no game-save format changes.

## What plays

- Successful gold purchases and sales: a low wooden scale contact, gentle quay water and paper rustle. The former rising electronic beeps are removed. Kenji's gold order uses the sale cue. Rejected transactions are silent.
- Meals and drinks: Mei's ramen and milk tea, Rei's shared tea, Priya's flask and the metro's warm soy milk also use the bowl/pour cues. Nao's food: grilled skewers, tea pours and bowl placement have distinct small cues.
- Warmer repair and tray preparation: two low bench taps or kettle textures, without a pitched beep sequence.
- Tea: a soft kettle exhale and water pour, followed by a quiet cup touching its saucer. Bowls use a low placement sound and brief ceramic contact. Grill cues use softened sizzling, without a notification tone. All these noise textures roll off above 1.8 kHz.
- Nao's early or late opening: a roughly two-second original pentatonic phrase, once through the successful story action. Reloading or reading the exchange does not replay it.
- Market ambience: a sparse cue every sixteen seconds, chosen from the stall's palette. After 03:30 the grill and repair sounds become tea ambience. No simulated speech, voices or typing ticks.
- Ferry departures and arrivals: the existing horn, engine, hull and bell now follow Harbour sounds independently of the radio.

Ambient cues only play during an active gold night at the market. They pause during crossings, on title/end screens, with the notebook/menu open, and in hidden tabs. Ambience never wakes a suspended audio context. A short shared cooldown prevents rapid transaction clicks from piling up; ambience also waits eight seconds after an action cue. Finite new sources stop and disconnect themselves.

## Files and validation

`night-market.js` holds the stall palettes and action-to-cue mapping. `game.js` contains synthesis, the independent effects bus, controls, settings migration, scheduling and gameplay hooks. Menu controls remain in the existing scrolling modal; the fixed phone shell has no layout changes.

Run `node tools/adventure-checks.mjs` for gameplay regression checks and `node tools/sound-checks.mjs` for the mock Web Audio contract checks. The latter covers successful/failed trades, opening replay prevention, bounded sources and full node cleanup, softened interaction frequencies and levels, cooldowns, location/visibility gating, independent mute, old settings and missing audio support.

These checks do not establish how the mix sounds on speakers or actual browser autoplay behavior. Listening on desktop headphones, a phone speaker and Safari/iOS remains to be done. Start at 30% for a first listening pass; tune the per-cue synthesis levels in `game.js` after that play-test.
