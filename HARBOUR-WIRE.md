# Classic Harbour Wire specification

**Scope:** the local community board across all three Classic trading chapters. Open the ringed Landing 3 shelter board, choose Read the Harbour Wire or use the Journal shortcut. The feed requires no external service.

## Feed and availability

[harbour-wire.js](harbour-wire.js) supplies 33 authored posts plus cargo cards in Trading, Neighbours, Stories and Notices. Clock-gated material follows the shift; delivery/story outcomes and repeat canal visits alter eligible posts. Community follow-ups are labelled without invented timestamps. Current gold quotes remain on actual scales.

Cargo cards show purchase, payment, destination and handover window. Expired offers are marked; unavailable morning offers are omitted. Reading and filtering spend no resources and expose no hidden seed truth.

## Read markers and pins

Mark read stores a post fingerprint. Changed cargo terms or newly stale text become unread again. Pins and read markers autosave and carry through chapters. Unread/Pinned filters and links to accepted Journal entries support follow-up. Pinning does not change availability or payment rules.

## Priya's umbrella

Accept the optional lead at Landing 3 from its card or story choices. Search Metro for five minutes, then return the umbrella to Priya. Normal crossing costs apply; there is no purchase fee or separate deadline. The active/finished outcome appears in the Journal and a thank-you post follows. Progress survives chapter transitions and reload.

## Source ownership

| Source | Responsibility |
| --- | --- |
| [harbour-wire.js](harbour-wire.js) | Posts, public conditions, umbrella and shared request actions |
| [game.js](game.js) | Feed, categories, read/pin persistence and Journal shortcut |
| [classic.html](classic.html) | Shelter board target and returned umbrella |
| [styles.css](styles.css) | Paper cards, category controls and scrolling |

The board uses the existing notebook drawer and focus/keyboard handling. Existing saves use optional dictionaries and do not need a new schema version.

## Validation

Run `node tools/adventure-checks.mjs` for scheduled eligibility, free reading, authors/categories, umbrella, chapters, saves, expired/unavailable cargo, changed fingerprints, pins and rendered callbacks. See [HARBOUR-POLISH.md](HARBOUR-POLISH.md) for festival supply cards. Manual checks cover phone scrolling, category target sizes, focus restoration and return to the referenced Journal story.
