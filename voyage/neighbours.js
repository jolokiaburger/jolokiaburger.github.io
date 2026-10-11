/* Small, authored reasons to cross familiar water. Optional version-one records. */
(function () {
  'use strict';
  const M = window.VoyageModel, W = window.VoyageWorld, P = window.VoyagePorts, L = window.VoyageLeisure;
  const owns = (o, k) => Object.hasOwn(o, k);
  const record = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const unique = (a, allowed) => Array.isArray(a) && new Set(a).size === a.length && a.every(k => owns(allowed, k));
  const quay = id => W.ports.find(p => p.id === id);
  const rides = {
    priya: {who: 'priya', from: 'landing', to: 'metro', opens: 1490, stop: 'bar', payment: 18, title: 'Priya’s homeward ferry', luggage: 'A neat navy satchel', intro: '“My shift ends at 00:50. Eighteen credits for Metro, and I have brought my own tea. The timetable can rest in the bag.”', direct: '“Straight home, then. I will try to look out of the window instead of checking receipts.”', tea: '“Mei’s window would make a lovely little stop. We can share my thermos alongside.”', thanks: 'Priya checks one final receipt, folds it away and smiles. “Home. That is the useful number tonight.”', lines: ['“The first time I worked at the office, I gave every ferry a different ink colour. We ran out of ink before we ran out of ferries.”', '“I know these lamps by the reflections they make. That one means the clinic is still keeping someone company.”', '“My bag has six forms and one biscuit. I have packed the priorities in the wrong proportions.”']},
    lam: {who: 'lam', from: 'metro', to: 'canal', opens: 1540, stop: 'market', payment: 22, title: 'Lam’s crossing after Line 9', luggage: 'A brass thermos and canvas holdall', intro: '“The last train passes at 01:40. Twenty-two credits to Kisaragi after that. I know a story for the crossing, if you have room for one.”', direct: '“The locks it is. I will keep the long version of the story for the water.”', tea: '“A pause beneath Nao’s lanterns? Excellent navigation. I have enough tea for two.”', thanks: 'Lam sets his bag on the quay. “You brought me to a place, rather than merely a point on a timetable. Thank you.”', lines: ['“A buoy used to ring twice in the mist. Some called it a warning. Mako called it a loose bracket. Both got people to look where they were going.”', '“I once repaired a ferry called Excellent Plan. We changed the name before we changed the engine.”', '“When a friend says the long way home, ask whether they mean the scenery or the conversation. Sometimes they mean both.”']},
    rin: {who: 'rin', from: 'yard', to: 'bar', opens: 1470, stop: 'market', payment: 20, title: 'Rin’s workshop supper break', luggage: 'An olive tool roll, tied shut', intro: '“From 00:30, I can close the bench for a bowl at Mei’s. Twenty credits to Kurage. No pump in my bag, I promise.”', direct: '“Mei’s soup first. The tools will survive without supervision.”', tea: '“We can pause at the market and share my thermos. Kenji is allowed one evening without a repair question.”', thanks: 'Rin puts her tool roll under the stool. “Dinner, while it is still dinner. A remarkably clever repair to my evening.”', lines: ['“That little noise? My tool roll, not your engine. For once the fault is entirely portable.”', '“Second Helping was built from three different boats. The name seemed polite to all of them.”', '“I like returning by water. A workshop window looks kinder when you are on the outside of it.”']}
  };
  const favours = {
    supper: {who: 'mei', to: 'bar', title: 'Supper for the cook', text: 'Bring Mei one kept fish from any quay. A four-minute handover, no cash reward; your catch becomes her supper.', minutes: 4, payment: 0, steps: {}, thanks: 'Mei sets down her ladle. “You noticed I was still standing. Sit with me while this warms.” A small thank-you ribbon joins your keepsakes.'},
    crew: {who: 'priya', to: 'pier', title: 'Tea for the late crew', text: 'Collect Jun’s free tea flask at Kisaragi (5 min), then give it to Matte at Frostline (5 min, 8 cr thanks). Fuel is extra; use an existing route.', minutes: 5, payment: 8, steps: {tea: 'canal'}, thanks: 'Matte turns down the desk lamp and pours for the next watch. “Eight credits from the crew’s tea tin. The quiet part of the shift is better shared.”'},
    picnic: {who: 'nao', to: 'observatory', title: 'A picnic under the charts', text: 'Pack Mei’s free rice parcel at Kurage and Jun’s free tea at Kisaragi (5 min each, either order), then bring them to Mio (5 min). A recipe basket, no freight slot or cash reward.', minutes: 5, payment: 0, steps: {rice: 'bar', tea: 'canal'}, thanks: 'Mio clears a star chart for the picnic. “Nao said an expedition should include something you can eat. I have reserved the most scientific corner of the table.”'},
    bell: {who: 'priya', to: 'landing', title: 'The twice-rung bell', text: 'Ask Priya about the bell register and Mako about the loose bracket. Compare both accounts at Landing 3 (3 min). Decide how the harbour should remember the story.', minutes: 3, payment: 0, steps: {}, thanks: 'Priya adds a small brass-bell keepsake to the receipt. “A checked record and a story worth keeping. We have room for both.”'}
  };
  const recipes = {
    lantern: {title: 'Lantern catch bowl', teacher: 'mei', topic: 'mei-broth', fish: true, broth: 'miso', topping: 'greens', tea: 'roasted', text: 'Mei’s gentle miso, a kept harbour catch, spring greens and roasted tea.', thanks: 'Nao lifts the lid. “Mei begins with a meal you can recognise from the doorway. I think we have found ours.”'},
    ginger: {title: 'Rain-window ginger bowl', teacher: 'nao', topic: 'nao-recipe', fish: true, broth: 'ginger', topping: 'tofu', tea: 'black', text: 'Nao’s ginger broth, a kept catch, soft tofu and black tea.', thanks: 'Nao tastes one spoonful, then watches the rain. “A little bright ginger, a little soft tofu. There is room for an adventure in a familiar bowl.”'},
    garden: {title: 'Canal garden supper', teacher: 'jun', topic: 'jun-garden', fish: false, broth: 'miso', topping: 'mushroom', tea: 'jasmine', text: 'Jun’s miso, roasted mushrooms and jasmine tea. No fish required.', thanks: 'Nao puts the mushroom tray beside the cup. “Jun said to leave room for the tea. I understand what he meant now.”'}
  };
  Object.assign(L.charms, {ticket: 'Homeward ferry ticket', ribbon: 'Neighbour’s thank-you ribbon', bell: 'Little harbour bell', bowl: 'Recipe bowl', rope: 'Patient mooring knot'});
  const fresh = () => ({rides: {}, favours: {}, learned: [], recipes: [], facts: {}, replies: {}, practice: false, landings: []});
  const hydrate = s => { if (s.neighbours === undefined) s.neighbours = fresh(); return s.neighbours; };
  const activeRide = s => Object.keys(s.neighbours?.rides || {}).find(id => s.neighbours.rides[id].stage === 'aboard') || null;
  const timeOK = (n, s) => Number.isFinite(n) && n >= 1420 && n <= s.clock;
  function valid(s) {
    const h = s.neighbours; if (h === undefined) return !(s.leisure?.fishing.catches || []).some(c => ['cooked', 'gifted'].includes(c.outcome));
    const C = window.VoyageConversations;
    if (!record(h) || !record(h.rides) || !record(h.favours) || !record(h.facts) || !record(h.replies) || typeof h.practice !== 'boolean' || !unique(h.learned, recipes)) return false;
    if (!Object.entries(h.rides).every(([id, r]) => owns(rides, id) && record(r) && ['aboard', 'done', 'closed'].includes(r.stage) && ['direct', 'tea'].includes(r.route) && typeof r.stopped === 'boolean' && timeOK(r.boarded, s) && r.boarded >= rides[id].opens + 3 && timeOK(r.at, s) && r.at >= r.boarded && r.revenue === (r.stage === 'done' ? rides[id].payment : 0))) return false;
    if (Object.values(h.rides).filter(r => r.stage === 'aboard').length > 1) return false;
    if (!Object.entries(h.favours).every(([id, f]) => {
      if (!owns(favours, id) || !record(f) || !['accepted', 'done', 'closed'].includes(f.stage) || !timeOK(f.at, s) || !unique(f.steps, favours[id].steps) || f.revenue !== (f.stage === 'done' ? favours[id].payment : 0)) return false;
      if (id === 'supper') return f.answer === null && (f.stage === 'done' ? Number.isInteger(f.catch) && s.leisure?.fishing.catches[f.catch]?.outcome === 'gifted' : f.catch === null);
      if (f.catch !== null) return false;
      if (id === 'bell') return f.stage === 'done' ? ['records', 'legend'].includes(f.answer) && owns(h.facts, 'priya-bell') && owns(h.facts, 'mako-bell') : f.answer === null;
      return f.answer === null && (f.stage !== 'done' || Object.keys(favours[id].steps).every(k => f.steps.includes(k)));
    })) return false;
    if (!Array.isArray(h.recipes) || h.recipes.length > 3 || new Set(h.recipes.map(r => r?.id)).size !== h.recipes.length || !h.recipes.every(r => record(r) && owns(recipes, r.id) && h.learned.includes(r.id) && timeOK(r.at, s) && typeof r.matched === 'boolean' && record(r.dish) && Object.keys(L.dishes).every(k => owns(L.dishes[k], r.dish[k])) && r.matched === Object.keys(L.dishes).every(k => r.dish[k] === recipes[r.id][k]) && (recipes[r.id].fish ? Number.isInteger(r.catch) && s.leisure?.fishing.catches[r.catch]?.outcome === 'cooked' : r.catch === null))) return false;
    const used = h.recipes.filter(r => r.catch !== null).map(r => r.catch); if (new Set(used).size !== used.length) return false;
    if (!(s.leisure?.fishing.catches || []).every((c, i) => c.outcome !== 'cooked' || used.includes(i))) return false;
    if (!(s.leisure?.fishing.catches || []).every((c, i) => c.outcome !== 'gifted' || h.favours.supper?.stage === 'done' && h.favours.supper.catch === i)) return false;
    if (!Object.entries(h.facts).every(([id, at]) => C && owns(C.topics, id) && timeOK(at, s)) || !Object.entries(h.replies).every(([id, choice]) => C && owns(C.topics, id) && owns(h.facts, id) && C.topics[id].choices.some(c => c.id === choice && (!c.when || c.when(s))))) return false;
    return Array.isArray(h.landings) && h.landings.length <= 60 && h.landings.every(r => record(r) && !!quay(r.port) && timeOK(r.at, s) && ['gentle', 'secured'].includes(r.grade));
  }
  function budget(s, minutes, location) {
    if (s.ended) return 'This voyage has ended';
    if (!s.docked) return 'Moor at a quay first';
    if (location && s.docked !== location) return 'Visit ' + quay(location).name;
    if (s.clock + minutes > 1800) return 'Needs ' + minutes + ' min before 06:00';
    return '';
  }
  function rideStatus(s, id, action = 'board') {
    if (!owns(rides, id)) return 'Unknown passenger';
    const d = rides[id], r = s.neighbours?.rides[id];
    let reason = budget(s, action === 'board' ? 3 : action === 'stop' ? 8 : action === 'finish' ? 2 : 0, action === 'board' ? d.from : action === 'stop' ? d.stop : action === 'finish' ? d.to : null);
    if (reason) return reason;
    if (action === 'board') return r ? 'This fare has already been taken or closed' : activeRide(s) ? 'Bring your current fare passenger to a quay first' : s.clock < d.opens ? 'Available from ' + M.time(d.opens) : '';
    if (r?.stage !== 'aboard') return 'This passenger is not aboard';
    if (action === 'stop' && (r.route !== 'tea' || r.stopped)) return 'No tea stop is waiting';
    return '';
  }
  function ride(s, id, action, route = 'direct') {
    if (!['board', 'stop', 'finish', 'close', 'route'].includes(action) || rideStatus(s, id, action) || !['direct', 'tea'].includes(route)) return false;
    M.hydrate(s); const h = hydrate(s), d = rides[id];
    if (action === 'board') { h.rides[id] = {stage: 'aboard', route, stopped: false, boarded: s.clock + 3, at: s.clock + 3, revenue: 0}; s.track = 'ride-' + id; M.advance(s, 3); M.log(s, d.title + ' · Aboard, 3 min. ' + (route === 'tea' ? 'Optional thermos stop at ' + quay(d.stop).name + '.' : 'Direct route.')); }
    else { const r = h.rides[id];
      if (action === 'route') { r.route = route; M.log(s, 'Agreed ' + (route === 'tea' ? 'an optional tea stop' : 'a direct crossing') + ' with ' + P.characters[id].name + '.'); }
      if (action === 'stop') { r.stopped = true; r.at = s.clock + 8; M.advance(s, 8); M.log(s, 'Shared ' + P.characters[id].name + '’s thermos at ' + quay(d.stop).name + ' · Free, 8 min.'); }
      if (action === 'finish') { r.stage = 'done'; r.revenue = d.payment; r.at = s.clock + 2; s.credits += d.payment; M.advance(s, 2); M.transaction(s, 'leisure', d.payment, d.title); M.log(s, d.thanks + ' · ' + d.payment + ' cr, 2 min.'); }
      if (action === 'close') { r.stage = 'closed'; r.at = s.clock; M.log(s, P.characters[id].name + ' stepped ashore at ' + quay(s.docked).name + '. Fare closed here, no payment or claimed homecoming.'); }
    }
    M.observe(s); return true;
  }
  function waitRide(s, id) {
    if (!owns(rides, id) || s.ended || s.docked !== rides[id].from || activeRide(s) || s.neighbours?.rides[id] || s.clock >= rides[id].opens) return false;
    M.advance(s, rides[id].opens - s.clock); M.observe(s); M.log(s, 'Waited for ' + rides[id].title + ' · No credits spent.'); return true;
  }
  function favourStatus(s, id, action = 'accept', choice) {
    if (!owns(favours, id)) return 'Unknown favour';
    const d = favours[id], f = s.neighbours?.favours[id];
    const location = action === 'deliver' ? d.to : action === 'pack' && owns(d.steps, choice) ? d.steps[choice] : null;
    const reason = budget(s, action === 'pack' ? 5 : action === 'deliver' ? d.minutes : 0, location); if (reason) return reason;
    if (action === 'accept') return f ? 'This favour has already been accepted or closed' : '';
    if (f?.stage !== 'accepted') return 'No active favour';
    if (action === 'pack') return !owns(d.steps, choice) ? 'Unknown picnic ingredient' : f.steps.includes(choice) ? 'Already packed' : '';
    if (action === 'deliver') {
      if (!Object.keys(d.steps).every(k => f.steps.includes(k))) return 'Collect the listed recipe packets first';
      if (id === 'supper' && !s.leisure.fishing.catches.some(c => c.outcome === 'kept')) return 'Bring one kept fish';
      if (id === 'bell' && (!owns(s.neighbours.facts, 'priya-bell') || !owns(s.neighbours.facts, 'mako-bell'))) return 'Ask Priya and Mako about the bell first';
    }
    return '';
  }
  function favour(s, id, action, choice) {
    if (!['accept', 'pack', 'deliver', 'close'].includes(action) || favourStatus(s, id, action, choice)) return false;
    if (action === 'deliver' && id === 'supper' && (!Number.isInteger(choice) || s.leisure.fishing.catches[choice]?.outcome !== 'kept')) return false;
    if (action === 'deliver' && id === 'bell' && !['records', 'legend'].includes(choice)) return false;
    M.hydrate(s); const h = hydrate(s), d = favours[id];
    if (action === 'accept') { h.favours[id] = {stage: 'accepted', steps: [], catch: null, answer: null, at: s.clock, revenue: 0}; s.track = 'favour-' + id; M.log(s, 'Accepted ' + d.title + ' · No purchase or special deadline.'); }
    else { const f = h.favours[id];
      if (action === 'pack') { f.steps.push(choice); f.at = s.clock + 5; M.advance(s, 5); M.log(s, 'Packed ' + choice + ' for ' + d.title + ' · Free, 5 min, recipe basket.'); }
      if (action === 'deliver') { f.stage = 'done'; f.at = s.clock + d.minutes; f.revenue = d.payment; if (id === 'supper') { f.catch = choice; s.leisure.fishing.catches[choice].outcome = 'gifted'; } if (id === 'bell') f.answer = choice; s.credits += d.payment; M.advance(s, d.minutes); M.transaction(s, 'leisure', d.payment, d.title); M.log(s, d.thanks); }
      if (action === 'close') { f.stage = 'closed'; f.at = s.clock; M.log(s, 'Closed ' + d.title + ' · No payment; packed recipe packets returned to the neighbour’s basket.'); }
    }
    M.observe(s); return true;
  }
  function cookStatus(s, id) {
    if (!owns(recipes, id)) return 'Unknown recipe';
    const reason = budget(s, 6, 'market'); if (reason) return reason;
    if (s.flags.naoAboard) return 'Bring Nao back to her market counter';
    if (!s.neighbours?.learned.includes(id)) return 'Ask ' + P.characters[recipes[id].teacher].name + ' to teach you';
    if (s.neighbours.recipes.some(r => r.id === id)) return 'Already cooked this recipe this voyage';
    if (recipes[id].fish && !s.leisure.fishing.catches.some(c => c.outcome === 'kept')) return 'Bring one kept fish';
    return '';
  }
  function cook(s, id, dish, index = null) {
    if (cookStatus(s, id) || !record(dish) || !Object.keys(L.dishes).every(k => owns(L.dishes[k], dish[k]))) return false;
    const d = recipes[id];
    if (d.fish ? !Number.isInteger(index) || s.leisure.fishing.catches[index]?.outcome !== 'kept' : index !== null) return false;
    M.hydrate(s); const h = hydrate(s), matched = Object.keys(L.dishes).every(k => dish[k] === d[k]);
    if (d.fish) s.leisure.fishing.catches[index].outcome = 'cooked';
    h.recipes.push({id, at: s.clock + 6, catch: index, dish: {...dish}, matched}); M.advance(s, 6); M.observe(s);
    const text = matched ? d.thanks : 'Nao tastes your variation. “A new bowl, then. Let’s write down what we changed, so we can make it again.”'; M.log(s, d.title + ' · Shared at Nao’s counter, free, 6 min.'); return {matched, text};
  }
  function stories(s) {
    const h = s.neighbours; if (!h) return [];
    const rows = Object.entries(h.rides).map(([id, r]) => { const d = rides[id], tea = r.route === 'tea' && !r.stopped; return {id: 'ride-' + id, title: d.title, done: r.stage !== 'aboard', outcome: r.stage === 'closed' ? 'Closed' : r.stage === 'done' ? 'Completed' : null, to: r.stage === 'aboard' ? tea ? d.stop : d.to : null, text: r.stage === 'done' ? d.thanks + ' · ' + d.payment + ' cr received.' : r.stage === 'closed' ? 'Stepped ashore at another quay; no fare paid.' : (tea ? 'Optional thermos stop at ' + quay(d.stop).name + ' · Free, 8 min. You may still go straight home. ' : '') + 'Bring ' + P.characters[id].name + ' to ' + quay(d.to).name + ' · ' + d.payment + ' cr, 2 min to disembark. No cargo slot or extra deadline.'}; });
    for (const [id, f] of Object.entries(h.favours)) { const d = favours[id], missing = Object.keys(d.steps).find(k => !f.steps.includes(k)); rows.push({id: 'favour-' + id, title: d.title, done: f.stage !== 'accepted', outcome: f.stage === 'closed' ? 'Closed' : f.stage === 'done' ? 'Completed' : null, to: f.stage === 'accepted' ? missing ? d.steps[missing] : d.to : null, text: f.stage === 'done' ? d.thanks + (id === 'bell' ? ' You chose ' + (f.answer === 'records' ? 'to publish the checked maintenance record.' : 'to keep the story as a clearly labelled legend.') : '') : f.stage === 'closed' ? 'Closed without payment.' : d.text + (f.steps.length ? ' Packed: ' + f.steps.join(', ') + '.' : '')}); }
    return rows;
  }
  function landing(s) { const p = M.nearby(s); return p && window.VoyageNavigation.approach(s.ship, p); }
  const originalValid = M.valid, originalHydrate = M.hydrate, originalCreate = M.create, originalStories = M.stories, originalPeople = M.people, originalChat = M.chat, originalDock = M.dock, originalDestination = M.destinationInfo;
  M.valid = s => originalValid(s) && valid(s);
  M.hydrate = s => { originalHydrate(s); hydrate(s); return s; };
  M.create = seed => { const s = originalCreate(seed); hydrate(s); return s; };
  M.stories = s => [...originalStories(s), ...stories(s)];
  M.people = s => { const ids = originalPeople(s), rider = activeRide(s); if (s.docked && rider && !ids.includes(rider)) ids.push(rider); return ids; };
  M.chat = (s, id) => { if (activeRide(s) === id && s.docked && !originalPeople(s).includes(id)) { const d = rides[id], n = s.chats[id] || 0; s.chats[id] = n + 1; return d.lines[n % d.lines.length]; } return originalChat(s, id); };
  M.dock = s => { const assessment = !s.docked && landing(s), enabled = s.neighbours?.practice, result = originalDock(s); if (result && enabled && assessment) { hydrate(s).landings.push({port: s.docked, at: s.clock, grade: assessment.gentle ? 'gentle' : 'secured'}); s.neighbours.landings = s.neighbours.landings.slice(-60); M.log(s, assessment.gentle ? 'Gentle landing · A patient approach and a quiet mooring.' : 'Secured alongside · A softer approach is available next time.'); } return result; };
  M.destinationInfo = (s, id) => { const info = originalDestination(s, id); if (info) { info.steps.push(...stories(s).filter(r => !r.done && r.to === id).map(r => r.title + ' · ' + r.text)); info.jobs.push(...Object.values(rides).filter(d => d.from === id && !s.neighbours?.rides[d.who]).map(d => d.title + ' · From ' + M.time(d.opens) + ', 3 min boarding / ' + d.payment + ' cr at ' + quay(d.to).name + '. Fuel extra.')); } return info; };
  const oldMoment = P.deckMoment, oldFollowup = P.followup, oldBoard = P.board;
  P.board = s => [...oldBoard(s), ...Object.entries(favours).map(([id, d]) => ({who: d.who, at: 1420, title: d.title, text: s.neighbours?.favours[id]?.stage === 'done' ? d.thanks : d.text, favour: id})), ...(s.neighbours?.favours.bell?.stage === 'done' ? [{who: 'priya', at: s.neighbours.favours.bell.at, title: s.neighbours.favours.bell.answer === 'records' ? 'Checked record · The weather-buoy bracket' : 'Harbour legend · The twice-rung bell', text: s.neighbours.favours.bell.answer === 'records' ? 'Priya’s register and Mako’s inspection describe a loose bracket and its repair. The sound report is explained by the checked maintenance account.' : 'The twice-rung bell remains a harbour tale, labelled as folklore. The ordinary bracket repair is kept beside it in the register.'}] : [])];
  P.deckMoment = s => { const id = activeRide(s); if (!id || !s.voyage || Math.floor(s.voyage.distance / 420) % 2 && (s.flags.naoAboard || s.flags.yumiAboard)) return oldMoment(s); const d = rides[id], r = s.neighbours.rides[id]; return {who: id, speaker: P.characters[id].name, text: r.stopped && Math.floor(s.voyage.distance / 420) % 3 === 0 ? '“I will remember that little thermos stop. A place can become part of the journey just because you sat down there.”' : d.lines[Math.floor(s.voyage.distance / 420) % d.lines.length]}; };
  P.followup = s => { const letters = oldFollowup(s); for (const [id, r] of Object.entries(s.neighbours?.rides || {})) if (r.stage === 'done' && !letters.some(l => l.who === id)) letters.push({who: id, text: rides[id].thanks + (r.stopped ? ' The thermos stop stays in my memory beside the crossing.' : ' Thank you for making the last part of my shift a journey home.')}); if (s.neighbours?.favours.bell?.stage === 'done' && !letters.some(l => l.who === 'priya')) letters.push({who: 'priya', text: favours.bell.thanks + ' The board now distinguishes a maintenance record from a harbour legend.'}); return letters; };
  window.VoyageNeighbours = {rides, favours, recipes, fresh, hydrate, valid, activeRide, rideStatus, ride, waitRide, favourStatus, favour, cookStatus, cook, stories, landing};
})();
