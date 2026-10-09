# Harbour Wire

Read the illustrated paper noticeboard under the Landing 3 shelter, choose **Read the Harbour Wire**, or use the shortcut at the top of the Journal. Reading and filtering are free. The board uses the existing journal drawer and keyboard focus handling, including Escape and mobile scrolling.

## Content

33 authored posts plus three cargo cards cover Trading, Neighbours, Stories and Notices. Clock-gated messages arrive during the shift; completed quests, deliveries and repeat canal visits change the feed. Pinned older notices retain their original time. Community follow-ups have a label rather than an invented timestamp. Cargo cards show purchase, promised payment, destination and handover deadline; expired offers are marked, and unavailable morning offers are omitted. Current gold quotes remain on the actual scales.

Priya's sky-blue umbrella is an optional board lead. At Landing 3, accept from its card or the story choices. Search at Metro Quay for five minutes, then return it at Landing 3. No credits, fuel beyond normal travel, or deadline is imposed. The active story and completed outcome appear in the Journal. Priya posts a thank-you; progress survives chapter changes and browser saves.

The board is available through all three trading chapters. It requires no server, external webpage or network. Existing saves acquire it without migration. Reading never spends resources or exposes hidden seed truth. Explicit read markers and pins autosave; see `HARBOUR-POLISH.md` for their persistence rules.

## Source and checks

`harbour-wire.js` owns post data, public availability and shared request actions; `game.js` renders the feed and journal shortcut; `index.html` draws the shelter board; `styles.css` provides paper cards and touch-sized category buttons. Both Node harnesses load the new script.

`node tools/adventure-checks.mjs` covers scheduled posts, free reading, authors/categories, quest progression, persistence, expired cargo, chapter availability, availability-sensitive offers and rendered cards/filters. `node tools/sound-checks.mjs` checks existing audio behavior. Browser visual layout and physical-device scrolling need a player check.
