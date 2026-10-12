# Art direction and asset specification

Neon Tides presents a warm working harbour at night: amber interiors, cool water, restrained neon, adult characters and everyday food. Fine ink, painted shadow and quiet expressions support its JRPG and lo-fi identity. Character continuity and readable navigation take priority over decorative complexity.

## Visual layers

| Layer | Implementation | Requirements |
| --- | --- | --- |
| Voyage sailing world | [voyage/voyage.js](voyage/voyage.js), [voyage/harbour-art.js](voyage/harbour-art.js), [voyage/coast-art.js](voyage/coast-art.js), [voyage/sea-boundary.js](voyage/sea-boundary.js), [voyage/shoreline-art.js](voyage/shoreline-art.js) | Native Canvas geography, waterfronts, crew, keepsakes and weather |
| Voyage region chart | [voyage/breakwater-ui.js](voyage/breakwater-ui.js) | Draw from actual world geometry; keep named destination controls beside the chart |
| Classic scenes | [classic.html](classic.html), [styles.css](styles.css) | Inline SVG landmarks, state overlays and semantic targets; local scene plates where present |
| Character portraits | [assets/portraits/](assets/portraits/) | Local WebP/SVG with consistent identity and readable face framing |
| Illustrated scenes | [assets/scenes/](assets/scenes/) | Harbour-specific composition, warm light and descriptive alternative text |
| Market sprites | [assets/sprites/](assets/sprites/) | Matching Sora, Nao and Kenji identities with preserved transparency |
| Food and activity illustration | [voyage/leisure-ui.js](voyage/leisure-ui.js), [voyage/neighbours-ui.js](voyage/neighbours-ui.js) | Native SVG dishes and fish, with clear selectable ingredients |

Decorative world details must not change collision geometry or conceal quay rings, route indicators and readable controls. Voyage's chart is a navigation view of the implemented map, not a separate geographic approximation.

## Character continuity

| Character | Stable visual cues |
| --- | --- |
| Nao Mizuno | Tied brown hair, ivory shirt, faded terracotta apron |
| Rin Starling | Short dark hair, olive workwear, practical workshop accessories |
| Mio Amami | Chestnut side ponytail, brass glasses, blue coat, ivory scarf and constellation pin |
| Auntie Mei | Mature face, dark violet/silver hair, burgundy apron and jade earring |
| Priya Gale | Black shoulder-length hair, white blouse, navy waistcoat and ID lanyard |
| Sora Ember | Blonde bob, navy workwear and brass details |
| Jun Arai | Glasses, dark shirt and green tea-shop apron |
| Hana Tsukino | Half-tied dark hair, dusty-rose overshirt and clipboard |
| Mako Senda | Salt-and-pepper hair, rust scarf and weathered work jacket |
| Captain Lam | Silver hair, moustache, indigo station coat and thermos |
| Yumi Sol | Dark ponytail, muted teal/green scrubs and shoulder bag |

Use existing portraits as the identity specification for the remaining cast. Do not change internal character IDs when refining an image. Rei Minato retains the internal ID `teo`; Bengt's portrait uses the `radio` asset naming.

## Production formats

The shipped inventory is [tools/asset-manifest.json](tools/asset-manifest.json). Each entry records its path, category, format, pixel or vector dimensions, byte count, SHA-256 and direct source references. Assets without direct references are labelled retained; they must not be assumed safe to delete without checking runtime filename selection.

| Asset type | Current convention |
| --- | --- |
| Retained original portraits | 512 × 512 WebP; existing Classic references remain available |
| Refined Nao/Rin/Sora/Aki/Yumi/Matte/Kenji/Lam expressions | 724 × 724 WebP; relaxed, thoughtful and pleased, with consistent face framing |
| Refined Mei/Priya expressions and Jun/Hana/Mako portraits | 1024 × 1024 WebP |
| Active Mio observatory expressions | 1254 × 1254 WebP; relaxed, thoughtful and pleased |
| Classic scene plates | 1440 × 800 WebP |
| Voyage story illustrations | 960 × 640 WebP |
| Dockside seats | 1440 × 960 WebP |
| Launcher title | 2048 × 688 WebP with a 1024 px responsive variant |
| Player postcard | Actual Canvas capture at 480 × 320, bounded in local profile storage |
| Icons | SVG favicon and local PNG application/touch icons |

Inspect export dimensions and bytes rather than relying on a filename. Preserve alpha for full-body sprites. Keep local paths and descriptive filenames stable. Variant selection belongs to [voyage/ports.js](voyage/ports.js), the relevant UI module or Classic content definitions. Classic's existing references and earlier portraits remain available when Voyage receives a refinement.

## Composition, colour and motion

Faces should be large enough for the displayed portrait, with natural adult proportions and subtle readable emotion. Scenes retain recognisable working places: kitchens, scales, tea tables, platform shelters, workshop pumps and observatory charts. Keep signage as editable native code where practical.

Use amber/cream for welcome and food, muted blue/teal for water and workwear, and restrained cyan/magenta for harbour signs. Orange distinguishes the short arrival summary from dialogue. Knowledge categories and disabled actions need labels as well as colour.

Use native motion for steam, water, crew details and landmarks. Honour reduced motion, cull offscreen detail and follow [MOBILE.md](MOBILE.md)'s animation budget. Portraits and larger optional seats should not increase the sailing view's mandatory raster layers.

## Uncharted-water boundary

[voyage/sea-boundary.js](voyage/sea-boundary.js) draws opaque navy-black outside the current allowed area and layers feathered, unequal cloud lobes and curved contours along its inner edge. The outer collision strips are omitted from decorative land drawing; the model geometry remains unchanged. Before chapter two, the same veil covers the locked coast. It opens immediately when expedition access unlocks.

The sailing view and minimap use the dark sea palette; the parchment chart uses muted charcoal. Ferry, course and quay indicators draw above the veil. All shapes are deterministic and static, require no blur filter or downloaded texture, and cull work outside the camera. Keep the veil separate from collision, price and save rules.

Mio’s active expression paths select the observatory portraits through [voyage/ports.js](voyage/ports.js). Earlier variants are retained. Her native map figure carries matching scarf, glasses, coat details and constellation pin in [voyage/harbour-art.js](voyage/harbour-art.js).

## Working coast and evening scenes

[voyage/shoreline-art.js](voyage/shoreline-art.js) replaces natural-island surface edges with deterministic contours, shallow-water colour and rocks. Solid contour deviations stay within six world units of the existing bounds, inside navigation clearance. Built waterfronts retain readable constructed edges. Collision rectangles, quay coordinates and save positions remain authoritative.

[voyage/coast-art.js](voyage/coast-art.js) adds hillside paths, tea baskets, working figures, masonry, a credited station rota and guest tables. Window light and kitchen steam follow restoration state; hosted servings leave bowls and guests visible. Completed dispatch resolutions and dockside supper tables appear through native drawing. Decorative steam remains static under reduced motion.

The evening portrait set refines eight previously 512-pixel characters and adds expressions for characters that had a single active portrait. Earlier assets remain for Classic. Each 724-pixel square is exported from its expression sheet without enlargement; active selectors are verified against the asset manifest. Portraits load in explicit conversation/activity panels and introduce no raster layer into sailing.

## Asset review

After adding or refining assets, run `node tools/documentation-checks.mjs --update-assets` and review the inventory diff. Run `node tools/documentation-checks.mjs` without that option to verify shipped files, dimensions, hashes and references without modifying metadata. Optional `node tools/voyage-render-checks.mjs <output-directory>` renders implemented Canvas scenes with `@napi-rs/canvas` for inspection.

Review portraits at their actual display size, scenes at desktop and phone widths, alpha edges against dark water, and the chart against navigable geometry. Verify local loading, alternative text, motion settings and state-dependent character presence. Native renders establish artwork output; browser CSS and phone readability require manual QA. See [CREDITS.md](CREDITS.md) and [LICENSE](LICENSE) for reuse terms.
