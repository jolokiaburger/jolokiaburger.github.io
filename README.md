# Neon Tides

A warm trading adventure in a rain-soaked neon harbour. You run the night ferry *Tern* with a little physical gold, a few hundred credits and most of a tank. Gold is the Basin's money of last resort, and the metal its wet machines run on. Tonight the noodle bar is full of rumours that point in opposite directions.

Eat, listen, decide whom to believe, buy or sell, and maybe cross the harbour to see for yourself. In the morning the harbour wire says what really happened.

A night takes about 10–15 minutes. **This is an early test build**: one night, three ways it can really be going.

## Play

Open the game in any modern browser (desktop or phone). Nothing is installed or downloaded while you play, and progress is saved in your browser only.

## How to play, without spoilers

- **Begin your trading adventure.** You wake at Kurage 33, the noodle bar on the east quay, at 23:40.
- Every scale in the harbour chalks two numbers a gram: what you pay to **buy**, and what you get when you **sell**. The bar under the picture shows the board where you are.
- **Sitting down is how you hear things.** Noodles and tea cost a few credits and some time; people talk while you eat. Not every bowl comes with news.
- What you hear goes into the **journal** as it was said, with who said it and when. Nothing tells you whether it's true.
- Crossing the harbour costs fuel and time. Prices differ between quays, and they move when something happens.
- Dealers notice when you lean on them: buy a lot and the price goes up; some have only so much to sell or will only take so much.
- From 01:30 you can **turn in** aboard the Tern; at dawn the night ends by itself. The morning card tells you what happened and what your night was worth.

**Controls.** Click or tap the ringed people and things in the picture, or the choices under the story. Keyboard: `1`–`9` choose actions, `N` notebook, `M` menu, `R` radio, `Esc` closes panels. The radio (off by default) plays generated music and ferry sounds.

The four short investigations from earlier versions are under **Case files** on the title screen.

## Feedback wanted

If you play a night, the most useful things to hear are: Did you find the other quays without being told? Did you notice the prices moving? After the morning card, could you say *why* you made or lost money? Was anything confusing?

## Licence and credits

Code is MIT-licensed; artwork and story text are CC BY 4.0. See `LICENSE` and `CREDITS.md`. Everything is original and fictional; no fonts, libraries or sounds are downloaded.

## Beyond the breakwater

Visit the Lantern Night Market for gold and grilled skewers, or Starling Salvage Yard for assayed salvage, tea and paid refuelling. Ask Sora at the market about a lighthouse delivery, then obtain Rin's reef chart to unlock Hoshimi Island. The island crossing costs three fuel and 35 minutes each way. Return the lantern kits for a choice of credits or gold. The journal tracks your next step, and the morning wire remembers the outcome.

The destination buttons scroll sideways on phones. Existing saves continue without restarting. The four investigations retain their original destinations.

Conversations include Next/Previous and Read full exchange. Open People for free casual chats with varied replies. See `ADVENTURE.md` for the implementation and run `node tools/adventure-checks.mjs` for engine checks.


## Explore the Lantern Night Market

Browse Sora's gold scale, Nao Mizuno's food counter and Kenji Arata's repair bench in the illustrated arcade. Browsing is free; food, tea and searches show their costs before you choose. Follow the overdue gold launch from a courier's rumour to the current manifest and its dispatcher, then choose a small gold order or a courier payment. Deliveries replenish the gold tray on their actual schedules. Later in the night the repair bench and grill close, but tea and gold remain available until dawn.

The market includes contextual conversations and varied free chats. Existing lighthouse progress and saves continue. See `NIGHT-MARKET.md` for the rules, source files and spoiler-marked test routes.

## Nao's breakfast story

At Nao's food counter, ask about the folded recipe to begin **The Last Bowl Before Sunrise**. Help prepare the counter, invite neighbours, or simply return for her first sunrise bowls. The personal story can be completed without buying anything. An optional twelve-portion supply batch adds a small trading decision: compare suppliers, allow for crossings and time, and accept that a quiet morning may leave stock unsold. The opening begins at 05:00; Nao keeps a last bowl for late arrivals until dawn. Rules and spoiler-marked routes: `NAO-STORY.md`.
