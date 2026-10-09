/* Offline Harbour Wire. Load after morning-after.js, before game.js.
   Posts are public notices, never a back door to the seed's hidden truth. */
(function () {
  "use strict";
  const posts = [];
  function post(id, who, category, at, title, text, when) {
    posts.push({ id, who, category, at, title, text, when });
  }
  post("welcome", "priya", "Notices", "23:40", "A little wire across the water", "Welcome, neighbours. Pin a useful notice or something kind. Times matter: an old post is not a current price. The Tern keeps a copy in its journal.");
  post("scale", "sora", "Trading", "23:40", "Two numbers, one careful decision", "Buy is what you pay; sell is what you receive. Read the actual scale before committing. This board carries conversation, not live gold quotes.");
  post("tea", "mei", "Neighbours", "23:40", "The kettle is doing its best", "Hot tea at Kurage 33. You may sit without having an impressive story. A small story fits beside a bowl just fine.");
  post("yard", "rin", "Stories", "23:40", "Second Helping needs a first helping hand", "Our rescued ferry needs its bilge pump checked. Read my work board at Starling Yard if you'd like to help. Tools supplied; enthusiasm appreciated.", { notFlag: ["yard_done"] });
  post("umbrella", "priya", "Stories", "23:40", "Lost: one sky-blue umbrella", "I left my umbrella by the Metro Quay vending machine. There's a little paper star tied to the handle. Please read this request at Landing 3 before searching, then bring it back to me. No rush, no fee; tea and gratitude.", { notFlag: ["wire_umbrella_done"] });
  post("fuel", "teo", "Trading", "23:40", "Your return journey belongs in the budget", "Landing 3 has the regular fuel pump. A promising price across the Basin still needs a voyage home. Check your tank before chasing a margin.");
  post("nao", "nao", "Neighbours", "23:40", "A seat under the lanterns", "Skewers, tea, and a stool that doesn't ask about your day until you're ready. Come find me at the Night Market. I may have folded tomorrow's menu again.");
  post("locks", "mako", "Notices", "23:40", "Beyond the locks", "Kisaragi is open to little ferries. Check your crossing plan and leave fuel for the return. The canal looks longer when you stare at an empty tank.");
  post("receipts", "kenji", "Trading", "00:05", "Keep the small paper", "A receipt tells you what you actually paid. A lovely selling price is only half the story. I keep mine under a mug; please use a better filing system.");
  post("train", "dex", "Neighbours", "00:20", "Bicycle seeks dry corner", "If you see a bicycle wearing a shopping bag as a raincoat, that's mine. The rider is at Metro Quay, trying to look equally prepared.");
  post("gold", "nao", "Trading", "00:35", "Gold doesn't promise a good night", "It keeps, it weighs, and people here trust the assay more than a bank sign. That doesn't make every trade profitable. Ask me about spreads at the counter; I'll put the kettle on.");
  post("spoons", "hana", "Neighbours", "00:45", "Festival arithmetic", "Lanterns: plenty. Tables: nearly enough. Spoons: a mystery. Kisaragi's bridge is ready for visitors even if my inventory isn't.");
  post("late-train", "priya", "Notices", "01:10", "Last train, familiar reminder", "The last train is at 01:40. If you need a platform neighbour, don't leave the conversation until the empty lanterns answer you.", { night: 1 });
  post("opinions", "lam", "Trading", "01:20", "A rumour is a passenger", "You can carry it without letting it steer. Ask who saw what, and when. This is an old tug captain's opinion, not tomorrow's market forecast.");
  post("breakfast", "nao", "Stories", "01:30", "Thinking about sunrise", "I'm trying to put my own name on the breakfast menu. Come talk at my counter if you'd like to see how it's going. No gold purchase needed.", { night: 1, notFlag: ["nb_done"] });
  post("warm", "yumi", "Neighbours", "01:45", "Small maintenance for captains", "Have water. Eat something. Stretch your shoulders. A working ferry needs a working person, and people don't come with spare batteries.");
  post("paper", "sora", "Trading", "02:00", "Blue paper isn't a delivery guarantee", "Shipment schedules can change. If you're following the overdue launch, read the current dispatch and check it with the named witness. My selling tray and buying allowance are different things.", { night: 1, notFlag: ["nm_done"] });
  post("radio", "mako", "Neighbours", "02:15", "To the little ferry beyond the locks", "Your wake reached the bridge before your engine did. That's my favourite kind of arrival. Wave next time; I'll pretend the radio isn't crackling.");
  post("mugs", "kenji", "Neighbours", "02:30", "Workshop inventory correction", "Three mugs. Four visitors. Rin has proposed sharing, and I have proposed washing the fourth mug. Negotiations continue.");
  post("quiet", "jun", "Neighbours", "03:00", "A tea pairing for no occasion", "Something lightly roasted for a damp coat and a long crossing. No festival speech required. Kisaragi has room for quiet visits too.");
  post("bench-close", "kenji", "Notices", "03:30", "Market repair bench winding down", "The late market jobs are finished for this shift. Please check the actual action list before planning a gold order; an earlier notice doesn't keep the bench open.", { night: 1 });
  post("first-light", "mei", "Neighbours", "05:00", "The sky is washing its face", "Night crews, come home gently. If you made a little money, good. If you helped somebody, also good. There are bowls for both sorts of night.");
  post("morning", "priya", "Notices", "06:40", "Morning wire: a fresh page", "The festival route needs a fresh check at Landing 3. Yesterday's instructions remain yesterday's instructions. Tea stains, unfortunately, carry over.", { night: 3 });
  post("family", "nao", "Stories", "06:40", "An afternoon with Haruto", "I'd like an afternoon where my son doesn't have to share me with a pot. Ask me about our outing, if you have a little space between deliveries.", { night: 3, notFlag: ["af_ready"] });
  post("umbrella-thanks", "priya", "Neighbours", null, "Returned: a small patch of blue sky", "Aki brought my umbrella home. The paper star survived. Whoever tied the vending-machine bag around it: thank you, too. This harbour is full of practical romantics.", { flag: ["wire_umbrella_done"] });
  post("pump-thanks", "rin", "Neighbours", null, "Second Helping sounds wonderfully ordinary", "Pump checked, hull dry, launch celebration complete. Thank you, Tern. A ferry that stops knocking is a very good song.", { flag: ["yard_done"] });
  post("menu-thanks", "nao", "Neighbours", null, "My name stayed on the menu", "We opened. I didn't fold the menu away. Thank you for sitting down with me when a small counter felt like a very large beginning.", { flag: ["nb_done"] });
  post("recipe-thanks", "nao", "Neighbours", null, "Tomorrow has a flavour", "The recipe tasting is done, and tomorrow's menu is ready. Thank you for trying something before either of us knew exactly what it would become.", { flag: ["n2_done"] });
  post("festival-thanks", "hana", "Neighbours", null, "Enough room at the table", "The festival preparations have a little of the Tern in them now. Please come back as a guest, not only as our wonderfully reliable captain.", { flagAny: ["cf_done", "n3_done"] });
  post("assay-thanks", "priya", "Trading", null, "A receipt corrected, a worry removed", "The swapped assay paperwork is corrected. Checking a record isn't betting on a price. Thank you for keeping those two things separate.", { flag: ["ay_done"] });
  post("return", "mako", "Neighbours", null, "A familiar wake", "The Tern has come through Kisaragi more than once now. Jun has stopped asking whether you're a visitor. That is how a town quietly adopts you.", { visited: { canal: 2 } });
  post("festival-supply", "hana", "Stories", "23:40", "A table across the water", "Bowls from Jun, tea from Mei, cloth from Sora. Priya at Landing 3 has two routes: carry our stock for small guaranteed delivery fees, or buy your own cases for agreed resale payments. Fuel and deadlines still matter: start deliveries by 05:20 at night or 10:20 in the morning. Ask her before collecting anything.", { notFlag: ["fs_done"] });
  post("festival-supply-thanks", "hana", "Neighbours", null, "Three crossings in our evening", "The bowls are on Nao's counter. The tea and lantern cloth are here. Thank you, Tern. Your cargo accounts are settled; your place at the table doesn't need a receipt.", { flag: ["fs_done"] });
  function install(data) {
    ["landing", "metro"].forEach(loc => { data.actions[loc] = data.actions[loc].filter(a => !a.id.startsWith("wire_")); });
    data.sceneClasses.push({ class: "umbrella-returned", when: { flag: ["wire_umbrella_done"] } });
    data.things["wire-board"] = "Harbour Wire · Neighbours & notices";
    data.actions.landing.unshift({ id: "wire_read", kind: "system", label: "Read the Harbour Wire · Free", minutes: 0, thing: "wire-board", wireBoard: true, lines: [] });
    data.actions.landing.push({ id: "wire_umbrella_accept", kind: "talk", label: "Offer to find Priya's umbrella", minutes: 0, once: true, lines: [{ who: "priya", text: "Sky-blue, paper star on the handle. Look by the vending machine at Metro Quay; a five-minute search should do. Bring it here whenever you like. No need to buy anything." }], when: { notFlag: ["wire_umbrella_started"] }, sets: ["wire_umbrella_started"] },
      { id: "wire_umbrella_return", kind: "talk", label: "Return Priya's sky-blue umbrella", minutes: 0, once: true, sound: "tea", when: { flag: ["wire_umbrella_found"], notFlag: ["wire_umbrella_done"] }, sets: ["wire_umbrella_done"], lines: [{ who: "priya", text: "There it is! You even saved the little star. Here, a cup from my flask. Nothing to settle on a scale this time. I'll pin a thank-you on the Wire." }] });
    data.actions.metro.push({ id: "wire_umbrella_search", kind: "search", label: "Find the sky-blue umbrella · 5 min", minutes: 5, once: true, when: { flag: ["wire_umbrella_started"], notFlag: ["wire_umbrella_found"] }, sets: ["wire_umbrella_found"], lines: [{ who: "dex", text: "Behind the vending machine! I put a bag over it so the paper star wouldn't turn to soup. Tell Priya my bicycle would like equally thoughtful treatment." }] });
  }
  const base = window.NEON_TIDES_TRADE; install(base);
  // Chapters replace their action lists: reinstall the shared board and request.
  [window.NEON_TIDES_NIGHT_TWO, window.NEON_TIDES_MORNING].forEach(chapter => {
    const build = chapter.build;
    chapter.build = base => { const data = build(base); install(data); return data; };
  });
  window.NEON_TIDES_WIRE = { posts, categories: ["All", "Unread", "Pinned", "Trading", "Neighbours", "Stories", "Notices"],
    visible(state, data, holds, parse) {
      const start = parse(data.meta.startClock);
      const result = posts.filter(p => (!p.at || parse(p.at) <= state.clock) && holds(p.when)).map(p => Object.assign({}, p, { time: p.at ? parse(p.at) : null, pinned: !!p.at && parse(p.at) < start }));
      Object.keys(data.freight || {}).forEach(id => {
        const d = data.freight[id], cargo = (state.freight || {})[id];
        const offer = data.actions[d.from].find(a => a.freightBuy === id);
        if (!cargo && offer && offer.when) {
          const availability = Object.assign({}, offer.when); delete availability.maxClock;
          if (!holds(availability)) return;
        }
        result.push({ id: "cargo-" + id, who: d.source, category: "Trading", time: start, title: d.title,
          text: cargo ? (cargo.units ? "Aboard the Tern. Deliver to " + window.NEON_TIDES.world.locations[d.to].short + "; start handover by " + d.lastStart + ". Purchase " + cargo.cost + " cr; promised payment " + d.payment + " cr. Check your journal for remaining time." : "Delivered safely. Purchase " + cargo.cost + " cr; payment " + cargo.revenue + " cr. Thanks, skipper.") : "Offer: " + d.cost + " cr purchase; " + d.payment + " cr promised on delivery to " + window.NEON_TIDES.world.locations[d.to].short + ". Start the five-minute handover by " + d.lastStart + ". Fuel and travel are your costs. Check the offer at the source before buying.", stale: !cargo && state.clock > parse(d.lastStart), cargo: true });
      });
      return result.sort((a,b) => (b.time === null ? state.clock : b.time) - (a.time === null ? state.clock : a.time) || a.id.localeCompare(b.id));
    }
  };
})();
