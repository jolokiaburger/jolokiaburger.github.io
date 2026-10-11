/* Deliberate dockside choices. Conversation topics stay inside the quay panel. */
(function () {
  'use strict';
  const H = window.VoyageNeighbours, C = window.VoyageConversations, M = window.VoyageModel, P = window.VoyagePorts, W = window.VoyageWorld, L = window.VoyageLeisure;
  function create(api) {
    const {el, button, openPanel, toast} = api, state = () => api.getState(), profile = () => api.getProfile();
    const quay = id => W.ports.find(p => p.id === id);
    const image = (src, alt, cls) => { const n = el('img', undefined, cls); n.src = src; n.alt = alt; n.onerror = () => { n.hidden = true; }; return n; };
    const host = id => { const n = el('div', undefined, 'activity-host'); n.append(image(P.portrait(id, 'thoughtful'), P.characters[id].name, 'activity-portrait'), el('strong', P.characters[id].name)); return n; };
    function commit(fn, next, reason) { if (!fn()) { toast(reason || 'That choice is not available here.'); return; } if (api.changed()) next(); }
    function limited(label, reason, fn, primary) { const n = button(label + (reason ? ' · ' + reason : ''), fn, !!reason, primary); if (reason) n.title = reason; return n; }
    function routes() {
      const s = state(), nodes = [el('p', 'One fare passenger at a time, alongside Nao or Yumi if they are already travelling. Boarding takes 3 min; disembarking takes 2 min. Fare is before fuel. No freight slot or special delivery deadline.'), button('Docking practice · ' + (s.neighbours.practice ? 'On' : 'Off'), practice)];
      for (const [id, d] of Object.entries(H.rides)) {
        const card = el('article', undefined, 'pastime-card'), r = s.neighbours.rides[id]; card.append(host(id), el('h3', d.title), el('p', quay(d.from).name + ' → ' + quay(d.to).name + ' · From ' + M.time(d.opens) + ' · ' + d.payment + ' cr fare before fuel'), el('p', r ? r.stage === 'aboard' ? 'Aboard · ' + d.luggage : r.stage === 'done' ? 'Homeward fare settled · ' + r.revenue + ' cr' : 'Fare closed at a quay without payment' : d.intro), button(r?.stage === 'aboard' ? 'Talk aboard & plan the crossing' : 'View fare and route', () => trip(id)));
        nodes.push(card);
      }
      nodes.push(button('Neighbour favours', favours), button('Back to the harbour', api.closePanel)); openPanel('Passenger trips · People across the water', nodes);
    }
    function trip(id) {
      const s = state(), d = H.rides[id], r = s.neighbours.rides[id], target = r?.stage === 'aboard' ? d.to : d.from, estimate = M.routePreview(s, target), nodes = [host(id), el('p', d.intro), el('p', 'Fare ' + d.payment + ' cr before fuel · 3 min boarding + 2 min to disembark · Optional thermos stop at ' + quay(d.stop).name + ': free, 8 min.'), el('p', 'Route fuel, refills and detours remain your costs. The passenger waits for your choices; dawn still ends the voyage.', 'muted')];
      if (!r) {
        const reason = H.rideStatus(s, id);
        nodes.push(limited('Offer a direct crossing · Board · 3 min', reason, () => commit(() => H.ride(s, id, 'board', 'direct'), () => trip(id)), true), limited('Offer a crossing with an optional tea stop · Board · 3 min', reason, () => commit(() => H.ride(s, id, 'board', 'tea'), () => trip(id))));
        if (s.docked !== d.from) nodes.push(button('Preview boarding quay · ' + quay(d.from).name, () => api.destinationPreview(d.from)));
        else if (s.clock < d.opens && !s.ended && !H.activeRide(s)) nodes.push(button('Wait until ' + M.time(d.opens) + ' · ' + Math.ceil(d.opens - s.clock) + ' min', () => commit(() => H.waitRide(s, id), () => trip(id))));
      } else if (r.stage === 'aboard') {
        nodes.push(el('p', r.route === 'tea' ? r.stopped ? 'Thermos stop shared. Ready for the homeward crossing.' : 'Optional tea stop agreed. You may still take your passenger straight home.' : 'Direct route agreed.'), el('p', d.lines[Math.floor((s.voyage?.distance || 0) / 420) % d.lines.length], 'speech'));
        nodes.push(limited('Disembark at ' + quay(d.to).name + ' · Receive ' + d.payment + ' cr · 2 min', H.rideStatus(s, id, 'finish'), () => commit(() => H.ride(s, id, 'finish'), () => openPanel('A homeward ticket', [host(id), el('p', d.thanks), el('p', 'Received ' + d.payment + ' cr. The homeward ticket decoration is in your keepsakes.'), button('Other passenger trips', routes)])), true));
        if (r.route === 'tea' && !r.stopped) nodes.push(limited('Share the passenger’s thermos · Free · 8 min', H.rideStatus(s, id, 'stop'), () => commit(() => H.ride(s, id, 'stop'), () => trip(id))));
        if (!r.stopped) nodes.push(button(r.route === 'tea' ? 'Agree a direct route instead · Free' : 'Suggest a thermos stop instead · Free', () => commit(() => H.ride(s, id, 'route', r.route === 'tea' ? 'direct' : 'tea'), () => trip(id)), s.ended));
        nodes.push(button('Preview ' + (r.route === 'tea' && !r.stopped ? quay(d.stop).name + ' tea stop' : quay(d.to).name), () => api.destinationPreview(r.route === 'tea' && !r.stopped ? d.stop : d.to)), limited('Step ashore here · Close fare, no payment', H.rideStatus(s, id, 'close'), () => commit(() => H.ride(s, id, 'close'), routes)));
      } else nodes.push(el('p', r.stage === 'done' ? d.thanks + ' · ' + r.revenue + ' cr received.' : 'Stepped ashore at another quay. No fare or homecoming was claimed.'));
      if (estimate) nodes.push(el('p', 'To ' + estimate.to + ' from here: ~' + estimate.minutes + ' min sailing · ' + estimate.fuel.toFixed(1) + ' fuel. ' + (estimate.enough ? 'Turns and stops need allowance.' : 'A fuel stop is needed; check the journey budget.'), 'muted'));
      nodes.push(button('Back to passenger trips', routes)); openPanel(d.title, nodes);
    }
    function practice() {
      const s = state(), book = profile().neighbours, nodes = [el('p', 'An optional approach guide: ease off until the guide turns green, point the bow towards the mooring ring, then Dock. No fee, damage, penalty or extra game time. Assisted courses are welcome.'), button('Docking practice · ' + (s.neighbours.practice ? 'On · Turn off' : 'Off · Turn on'), () => { s.neighbours.practice = !s.neighbours.practice; api.remembered(); practice(); }), el('p', 'Gentle landings at ' + book.gentle.length + ' / 9 quays. Three different quays earn the patient mooring-knot decoration.'), ...W.ports.map(p => el('p', (book.gentle.includes(p.id) ? '✓ ' : '○ ') + p.name)), button('Back to passenger trips', routes)]; openPanel('A patient landing', nodes);
    }
    function favours() {
      const s = state(), nodes = [el('p', 'Small, authored errands on familiar routes. No stock purchase or special deadline. Fuel and the voyage’s 06:00 finish still matter.')];
      for (const [id, d] of Object.entries(H.favours)) { const f = s.neighbours.favours[id], card = el('article', undefined, 'pastime-card'); card.append(host(d.who), el('h3', d.title), el('p', d.text), el('p', f ? f.stage === 'accepted' ? 'Accepted' + (f.steps.length ? ' · Packed: ' + f.steps.join(', ') : '') : f.stage === 'done' ? 'Completed · ' + (d.payment ? d.payment + ' cr received' : 'A neighbour’s thanks') : 'Closed, no payment' : 'Available · Accept at any quay', 'muted'), button(f?.stage === 'accepted' ? 'Follow this favour' : 'Read and choose', () => favourView(id))); nodes.push(card); }
      nodes.push(button('Facts & recipe notebook', notebook), button('Back to the harbour', api.closePanel)); openPanel('Neighbour favours · The harbour board', nodes);
    }
    function favourView(id) {
      const s = state(), d = H.favours[id], f = s.neighbours.favours[id], nodes = [host(d.who), el('p', d.text)];
      if (!f) nodes.push(limited('Accept this favour · Free', H.favourStatus(s, id), () => commit(() => H.favour(s, id, 'accept'), () => favourView(id)), true));
      else if (f.stage === 'accepted') {
        for (const [key, port] of Object.entries(d.steps)) if (!f.steps.includes(key)) nodes.push(limited('Pack ' + key + ' at ' + quay(port).name + ' · Free · 5 min', H.favourStatus(s, id, 'pack', key), () => commit(() => H.favour(s, id, 'pack', key), () => favourView(id))));
        const reason = H.favourStatus(s, id, 'deliver');
        const done = choice => commit(() => H.favour(s, id, 'deliver', choice), () => openPanel('An errand becomes a shared evening', [host(d.who), el('p', d.thanks), ...(id === 'bell' ? [el('p', choice === 'records' ? 'The board carries the checked bracket-repair account.' : 'The board keeps the tale explicitly labelled as a legend, alongside the repair record.')] : []), button('Other neighbour favours', favours)]), reason);
        if (id === 'supper') { s.leisure.fishing.catches.forEach((c, i) => { if (c.outcome === 'kept') nodes.push(limited('Give Mei your ' + L.fish[c.id].name.toLowerCase() + ' · Free · 4 min', reason, () => done(i), true)); }); if (!s.leisure.fishing.catches.some(c => c.outcome === 'kept')) nodes.push(el('p', 'Catch one fish and keep it in your basket first.', 'activity-notice')); }
        else if (id === 'bell') { nodes.push(el('p', 'Register checked: ' + (Object.hasOwn(s.neighbours.facts, 'priya-bell') ? 'yes' : 'ask Priya') + ' · Bracket inspection checked: ' + (Object.hasOwn(s.neighbours.facts, 'mako-bell') ? 'yes' : 'ask Mako'))); nodes.push(limited('Publish the checked maintenance account · Free · 3 min', reason, () => done('records'), true), limited('Keep the tale as a labelled harbour legend · Free · 3 min', reason, () => done('legend'))); }
        else nodes.push(limited('Hand over at ' + quay(d.to).name + ' · ' + (d.payment ? 'Receive ' + d.payment + ' cr' : 'Free') + ' · ' + d.minutes + ' min', reason, () => done(), true));
        nodes.push(button('Preview next quay', () => api.destinationPreview(H.stories(s).find(r => r.id === 'favour-' + id).to)), button('Close this favour · Free · No payment', () => commit(() => H.favour(s, id, 'close'), favours), s.ended || !s.docked));
      } else nodes.push(el('p', f.stage === 'done' ? d.thanks : 'Favour closed without payment.'));
      nodes.push(button('Back to neighbour favours', favours)); openPanel(d.title, nodes);
    }
    function recipes() {
      const s = state(), book = profile().neighbours, nodes = [host('nao'), el('p', 'Ask Mei, Nao and Jun for their recipes. Learned pages stay between voyages. Cook each recipe once per voyage at Nao’s counter: free, 6 min. Fish bowls use one kept catch; Nao supplies other ingredients.')];
      for (const [id, d] of Object.entries(H.recipes)) { const learned = s.neighbours.learned.includes(id), card = el('article', undefined, 'pastime-card'); card.append(el('h3', (book.cooked.includes(id) ? '✓ ' : '') + d.title), el('p', learned ? d.text : 'Ask ' + P.characters[d.teacher].name + ' about this recipe.'), limited('Assemble and share · Free · 6 min', H.cookStatus(s, id), () => recipe(id), true)); if (!learned) card.append(button('Find ' + P.characters[d.teacher].name, () => api.destinationPreview(W.ports.find(p => p.people.includes(d.teacher)).id))); nodes.push(card); }
      nodes.push(el('p', 'Three different recipes cooked across your voyages earn the recipe-bowl keepsake. Favourite customer trays you have remembered: ' + (book.preferences.map(id => P.characters[id].name).join(', ') || 'none yet') + '.', 'muted'), button('Help with Nao’s customer shift', api.pastimes.kitchen, !!L.status(s, 'kitchen')), button('Back to facts & recipes', notebook)); openPanel('Nao’s recipe notebook', nodes);
    }
    function recipe(id) {
      const s = state(), d = H.recipes[id], draft = {}, choices = {}, preview = el('div', undefined, 'ingredient-tray'), caption = el('p', 'Place broth, garnish and tea on the tray.', 'muted'); let catchIndex = null;
      const serve = button('Place all ingredients before serving', () => {
        const result = H.cook(s, id, draft, catchIndex); if (!result) { toast(H.cookStatus(s, id) || 'Choose the ingredients and a kept catch.'); return; }
        if (!api.changed()) return; const tray = el('div', undefined, 'served-tray'); tray.append(api.pastimes.dishArt(draft)); openPanel('A recipe worth bringing home', [host('nao'), tray, el('p', result.text), el('p', 'Six minutes, no credits spent. ' + (d.fish ? 'Your selected fish became supper.' : 'No fish was needed.')), button('Back to the recipe notebook', recipes)]);
      }, true, true);
      function paint() {
        preview.replaceChildren(); if (draft.broth) preview.append(api.pastimes.dishArt({broth: draft.broth, topping: draft.topping || 'tofu', tea: draft.tea || 'roasted'}));
        for (const k of Object.keys(L.dishes)) if (draft[k]) preview.append(el('span', L.dishes[k][draft[k]], 'ingredient-piece'));
        if (catchIndex !== null) preview.append(el('span', L.fish[s.leisure.fishing.catches[catchIndex].id].name, 'ingredient-piece'));
        const ready = Object.keys(L.dishes).every(k => draft[k]) && (!d.fish || catchIndex !== null);
        serve.disabled = !ready || !!H.cookStatus(s, id); serve.textContent = ready ? 'Share the bowl · Free · 6 min' : 'Place all ingredients before serving'; caption.textContent = ready ? 'Tray ready. Serving is the only step that spends game time.' : 'Choose each ingredient; changing the tray or leaving is free.';
      }
      const nodes = [host('nao'), el('p', d.text), el('p', 'You may make a variation. Nao responds to the finished bowl; there is no failure penalty.'), preview, caption];
      if (d.fish) { const group = el('div', undefined, 'recipe-options'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', 'Choose one kept catch'); group.append(el('h3', 'Choose your catch')); const fishButtons = []; s.leisure.fishing.catches.forEach((c, i) => { if (c.outcome !== 'kept') return; const b = button(L.fish[c.id].name, () => { catchIndex = i; fishButtons.forEach(([index, n]) => n.setAttribute('aria-pressed', String(index === i))); paint(); }); b.setAttribute('aria-pressed', 'false'); fishButtons.push([i, b]); group.append(b); }); nodes.push(group); }
      for (const kind of Object.keys(L.dishes)) { const group = el('div', undefined, 'recipe-options'); group.setAttribute('role', 'group'); group.setAttribute('aria-label', 'Place ' + kind); group.append(el('h3', 'Place ' + kind)); choices[kind] = []; for (const [key, label] of Object.entries(L.dishes[kind])) { const b = button(label, () => { draft[kind] = key; choices[kind].forEach(([id, n]) => n.setAttribute('aria-pressed', String(id === key))); paint(); }); b.setAttribute('aria-pressed', 'false'); choices[kind].push([key, b]); group.append(b); } nodes.push(group); }
      nodes.push(serve, button('Leave the tray · No cost', recipes)); openPanel(d.title + ' · Assemble the tray', nodes);
    }
    function factCard(id) {
      const s = state(), t = C.topics[id], card = el('article', undefined, 'fact-card'); card.append(el('small', t.kind), el('h3', t.title), el('p', t.fact), el('p', P.characters[t.who].name + ' · ' + (Object.hasOwn(s.neighbours.facts, id) ? 'First heard ' + M.time(s.neighbours.facts[id]) : 'Remembered from a previous voyage'), 'muted'));
      if (t.source) { const a = el('a', t.who === 'mio' ? 'Background reading · NASA' : 'Background reading · USGS'); a.href = t.source; a.target = '_blank'; a.rel = 'noopener noreferrer'; card.append(a); } return card;
    }
    function notebook(filter = 'all') {
      if (typeof filter !== 'string') filter = 'all';
      const facts = profile().neighbours.facts, nodes = [el('p', 'Knowledge learned from dockside conversations. Rules, outlooks, local history and rumours keep their own labels; the two science notes have optional source links. Reading never reveals an unseen gold quote.'), button('Nao’s recipe pages', recipes)];
      const filters = el('div', undefined, 'recipe-options'); for (const [id, label] of [['all', 'All notes'], ['rules', 'Working rules'], ['stories', 'History & rumours'], ['learning', 'Recipes & science']]) { const b = button(label, () => notebook(id)); b.setAttribute('aria-pressed', String(filter === id)); filters.append(b); } nodes.push(filters);
      let shown = 0; for (const id of facts) { const t = C.topics[id]; if (filter === 'rules' && !['Harbour rule', 'Harbour outlook'].includes(t.kind) || filter === 'stories' && !['Harbour history', 'Harbour rumour'].includes(t.kind) || filter === 'learning' && !['Recipe', 'Science note'].includes(t.kind)) continue; nodes.push(factCard(id)); shown++; }
      if (!shown) nodes.push(el('p', 'Ask a dockside neighbour about the harbour. Their topics add notes here, with their name and the time you first heard them.'));
      nodes.push(button('Neighbour favours', favours), button('Back to the harbour', api.closePanel)); openPanel('Facts & recipe notebook', nodes);
    }
    function conversation(actions, who) {
      const s = state(), available = C.available(s, who); if (!available.length) return;
      const details = el('details', undefined, 'conversation-topics'), summary = el('summary', 'Ask about the harbour · Free'), content = el('div'); details.append(summary, content);
      function list() { content.replaceChildren(el('p', 'Choose a topic, then your own reply. The next quest action remains available outside this conversation.', 'muted')); for (const t of available) content.append(button((profile().neighbours.facts.includes(t.id) ? '✓ ' : '') + t.title, () => show(t.id))); content.append(button('Open facts & recipes', notebook)); }
      function show(id) {
        const result = C.read(state(), who, id); if (!result) return; api.remembered(); const t = result.topic, reply = el('p', '', 'npc-reply'); reply.hidden = true;
        content.replaceChildren(el('h3', t.title), el('p', '“' + result.text + '”', 'speech'), factCard(id));
        const replies = el('div', undefined, 'reply-options'); replies.setAttribute('role', 'group'); replies.setAttribute('aria-label', 'Choose what to say');
        for (const c of t.choices) { const disabled = c.when && !c.when(state()); const b = button('“' + c.label + '”' + (disabled ? ' · Ask Mako first' : ''), () => { const text = C.reply(state(), who, id, c.id); if (text === null) return; api.remembered(); reply.textContent = P.characters[who].name + ': “' + text + '”'; reply.hidden = false; for (const n of replies.children) n.setAttribute('aria-pressed', String(n === b)); }, disabled); b.setAttribute('aria-pressed', String(state().neighbours.replies[id] === c.id)); replies.append(b); }
        const previous = t.choices.find(c => c.id === state().neighbours.replies[id]); if (previous) { reply.textContent = P.characters[who].name + ': “' + previous.reply(state()) + '”'; reply.hidden = false; }
        content.append(replies, reply, button('Other conversation topics', list)); if (t.recipe) content.append(button('Open this recipe in the notebook', recipes));
      }
      list(); actions.append(details);
    }
    function personActions(actions, who) {
      conversation(actions, who);
      if (Object.hasOwn(H.rides, who)) actions.append(button(H.activeRide(state()) === who ? 'Your passenger’s crossing' : 'Passenger fare · ' + H.rides[who].title, () => trip(who)));
      if (['mei', 'nao', 'jun'].includes(who)) actions.append(button('Nao’s recipe notebook', recipes));
    }
    function shortcuts(body) {
      const s = state(), grid = el('div', undefined, 'dock-shortcuts'), meal = P.meals[s.docked];
      if (meal) { const reason = M.actionStatus(s, 'meal').reason; grid.append(limited(meal.name + ' · ' + meal.price + ' cr · ' + meal.minutes + ' min', reason, () => commit(() => M.action(s, 'meal'), () => openPanel(meal.name, [host(meal.who), el('p', meal.text), button('Back to the quay', api.closePanel)])), true)); }
      grid.append(button('Fishing, food & photos', api.pastimes.hub), button('Passenger trips', routes), button('Neighbour favours', favours)); body.append(grid);
    }
    return {routes, trip, practice, favours, favourView, recipes, recipe, notebook, conversation, personActions, shortcuts};
  }
  window.VoyageNeighboursUI = {create};
})();
