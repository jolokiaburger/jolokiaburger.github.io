# Neon Tides

Open `index.html` to choose **Voyage** or **Classic**.

**Voyage 0.17** is the sailing adventure: nine home quays and two outer-coast quays, fourteen neighbours, gold trading, cargo deliveries, optional sea encounters and stories with Nao, Rin and the canal festival. Steer with WASD/arrows or touch controls; Set course assists. Food, tea, radio and familiar faces give the journey its pace. The Journal keeps several active stories, remembered prices, route estimates and letters between voyages.

The latest update is **Beyond the Breakwater**, a three-chapter Nao/Rin adventure across continuing nights. Prepare the Tern, visit Aonami Tea Island and Shiosai Coastal Station, recover Etsuko’s recipe pages, then choose a station kitchen or travelling supper book. Keep your purse, owned gold, tank and fittings between expedition nights. Conversations unlock a surveyed inlet, Jun’s alternate tasting and a second ending. The illustrated chart has named destinations, pins, route/fuel previews and a detail view for phones. Coastal fishing, three water stops, two cargo contracts, native landmarks and two new dockside illustrations complete the outer coast. Begin through **People → Beyond the Breakwater** at Nao’s market counter. All new views open by choice. See [VOYAGE-BREAKWATER.md](VOYAGE-BREAKWATER.md) for rules and save details.

**People across the water** from 0.16 adds three passenger fares with optional thermos stops, four small neighbour favours, three learnable recipes and gentle docking practice. Dockside conversations offer 28 topics and full player replies; an attributed notebook keeps working rules, history, rumours and two sourced science notes. Investigate the twice-rung bell, then choose how its story belongs on the board. Cooking uses your actual catches and ingredient choices. Five more keepsakes, visible passenger luggage, subtler character motion and illustrated Metro, yard and observatory seats make the familiar quays worth revisiting. Port tabs remember scroll position; Back and Close stay outside the scrolling content. Existing Voyage saves and Classic's separate save remain compatible. Rules and implementation: [VOYAGE-NEIGHBOURS.md](VOYAGE-NEIGHBOURS.md). Controls and verification: [VOYAGE-PLAYTEST.md](VOYAGE-PLAYTEST.md), [VOYAGE-AUDIT.md](VOYAGE-AUDIT.md).

**Harbour pastimes** from 0.15 remain: dockside fishing, Nao's three-customer kitchen shift, Yumi/Mio photo errands and a persistent postcard album. The journey strip gathers destination, arrival, fuel and deadlines; individual cargo budgets include reachable refuelling stops. Mei and Priya have finer portraits and expressions, alongside the illustrated kitchen, market and canal seats. See [VOYAGE-HARBOUR-LIFE.md](VOYAGE-HARBOUR-LIFE.md). All activities open by choice. The first page includes a discreet **Code on GitHub** link.

**Classic 4.6.1** at `classic.html` keeps all existing chapters, locations, sound and stories. Web-hosted Classic uses the original save key and can continue existing shifts. Its rules follow below.

A warm trading adventure in a rain-soaked neon harbour. You run the night ferry *Tern* with a little physical gold, a few hundred credits and most of a tank. Gold is the Basin's money of last resort, and the metal its wet machines run on. Tonight the noodle bar is full of rumours that point in opposite directions.

Eat, listen, decide whom to believe, buy or sell, and maybe cross the harbour to see for yourself. In the morning the harbour wire says what really happened.

A night takes about 10–15 minutes. **Classic has three chapters**, including a morning shift. Each night has three possible market situations.

## Play

Open the game in any modern browser (desktop or phone). Nothing is installed or downloaded while you play, and progress is saved in your browser only.

## How to play, without spoilers

- **Begin your trading adventure.** You wake at Kurage 33, the noodle bar on the east quay, at 23:40.
- Every scale in the harbour chalks two numbers a gram: what you pay to **buy**, and what you get when you **sell**. The bar under the picture shows the board where you are.
- **Sitting down is how you hear things.** Noodles and tea cost a few credits and some time; people talk while you eat. Not every bowl comes with news.
- What you hear goes into the **journal** as it was said, with who said it and when. Nothing tells you whether it's true.
- Crossing the harbour costs fuel and time. Prices differ between quays, and they move when something happens.
- Dealers notice when you lean on them: buy a lot and the price goes up; some have only so much to sell or will only take so much.
- After the first morning report, choose **Continue to Night Two · Keep earnings & choices**. Your credits, gold, fuel and relationships carry over; Nao remembers your help. Night Two has a new recipe trial and an optional sealed-rice trade.
- From 01:30 you can **turn in** aboard the Tern; at dawn the night ends by itself. The morning card tells you what happened and what your night was worth.

**Controls.** Click or tap the ringed people and things in the picture, or the choices under the story. Keyboard: `1`–`9` choose actions, `N` notebook, `M` menu, `R` radio, `Esc` closes panels. The radio (off by default) plays generated music. Menu → **Harbour sounds** separately enables gentle ferry, gold-trading and market effects; **Effects volume** cycles through 30%, 60% and 100%. Both controls remember your choice. See `SOUND.md`.

The four short investigations from earlier versions are under **Case files** on the title screen.

## Feedback wanted

If you play a night, the most useful things to hear are: Did you find the other quays without being told? Did you notice the prices moving? After the morning card, could you say *why* you made or lost money? Was anything confusing?

## Licence and credits

Code is MIT-licensed; artwork and story text are CC BY 4.0. See `LICENSE` and `CREDITS.md`. Everything is original and fictional; no fonts, libraries or sounds are downloaded.

## Classic · Beyond the breakwater

Visit the Lantern Night Market for gold and grilled skewers, or Starling Salvage Yard for assayed salvage, tea and paid refuelling. Ask Sora at the market about a lighthouse delivery, then obtain Rin's reef chart to unlock Hoshimi Island. The island crossing costs three fuel and 35 minutes each way. Return the lantern kits for a choice of credits or gold. The journal tracks your next step, and the morning wire remembers the outcome.

The destination buttons scroll sideways on phones. Existing saves continue without restarting. The four investigations retain their original destinations.

Conversations include Next/Previous and Read full exchange. Open People for free casual chats with varied replies. See `ADVENTURE.md` for the implementation and run `node tools/adventure-checks.mjs` for engine checks.


## Explore the Lantern Night Market

Browse Sora's gold scale, Nao Mizuno's food counter and Kenji Arata's repair bench in the illustrated arcade. Browsing is free; food, tea and searches show their costs before you choose. Follow the overdue gold launch from a courier's rumour to the current manifest and its dispatcher, then choose a small gold order or a courier payment. Deliveries replenish the gold tray on their actual schedules. Later in the night the repair bench and grill close, but tea and gold remain available until dawn.

The market includes contextual conversations and varied free chats. Existing lighthouse progress and saves continue. See `NIGHT-MARKET.md` for the rules, source files and spoiler-marked test routes.

## Nao's breakfast story

At Nao's food counter, ask about the folded recipe to begin **The Last Bowl Before Sunrise**. Help prepare the counter, invite neighbours, or simply return for her first sunrise bowls. The personal story can be completed without buying anything. An optional twelve-portion supply batch adds a small trading decision: compare suppliers, allow for crossings and time, and accept that a quiet morning may leave stock unsold. The opening begins at 05:00; Nao keeps a last bowl for late arrivals until dawn. Rules and spoiler-marked routes: `NAO-STORY.md`.

## Night Two · A Lantern for Tomorrow

After ending Night One, continue from its morning card. Visit Nao to choose smoky mushroom rice or plum-and-sesame rice, help with the seasoning, and return for a free tasting from 05:00 until dawn. Her response remembers whether you attended her previous opening, arrived late, helped prepare her warmer or invited her neighbours.

The Tern has two ingredient cargo slots for this chapter. One purchase route per night: Landing 3 sells sealed rice crates for 18 cr each; the market sells them for 26. Nao buys them for 30 each if handed over by 04:30. Alternatively carry one co-op crate for a 12 cr courier fee without buying it. Owned unopened leftovers can be returned at Landing 3 for 16 each by 05:45. Fuel, time and five-minute handovers matter; no payout occurs automatically at dawn.

Gold trading follows fresh festival news, with a provisional instrument order, a confirmed co-op delivery and three possible outcomes. The second morning report closes this two-night story. See `NIGHT-TWO.md` for rules, source files and verification limits.

## Kisaragi Canal Town & Nao's invitation

Ask Priya at Landing 3 about Kisaragi to unlock the inland canal. The crossing costs two fuel and forty minutes each way; the town has a fuel pump, gold exchange, tea, dumplings, three new neighbours and a parcel with an unfinished address. Jun's one-case tea order costs 24 cr and pays 38 cr at Sora's scale, before fuel and time. The notebook keeps its account separate from gold.

In Night Two, choose Nao's recipe, then read her festival invitation. Prepare a sample, meet Hana and ask Jun about tea. Help Nao choose a small festival table or send her signed recipe while keeping her afternoon off. You can complete the original recipe tasting in town when she travels with you. See `CANAL-TOWN.md` for the routes, deadlines and source files.

## Trading over tea and harbour stories

- Ask Nao about gold history, spreads, rumours and cargo in **Trading over tea** at the market. Topics rotate through fresh replies and remember a completed delivery or a losing sale. Talking is free.
- Before accepting rice, sealed tea or small freight, an offer card shows purchase cost, payment, gross margin, destination, known crossing costs and time left on arrival. Margins exclude return travel, fuel purchases and other expenses.
- Ask Rin about **The wrong golden parcel** at Starling Yard. Check Priya's dispatch copy and Kenji's part stamp, compare the records with Rin, then correct the receipt. This optional investigation does not buy gold or add purity penalties to normal trading.
- Browse **The Lantern Review** rack at Mei's counter for harbour, summer, gold, Halloween and Christmas excerpts. Completed projects add notes to the summer archive. Reading costs no time.
- In Chapter Three, after Nao's free breakfast, arrange **An afternoon off**: pack Mei's free picnic, check the meeting place with Priya and return to Nao. The completed morning report opens a 12:30 vignette: join the picnic, carry the basket, or leave Nao and Haruto private family time. Low water moves it to the harbour bench. The afternoon does not change settled trading accounts.

Delivery memories include bowls at Mei's counter, cloth on Sora's lantern frames and seals at Mako's pump bench. Existing saves remain compatible. Details and test limitations: `HARBOUR-REFINEMENTS.md`.

**Harbour Wire.** At Landing 3, read the ringed noticeboard or choose **Read the Harbour Wire**. The Journal also has a shortcut from any quay. Filter Trading, Neighbours, Stories or Notices; new posts appear with the clock, deliveries and completed stories. Cargo notices show purchase and promised payment, with expired offers marked. Priya's umbrella request is a small optional story tracked in the Journal. Reading is free and works offline.

**Harbour polish & festival supplies.** Kitchen shelves, workshop fittings, softer architectural colours, small reflections and weather accents refine the existing scenes. Delivered festival goods and Priya's umbrella appear in the picture. The Wire supports unread markers, saved pins and journal links. At Landing 3, choose festival courier work (no stock purchase, 16 cr in total fees) or buy three separate supply cases (40 cr purchase, 66 cr promised payment); normal fuel, shared cargo capacity and delivery deadlines apply. See `HARBOUR-POLISH.md`.

**Latest update.** The title screen and Menu show the player-facing version and update date. **What's new** contains three short highlights; its New marker disappears once viewed in this browser. `release.js` owns these details, independently of the save-format version.
