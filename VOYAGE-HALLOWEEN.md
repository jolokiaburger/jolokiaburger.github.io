# Halloween harbour theme

**Baseline:** Voyage 0.22. **Scope:** an optional visual festival across existing water, the Tern and all eleven quays.

## Player controls

Open **Menu → Halloween mode** and check the box. Uncheck it to restore the ordinary harbour. The choice is remembered in the current browser and works with music and effects off. Ghost Tide FM remains a separate, explicitly started radio station.

The theme adds lavender water and drifting mist, floating pumpkin lanterns, friendly spirits, quay bunting, crescent-and-cat signs and warm pumpkin lights. The Tern receives bow pumpkins, a cabin witch hat, a string of lights and a small spirit decoration. Port panels and controls use complementary amber and violet accents. The tone is playful and welcoming, without jump scares, flashing effects or combat.

## Rendering architecture

[voyage/halloween-theme.js](voyage/halloween-theme.js) owns reusable pumpkin/spirit drawing, water mist, quay decorations, the boat overlay and the illustrated menu preview. It does not import or mutate simulation rules.

[voyage/voyage.js](voyage/voyage.js) supplies the enabled flag and rendering context:

1. The seasonal water palette and mist draw before land and quays.
2. Quay decorations follow each shore orientation; pumpkin and spirit faces remain upright.
3. The uncharted-water veil, current arrows, course lines, recovery markers and docking guidance retain their normal layer order above the themed water.
4. The Tern and its decorations draw last, keeping the player’s boat visible.

Shapes use native Canvas paths and gradients, with no enlarged low-resolution sprites or additional downloads. The preview has a 1280 × 440 backing canvas. World artwork uses the existing device-pixel-ratio-aware Canvas, capped at 2× for rendering cost. Camera bounds cull distant mist and quay decorations. Existing navigation geometry remains authoritative.

Reduced-motion preference freezes drifting mist, floating lights and spirits. The optional native render test additionally produces a 1920 × 660 preview. Browser layout and physical-phone performance remain separate validation requirements.

## Persistence and compatibility

The dedicated `neon-tides:voyage:halloween:v1` preference stores `{enabled: boolean}`. Only literal `true` enables the theme. Missing, malformed or unreadable settings default to ordinary colours. A blocked write leaves the current tab usable and displays a notice that the choice could not be saved.

Voyage save/profile schemas remain unchanged. Theme selection consumes no time, fuel, credits or inventory and changes no weather simulation, tide, collision, deadline or quest state. Existing snapshots and postcards already saved in the album remain unchanged; new captures reflect the current world appearance. Classic storage and its existing radio behaviour are unaffected.

Voyage’s earlier station-linked pumpkin accents are replaced by the explicit visual preference. Turning Ghost Tide FM on or off does not change the Halloween checkbox; enabling the theme does not initialise audio.

## Validation

Run `node tools/voyage-halloween-checks.mjs` for the native checkbox, saved preference, malformed settings, storage failures, radio independence and save isolation. When the optional `@napi-rs/canvas` development dependency is available, it also verifies changed scene pixels, stable reduced-motion rendering, home/canal/coastal scenes and the high-resolution preview.

To save native inspection images:

```sh
node tools/voyage-halloween-checks.mjs ./halloween-renders
```

The output directory is a local inspection artifact, not a production asset. Required regression and manual procedures are listed in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md).

Browser acceptance covers checkbox keyboard/touch use, 320/390 px menu layout, focus, reload persistence, unavailable storage, radio on/off combinations, daytime/night water, all shore orientations, coastal unlock, close/wide camera views and reduced motion. Confirm the boat, quays, currents and active objectives remain legible through the mist.
