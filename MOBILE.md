# Responsive interface and device QA

**Applies to:** the launcher, Voyage 0.20 and Classic 4.6.1. This document specifies current layout constraints and the device validation required for release.

## Layout ownership

| Surface | Sources | Contract |
| --- | --- | --- |
| Launcher | [index.html](index.html) | Responsive mode cards, readable title art and visible repository link |
| Voyage | [voyage/index.html](voyage/index.html), [voyage/voyage.css](voyage/voyage.css), [voyage/camera.js](voyage/camera.js), [voyage/voyage.js](voyage/voyage.js) | Exposed sea, accessible sailing controls and a scrollable port panel |
| Classic | [classic.html](classic.html), [styles.css](styles.css), [game.js](game.js) | Stable harbour composition, destination controls and a scrollable encounter sheet |

## Viewport and scrolling

Classic's fixed phone shell is gated by `@supports (height: 100dvh)` and its phone breakpoint. The document does not scroll inside that shell; the encounter sheet and overlays own their scrolling. Engines outside the support gate retain the fallback layout. Title framing and the fallback picture sizing avoid deriving an uncontrolled width from a definite height and aspect ratio.

Voyage uses an automatic header row and a remaining-space map row. At narrow widths, port content occupies a bottom sheet with sea above; short landscape layouts place it to the right. [voyage/camera.js](voyage/camera.js) computes framing from the measured exposed sea. Rendering and water hit-testing must use that same transform.

Use dynamic viewport units for a supported fixed shell and stable sizing for scrolling fallbacks. Apply safe-area insets to controls near the screen edges. Keep overflow inside the intended panel. Address-bar movement, the software keyboard and notches require real-device verification.

## Focus and panel lifecycle

- Long content must open at its start without focus scrolling it to the final action. Classic focus/scroll helpers are in [game.js](game.js).
- Voyage Back and Close remain outside scrolling dialog content; port footer controls remain available while the body scrolls.
- Port scroll positions are keyed by quay, tab and person in [voyage/voyage.js](voyage/voyage.js). Restore the intended context when returning.
- Escape closes the active panel or cancels the sailing course according to context. Keyboard shortcuts must not fire while typing in a text field.
- Restoring focus after a render must keep the target reachable and visibly focused. Native dialog focus behaviour requires browser checks.
- Close or replacement of a fishing/photo activity must dispose its pending UI work. Timers cannot commit an action behind another panel.
- Fishing uses individual button presses with no reaction deadline. Show movement text and numeric tension/progress as well as colour. At narrow widths the three rod actions stack with at least 50 px height; tackle choices wrap and the species notebook becomes one column. Validate the catch reveal, field-guide scroll and dawn-report return on phones.

## Touch and readability

Provide named buttons for actions that also exist in artwork. Small drawn signs and map labels are supplementary; price, destination and objective text must be available in the interface. Retain readable system-font fallbacks and use focus styles in addition to colour.

Use at least 44 × 44 CSS pixels as the manual target-size criterion for primary touch controls. Check actual rectangles on a phone; a DOM callback test cannot establish their size. Hover-only decoration must be gated by hover capability. The page and panels should contain overscroll so browsing content does not trigger an unintended page movement.

The six-second Voyage arrival notice is non-blocking and lives below the port tabs. Its countdown uses real time, does not announce every second and must leave tabs, Cast off and footer controls usable. Guidance and optional stories open through deliberate choices.

## Animation budget

In Classic's main SVG harbour, recurring animation should use `opacity` and `transform`. Animating paint properties such as `stroke`, `fill` or `stop-color` can invalidate a large scene. A colour shift uses a static alternate-colour layer with animated opacity. [classic.html](classic.html) and [styles.css](styles.css) implement this for the neon sign.

Small reflections, glints and distant flicker stop under the phone animation rules in [styles.css](styles.css). Keep those overrides after the base animation declarations. Avoid adding broad SVG filters or continuous layout work. The brief crossing wake is an existing paint-property exception and needs profiling if crossing performance regresses.

Voyage's native scenery in [voyage/harbour-art.js](voyage/harbour-art.js) and [voyage/coast-art.js](voyage/coast-art.js) culls offscreen detail and respects reduced motion. Decorative effects do not alter collision geometry. The enlarged region chart and fuel-route searches need performance observation on constrained devices.

## Motion and audio accessibility

Classic's motion setting combines a user preference with the system request. Voyage follows its reduced-motion handling for decorative movement. Test both full and reduced motion, including the same six-second arrival reading time and fishing's relaxed controls.

Audio starts from a user gesture, with music and effects controlled separately. Verify page hiding, locking, returning and reopening using real browser audio. A mock Web Audio graph does not establish autoplay, speaker quality or operating-system interruption behaviour. See [SOUND.md](SOUND.md).

## Device validation matrix

These are required test configurations, not claims of completed coverage.

| Configuration | Main checks |
| --- | --- |
| Desktop Chromium and Firefox | Keyboard, focus, resize, controls, panels, Canvas and SVG rendering |
| Desktop Safari | Native dialog, storage, rendering and audio lifecycle |
| Android Chrome, narrow and standard portrait | Touch steering, address bar, scrolling, back/close, price and objective readability |
| iPhone Safari, portrait and landscape | Safe areas, software keyboard, touch controls, scrolling and audio resume |
| Short landscape phone | Header/sea separation, port panel, chart panning and access to all actions |
| Reduced motion | Static decoration, full reading time and usable activity controls |
| Storage unavailable | Visible persistence notice, in-memory play and separate mode behaviour |

Use 320 px and 390 px widths and a short landscape viewport for preliminary layout review, then test physical devices. Record browser version, operating system, device, orientation, viewport, game version and commit.

## Release acceptance

Run the automated suites in [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md). Native Canvas renders and mock DOM checks are development evidence; current real-browser CSS, touch comfort, Safari/iOS, listening and physical-phone performance remain to be validated.

A device pass must demonstrate a complete first delivery, gold transaction, activity, departure/docking, long-panel return, save/reopen and expedition continuation. Check for clipped controls, unintended document scroll, obscured objectives and sustained stalls. Attach reproduction steps and the affected source files to any defect report.

## Harbour-evening controls

The route board uses stacked stop cards with labelled reorder/remove controls and native service selectors. At 320–420 px, selectors and recipe choices stack vertically; actions retain 44-pixel targets. Fixed dialog Back/Close remain outside the scrollable content. Test twelve-stop plans, long disabled reasons, the three course boards and all supper/evidence panels in portrait and short landscape. Observe full-itinerary budget latency and the numbered lantern rings during touch steering.
