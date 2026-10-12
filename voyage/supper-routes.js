/* Finite supper evenings: paid ingredients, chosen tables and explicit servings. */
(function () {
  'use strict';
  const M = window.VoyageModel, W = window.VoyageWorld;
  const own = (o, k) => Object.hasOwn(o, k), record = o => !!o && typeof o === 'object' && !Array.isArray(o);
  const ingredients = {
    rice: {name: 'Dry rice', quay: 'bar', cost: 6, minutes: 4},
    ginger: {name: 'Ginger & sesame', quay: 'bar', cost: 4, minutes: 4},
    mushrooms: {name: 'Roasted mushrooms', quay: 'market', cost: 6, minutes: 4},
    tea: {name: 'Jun’s supper tea', quay: 'canal', cost: 4, minutes: 4}
  };
  const dishes = {
    rice: {name: 'Ginger-sesame rice', ingredients: ['rice', 'ginger'], text: 'Mei’s ginger and sesame, folded into rice that travels well.'},
    broth: {name: 'Mushroom & tea broth', ingredients: ['mushrooms', 'tea'], text: 'Nao’s roasted mushrooms with Jun’s tea beside the bowl.'},
    garden: {name: 'Garden tea rice', ingredients: ['rice', 'tea'], text: 'A little rice and a pot of tea, with the growers credited on the menu.'}
  };
  const tables = {
    metro: {name: 'The late platform crew', who: 'lam', favourite: 'garden', text: 'Lam puts the thermos down. “A timetable tells people where to go. A table gives them a reason to stay.”'},
    yard: {name: 'Rin’s workshop table', who: 'rin', favourite: 'rice', text: '“For once the warm thing on this bench is supper.” Rin slides the repair manual out of the way.'},
    canal: {name: 'Jun’s lockside friends', who: 'jun', favourite: 'broth', text: 'Jun tastes the bowl before naming the tea. “A recipe is more interesting when it has travelled with someone.”'},
    bar: {name: 'Mei’s homecoming table', who: 'mei', favourite: 'rice', text: 'Mei reads the credited recipe. “You brought my rice home with a new story. That is an excellent return.”'},
    observatory: {name: 'Mio’s sky-watch supper', who: 'mio', favourite: 'broth', text: 'Mio folds the chart away from the steam. “We can let the telescope look after the sky for six minutes.”'}
  };
  const stationGuests = [
    {id: 'growers', name: 'The tea growers’ watch', who: 'nao', favourite: 'garden', text: 'Nao puts the growers’ names beside the first tray. Their own tea has found a table at the station.'},
    {id: 'repair', name: 'Rin’s repair crew', who: 'rin', favourite: 'rice', text: 'Rin leaves a ladle beside the rota. “Etsuko wanted this place to be useful. Nobody mentioned how good it would smell.”'},
    {id: 'last-watch', name: 'The last signal watch', who: 'nao', favourite: 'broth', text: 'The last watch brings its cups back clean. Nao adds a small note: leave room for the next cook.'}
  ];
  const required = menu => [...new Set(menu.flatMap(id => dishes[id].ingredients))];
  const permit = s => s.supperPermit || (s.breakwater?.steps.includes('supper') ? s.breakwater.ending : null);
  function valid(s) {
    if (s.supperPermit !== undefined && !['book', 'kitchen'].includes(s.supperPermit)) return false;
    const r = s.supper;
    if (r === undefined || r === null) return true;
    if (!record(r) || !['route', 'station'].includes(r.mode) || !['active', 'done', 'closed'].includes(r.stage) || !Array.isArray(r.menu) || r.menu.length !== 2 || new Set(r.menu).size !== 2 || !r.menu.every(id => own(dishes, id))) return false;
    if (!Array.isArray(r.stops) || new Set(r.stops).size !== r.stops.length || (r.mode === 'route' ? r.stops.length < 2 || r.stops.length > 3 || !r.stops.every(id => own(tables, id)) : r.stops.length !== 1 || r.stops[0] !== 'coast-station')) return false;
    if (!permit(s) || r.mode === 'station' && (permit(s) !== 'kitchen' || !window.VoyageRegions.unlocked(s))) return false;
    const needs = required(r.menu), guests = r.mode === 'route' ? r.stops : stationGuests.map(g => g.id);
    if (!record(r.packed) || !Object.entries(r.packed).every(([id, at]) => needs.includes(id) && Number.isFinite(at) && at >= 1420 && at <= s.clock)) return false;
    if (!Array.isArray(r.served) || r.served.length > guests.length || new Set(r.served.map(g => g?.id)).size !== r.served.length) return false;
    if (!r.served.every((g, i) => record(g) && g.id === guests[i] && r.menu.includes(g.dish) && Number.isFinite(g.at) && g.at >= 1420 && g.at <= s.clock && needs.every(id => r.packed[id] !== undefined && r.packed[id] <= g.at) && g.payment === 12 + (guest(r, i).favourite === g.dish ? 3 : 0))) return false;
    return r.stage === 'done' ? r.served.length === guests.length : r.stage === 'closed' || r.served.length < guests.length;
  }
  function guest(r, i = r.served.length) { return r.mode === 'station' ? stationGuests[i] : tables[r.stops[i]]; }
  function startStatus(s, mode = 'route') {
    if (s.ended) return 'This night has ended';
    if (!s.docked) return 'Moor first';
    if (s.docked !== 'market') return 'Plan with Nao at the Night Market';
    if (!permit(s)) return 'Complete Beyond the Breakwater first';
    if (s.supper) return 'One supper evening per night';
    if (s.flags.naoAboard || s.breakwater?.crew) return 'Bring Nao home before planning';
    if (mode === 'station' && (permit(s) !== 'kitchen' || !window.VoyageRegions.unlocked(s))) return 'Continue the completed station-kitchen expedition for coastal access';
    return '';
  }
  function start(s, menu, mode, stops) {
    if (startStatus(s, mode) || !['route', 'station'].includes(mode) || !Array.isArray(menu) || menu.length !== 2 || new Set(menu).size !== 2 || !menu.every(id => own(dishes, id))) return false;
    if (mode === 'route' && (!Array.isArray(stops) || stops.length < 2 || stops.length > 3 || new Set(stops).size !== stops.length || !stops.every(id => own(tables, id)))) return false;
    s.supper = {mode, stage: 'active', menu: menu.slice(), stops: mode === 'station' ? ['coast-station'] : stops.slice(), packed: {}, served: []};
    s.track = 'supper-route'; M.log(s, 'Supper evening planned · ' + menu.map(id => dishes[id].name).join(' & ') + '. Ingredients are bought once for the whole evening; each table contributes 12 cr, plus 3 cr for its preferred dish.'); return true;
  }
  function buyStatus(s, id) {
    const r = s.supper, d = ingredients[id];
    if (!r || r.stage !== 'active' || !own(ingredients, id) || !required(r.menu).includes(id)) return 'No ingredient order for this evening';
    if (r.packed[id] !== undefined) return 'Already packed for every table';
    if (s.ended) return 'This night has ended';
    if (s.docked !== d.quay) return 'Buy at ' + W.ports.find(p => p.id === d.quay).name;
    if (s.clock + d.minutes > 1800) return 'Needs ' + d.minutes + ' min before 06:00';
    return s.credits < d.cost ? 'Needs ' + d.cost + ' cr' : '';
  }
  function buy(s, id) {
    if (buyStatus(s, id)) return false;
    const d = ingredients[id]; s.credits -= d.cost; M.transaction(s, 'food', -d.cost, 'Supper evening · ' + d.name);
    s.supper.packed[id] = s.clock + d.minutes; M.advance(s, d.minutes); M.log(s, d.name + ' packed for the evening · ' + d.cost + ' cr, ' + d.minutes + ' min.'); return true;
  }
  function serveStatus(s) {
    const r = s.supper;
    if (!r || r.stage !== 'active') return 'No table waiting this evening';
    if (s.ended) return 'This night has ended';
    if (!required(r.menu).every(id => r.packed[id] !== undefined)) return 'Collect every listed ingredient first';
    const port = r.mode === 'station' ? 'coast-station' : r.stops[r.served.length];
    if (s.docked !== port) return 'Next table at ' + W.ports.find(p => p.id === port).name;
    if (s.clock + 6 > 1800) return 'Needs 6 min before 06:00';
    return '';
  }
  function serve(s, dish) {
    if (serveStatus(s) || !s.supper.menu.includes(dish)) return null;
    const r = s.supper, g = guest(r), matched = g.favourite === dish, payment = 12 + (matched ? 3 : 0);
    r.served.push({id: r.mode === 'station' ? g.id : r.stops[r.served.length], dish, at: s.clock + 6, payment});
    if (r.served.length === (r.mode === 'station' ? 3 : r.stops.length)) r.stage = 'done';
    s.credits += payment; M.transaction(s, 'leisure', payment, 'Supper contribution · ' + g.name); M.advance(s, 6);
    M.log(s, g.name + ' · ' + dishes[dish].name + ' · Received ' + payment + ' cr, 6 min.');
    return {who: g.who, text: g.text + (matched ? ' “You remembered our favourite.”' : ' They welcome the variation.'), payment, matched};
  }
  function close(s) { if (!s.supper || s.supper.stage !== 'active' || s.ended || !s.docked) return false; s.supper.stage = 'closed'; M.log(s, 'Supper evening closed. Remaining ingredients are shared ashore; no refund or further contribution.'); return true; }
  function next(s) { const r = s.supper; if (!r || r.stage !== 'active') return null; const id = required(r.menu).find(id => r.packed[id] === undefined); return id ? {kind: 'supper-buy', id, quay: ingredients[id].quay} : {kind: 'supper-serve', id: r.mode === 'station' ? stationGuests[r.served.length].id : r.stops[r.served.length], quay: r.mode === 'station' ? 'coast-station' : r.stops[r.served.length]}; }
  const oldValid = M.valid, oldStories = M.stories, oldEntry = M.voyageEntry, oldPeople=M.people;
  M.valid = s => oldValid(s) && valid(s);
  M.people=s=>{const ids=oldPeople(s);if(s.docked==='coast-station'&&s.supper?.mode==='station'&&s.supper.stage!=='closed')for(const id of ['nao','rin'])if(!ids.includes(id))ids.push(id);return ids;};
  M.stories = s => [...oldStories(s), ...(s.supper ? [{id: 'supper-route', title: s.supper.mode === 'station' ? 'Etsuko’s hosted supper' : 'The travelling supper route', done: s.supper.stage !== 'active', outcome: s.supper.stage === 'closed' ? 'Closed' : undefined, to: next(s)?.quay, text: s.supper.stage === 'active' ? s.supper.served.length + ' tables served · Next: ' + W.ports.find(p => p.id === next(s).quay).name + '.' : s.supper.stage === 'done' ? 'Every table shared. Ingredients and contributions appear in the cash ledger.' : 'Closed; no further contribution or refund.'}] : [])];
  M.voyageEntry = s => { const r = oldEntry(s); if (s.supper) { r.result -= Object.keys(s.supper.packed).reduce((n, id) => n + ingredients[id].cost, 0); if (s.supper.stage === 'done') r.caption = 'A recipe found another table, and the Tern brought the evening home.'; } return r; };
  window.VoyageSuppers = {ingredients, dishes, tables, stationGuests, required, permit, valid, guest, startStatus, start, buyStatus, buy, serveStatus, serve, close, next};
})();
