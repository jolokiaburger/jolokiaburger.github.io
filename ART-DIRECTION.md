# Quiet night-shift character art

The current game uses an original cast illustrated with grounded adult proportions, fine ink linework, subtle expressions, muted workwear and warm night-shift light. The requested manga was a mood reference; no panels or existing character designs were used as game assets. The harbour keeps its neon signs while character clothing, stall paint and dialogue frames become more restrained.

All fifteen portraits were generated with the built-in image-generation tool. Source PNGs were exported to 512 × 512 WebP at quality 84 for the game. The complete portrait set is 436,648 bytes. Each speaking character uses the same larger portrait presentation (112 px on desktop, 80 px on phones). The small harbour figures are original native SVG illustrations, with matching clothing and hair, authored separately for readability at map scale.

Internal character IDs and saves stay compatible. Oduya now has his own figure. Hollis's figures follow his arrival/departure schedule, and Rei appears at Pier 9 from 01:30. Bengt is heard by radio and has a portrait rather than a new physical quay location.

## Generation prompts and project assets

Every generation used this common prompt, followed by the character description below:

> Create an original production portrait for a browser game, Neon Tides. Grounded adult slice-of-life manga illustration: nuanced everyday faces, natural adult anatomy, fine varied ink linework, restrained eyes, subtle asymmetry, delicate cross-hatched shadows, muted warm colours, soft night-shift lighting. Quiet human warmth and understated humour. Shoulder-up square portrait, head fully inside frame, face large and readable, uncluttered muted charcoal-blue backdrop. This is a distinct original character, no likeness to any existing manga character, no text, no logos, no smoking, no fantasy armour, no chibi or plastic vector-art look. 

### teo

Asset: `assets/portraits/rei-manga.webp`

Rei Minato, Japanese woman age 32, short layered dark hair with one side tucked behind ear, modest orange-brown work jacket over dark T-shirt, practical small dispatch headset, a slightly tired but confident crooked smile.

### mei

Asset: `assets/portraits/mei-manga.webp`

Auntie Mei, Japanese woman around 58, sculpted dark-violet bob with silver temple streaks, sharp mature cheekbones and steady violet-gray eyes. Charcoal high-collared work blouse, practical burgundy noodle-shop apron and jade earring. Calm capable bearing, subtle wrinkles and a kind smile. An original older cyberpunk interpretation inspired by Motoko Kusanagi, grounded in her everyday role as a cook.

### priya

Asset: `assets/portraits/priya-manga.webp`

Priya Gale, Japanese office worker and ferry clerk around 39, straight black shoulder-length hair with neat side-swept fringe, no glasses. Crisp white blouse, navy waistcoat, blue ID lanyard and pocket pen. Approachable cashier-like workplace warmth inspired by Smoking Behind the Supermarket with You, with original facial features and uniform. Gentle smile and quiet night-shift competence.

### matte

Asset: `assets/portraits/matte-manga.webp`

Matte Rook, East Asian man age 45, broad shoulders, slightly unruly short salt-and-pepper hair, light stubble, weathered navy rain jacket and faded grey work shirt. Reserved gentle expression, tired eyes, looks intimidating but kind.

### dex

Asset: `assets/portraits/dex-manga.webp`

Dex Swift, East Asian man age 27, tousled short black hair, well-worn ochre courier jacket and dark shirt, helmet strap resting around his neck. Playful slightly bashful grin, ordinary slim adult build.

### yumi

Asset: `assets/portraits/yumi-manga.webp`

Yumi Sol, Japanese woman age 36, shoulder-length dark brown hair tied loosely at the nape, sage green nurse's jacket under an open grey coat, little canvas bag strap. Calm attentive eyes, soft dry humour, natural mature facial proportions.

### lam

Asset: `assets/portraits/lam-manga.webp`

Captain Lam, Cantonese man age 67, silver hair swept back, fine lined face, small moustache, old indigo dock-worker coat over knitted vest. Wry easy smile, practical rather than heroic. Brass thermos edge visible.

### radio

Asset: `assets/portraits/radio-manga.webp`

Bengt, Scandinavian tug captain age 58, broad lined face, sandy-grey hair, short greying beard, faded slate-blue work shirt, small radio earpiece. Warm tired smile, reassuring dependable ordinary adult.

### hollis

Asset: `assets/portraits/hollis-manga.webp`

Hollis, Southeast Asian salvage diver age 41, sun-browned skin, short wet dark hair, modest beard stubble, dark olive drysuit collar partly unzipped over plain grey shirt. Boisterous grin tempered by tired eyes, no fantasy equipment.

### oduya

Asset: `assets/portraits/oduya-manga.webp`

Oduya, Black harbour gold broker age 48, closely cropped dark hair, dark brown skin, thin oval wire glasses, simple tan canvas work vest over charcoal roll-neck. Thoughtful restrained amused smile, one gloved hand near chin.

### sora

Asset: `assets/portraits/sora-manga.webp`

Sora Ember, woman around 38, honey-blonde chin-length wavy bob with side part, light brows, gray-green eyes and subtle freckles. Navy structured work jacket over a deep-blue blouse, small brass earrings and pin. Confident welcoming smile; a clearly different silhouette and colour palette from Nao’s tied brown hair and terracotta apron.

### rin

Asset: `assets/portraits/rin-manga.webp`

Rin Starling, Japanese woman age 34, short slightly messy dark hair, faded olive utility coveralls partly open over ivory shirt, subtle grease smudge on cheek. Bright wry grin, practical engineering worker, no goggles or fantasy costume.

### aki

Asset: `assets/portraits/aki-manga.webp`

Aki Hoshimi, Japanese nonbinary adult age 33, straight dark shoulder-length hair tucked behind ear, softly androgynous mature face, muted violet-grey knitted cardigan over dark lighthouse work shirt. Quiet thoughtful half-smile, sheltered night-shift warmth.

## Verification

The complete cast and native SVG scene crops were visually inspected. Engine checks cover all portrait assets and WebP dimensions, character availability, map target IDs and both old and expanded gameplay. Interactive browser layout and real phone testing remain unverified.


## Night Market art

The Lantern Market now uses `assets/scenes/lantern-market.webp`, an original 1440 × 800 arcade illustration. Two new portraits, `assets/portraits/nao-manga.webp` and `assets/portraits/kenji-manga.webp`, use the same 512 × 512 presentation. Three full-body transparent sprites at `assets/sprites/{sora,nao,kenji}-market.webp` match those characters' own portraits. All six images were generated with the built-in image-generation tool; scene/portrait exports use WebP quality 84, sprite exports preserve transparency. All images are shipped locally; the game makes no image-service calls.

The exact prompt set is recorded in `tools/night-market-art-prompts.json`. Portraits are original character designs. Sprite references are Sora's existing game portrait and the new Nao/Kenji portraits, inspected before generation. No third-party manga panels or character images were used. The native SVG stall targets, signs, dispatch notices, parcels and wish star in `index.html` remain editable code.

Nao Mizuno is a 29-year-old food-stall keeper in a cream work shirt and faded terracotta apron. Kenji Arata is a 47-year-old mechanic in moss-gray workwear, with stubble and glasses pushed onto his head. Sora remains the market's gold host. The scene uses fine ink contours, painterly amber lantern light, cool harbour shadows and wet wood; the smaller sprites share that treatment.

## Three-character visual refinement

Sora, Priya and Mei were redesigned with the built-in image-generation tool. The exact portrait and sprite prompts are recorded in `tools/character-redesign-prompts.json`. Sora’s transparent market sprite matches her new blonde/navy portrait; Priya’s ticket-window figure and Mei’s counter figure in `index.html` match their updated office wear and violet/silver hair. Character IDs and story progress remain unchanged. The original fifteen-portrait byte count above describes the earlier art pass, not the expanded current cast.

## Voyage 0.8: expressions and illustrated memories

Nine original 512 × 512 portraits give Nao, Rin and Mio relaxed, thoughtful and pleased expressions. Mio’s chestnut side ponytail, brass glasses, blue work jacket, cream scarf and constellation pin carry forward her original SVG design into the illustrated portrait style. Nao and Rin use their existing game portraits as identity references. Three 960 × 640 optional scenes show the constellation supper, Nao’s dawn breakfast counter and Rin with Second Helping. Built-in image generation produced every image individually; Pillow only downscaled and exported WebP (portraits quality 82, scenes 80). Full prompts and reference/source paths are in `tools/voyage-art-prompts.json`. No third-party character images or manga panels were used.

Canvas figures remain native drawing code with cast-specific palettes, hair and accessories. Shoreline shading, slow telescope movement, steam, rope slack and work light are decorative and do not alter navigation geometry. All motion follows the existing reduced-motion setting. Twelve images total less than one megabyte; the three larger scenes load only when opened.

## Voyage 0.9: warm character places

The fourteen Voyage portraits were inspected against Nao. Aki, Yumi and Matte benefited from brighter face lighting and place context; Sora’s brass scale and lantern counter support her new shared evening story. Their faces, ages, hair, gender presentation and existing outfits remain the identity references. Original portraits remain available alongside the new `assets/portraits/{aki,yumi,matte,sora}-harbour.webp` exports. Nao’s portrait was used only as a style/lighting reference, not as a face template. The four portraits were produced individually with built-in image generation, then downscaled to 512 × 512 and exported at WebP quality 82. Prompt/reference provenance is in `tools/voyage-09-art-prompts.json`. No manga panels or third-party character imagery were used.

Quay clothing was checked against the actual portraits: Priya’s navy office vest, Jun’s green apron/glasses and Mako’s silver hair and rust scarf now match their figures. The new pontoon, weather raft, flower skiff, ferry passenger, cargo straps and cabin posy are editable native Canvas shapes. No raster layer is added over the sailing view.

## Voyage 0.13 · Mio and the working waterfront

Mio’s three expression portraits were refined with the built-in image-generation tool from their existing identity references and Nao’s original relaxed portrait as a rendering-quality reference. They retain Mio’s own face, chestnut ponytail, gold glasses, blue work coat, ivory scarf and observatory background. The new `assets/portraits/mio-{relaxed,thoughtful,pleased}-harbour.webp` exports are 1024 × 1024, WebP quality 86. Exact prompts: `tools/voyage-13-art-prompts.json`. Existing versions are retained. Other active portraits were visually reviewed and kept.

The sailing map keeps native Canvas art. `voyage/harbour-art.js` adds translucent jellyfish, quiet fish shoals, softly curved ripples, reflected quay light, roof materials, dock planks, stone edges and small working-harbour details. Figures have layered clothing, less rounded silhouettes, finer hair and individual work accessories. Decorative movement honours reduced motion; no raster portrait is laid over the sailing view.


## Voyage 0.14 · Closer canal portraits

Jun, Hana and Mako's older portraits were inspected against Nao's finer illustration. Their wider scene framing gave the faces fewer source pixels than the newer portraits. Three individually generated replacements use their own portraits as identity references and Nao only as the rendering and lighting reference. Jun keeps his glasses, dark shirt and green tea-shop apron; Hana keeps her half-tied dark hair, dusty-rose overshirt and clipboard; Mako keeps their salt-and-pepper hair, mature face, rust scarf and weathered work jacket.

The new `assets/portraits/{jun,hana,mako}-harbour.webp` files are 1024 × 1024, WebP quality 86, with closer chest-up framing. Built-in image generation supplied the drawn detail; Pillow only resized and exported the production files. Original portraits remain intact and Classic retains its original references. Full prompts, references and source paths are in `tools/voyage-14-art-prompts.json`.


## Voyage 0.15 · A closer seat and familiar expressions

Mei and Priya each receive relaxed, thoughtful and pleased 1024 × 1024 WebP portraits. Their own previous portraits are identity references; Nao's established art is a style reference only. Fine ink, textured shadow, adult proportions and warm working places remain the quality target. Three 1440 × 960 WebP scenes show Mei's kitchen, Nao's lantern counter and Jun's canal tea table. Scenes open only on request, with functional controls beside the illustration.

All nine assets use the built-in image-generation tool and quality-86 WebP exports. Their exact prompts, source references/paths, output paths, byte counts and hashes are in `tools/voyage-15-art-prompts.json`. Original assets remain; only Voyage selects the new Mei/Priya portraits. Fish and bowl illustrations are local SVG code in `voyage/leisure-ui.js`; photo markers and keepsakes are native Canvas in `voyage/voyage.js`. Player postcards capture that actual native harbour art, not generated placeholder photographs. Steam and float bobbing respect reduced motion.

The cast was reviewed at displayed scale; this pass targets two frequent faces and does not claim every portrait was redrawn. Native Canvas photo and decoration renders were inspected separately from mock DOM tests. Actual browser CSS and phone readability remain unverified.

## Voyage 0.16 · Metro, workshop and star charts

Three individually generated 1440 × 960 dockside scenes extend the existing close-seat format: Lam and Yumi share tea at Metro's late platform, Rin pauses beside the yard pump bench, and Mio sets a warm drink beside the observatory chart. Their own portraits define identity; Nao's established market seat defines drawing quality and lighting. Lam keeps silver hair, moustache and his navy station coat; Yumi keeps her dark ponytail and teal scrubs; Rin keeps short dark hair and olive work jacket; Mio keeps her chestnut ponytail, glasses and blue coat/scarf.

Fine ink, painted shadow, readable adult faces, warm lamps and a working harbour backdrop preserve the anime/JRPG atmosphere. The images were made with the built-in image-generation tool, then resized and exported at WebP quality 86. Each is roughly 300–337 KB and loads only when its seat opens. Exact prompts, identity/style references, source dimensions, output paths, byte counts and SHA-256 hashes: `tools/voyage-16-art-prompts.json`. All original files and Classic references remain.

Passenger figures and luggage, five new keepsake shapes and the optional approach guide are original native Canvas art in `voyage/voyage.js`. Brief native eye blinks are in `voyage/harbour-art.js`; reduced motion holds eyes open. The illustrated recipe tray reuses local SVG food shapes from `voyage/leisure-ui.js`, with ingredient placement and serving motion in `voyage/voyage.css`. These effects are decorative and pause under reduced motion. No third-party game/anime panels or characters were used.
