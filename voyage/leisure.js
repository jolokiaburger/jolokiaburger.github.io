/* Optional harbour activities. Existing version-one voyages gain empty records. */
(function () {
  'use strict';
  const M = window.VoyageModel, W = window.VoyageWorld;
  const owns = (obj, id) => Object.hasOwn(obj, id);
  const record = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const fish = {
    silver: {name: 'Silver sprat', colour: '#bad1cd', ports: ['bar', 'market', 'metro']},
    bream: {name: 'Lantern bream', colour: '#cfac78', ports: ['landing', 'pier', 'market']},
    carp: {name: 'Canal carp', colour: '#b18b73', ports: ['canal', 'bar']},
    mackerel: {name: 'Blue mackerel', colour: '#799fb1', ports: ['yard', 'pier','coast-station']},
    rockfish: {name: 'Reef rockfish', colour: '#af7e76', ports: ['island']},
    moonfish: {name: 'Moonfin', colour: '#b3b4cf', ports: ['observatory', 'island','tea-island']}
  };
  const dishes = {
    broth: {miso: 'Gentle miso', ginger: 'Ginger broth'},
    topping: {tofu: 'Silken tofu', mushroom: 'Roasted mushrooms', greens: 'Spring greens'},
    tea: {roasted: 'Roasted tea', black: 'Black tea', jasmine: 'Jasmine tea'}
  };
  const customers = [
    {id: 'priya', hint: '“Something gentle, with soft tofu. Roasted tea will keep my paperwork company.”', order: {broth: 'miso', topping: 'tofu', tea: 'roasted'}, reply: 'Priya sets her pen beside the cup. “That is exactly the break I had in mind.”'},
    {id: 'kenji', hint: '“Ginger, mushrooms, and black tea, please. I have spent enough of tonight smelling engine oil.”', order: {broth: 'ginger', topping: 'mushroom', tea: 'black'}, reply: 'Kenji takes a careful first spoonful. “A much better kind of warmth than an overheating engine.”'},
    {id: 'mei', hint: '“Miso, a handful of greens, and jasmine tea. Let me be the one who sits down for once.”', order: {broth: 'miso', topping: 'greens', tea: 'jasmine'}, reply: 'Mei lets Nao carry the tray. “Good. You remembered that cooks need supper too.”'}
  ];
  const photos = {
    'market-lights': {title: 'Lanterns over the market', job: 'yumi', quay: 'market', x: 1280, y: 830, viewX: 1370, viewY: 970, radius: 220, hint: 'Sail beside Lantern Market; its warm reflections belong in Yumi’s sketchbook.'},
    'canal-lanterns': {title: 'The canal bridge', job: 'yumi', quay: 'canal', x: 1900, y: 1410, viewX: 2170, viewY: 1370, radius: 230, hint: 'Frame Kisaragi’s bridge and its lanterns from the water.'},
    'lighthouse-beam': {title: 'Hoshimi’s patient light', job: 'mio', quay: 'island', x: 1290, y: 1510, viewX: 1564, viewY: 1518, radius: 220, hint: 'Photograph Hoshimi’s lighthouse from nearby water for Mio.'}
  };
  const jobs = {
    yumi: {port: 'metro', title: 'Yumi’s harbour sketchbook', shots: ['market-lights', 'canal-lanterns'], charm: 'pennant', intro: '“Two views for my sketchbook: the market lights and the canal bridge. Take your time; I am drawing the harbour, not measuring your speed.”', thanks: '“Those reflections! I can hear the kettle through the picture.” Yumi gives you a small paper pennant for the Tern.'},
    mio: {port: 'observatory', title: 'Mio’s lighthouse study', shots: ['lighthouse-beam'], charm: 'star', intro: '“Could you frame Hoshimi’s light from the water? A wide view or a close one is fine. I want to remember where the beam comes home.”', thanks: 'Mio saves the lighthouse exposure beside her star charts, then ties a tiny brass star to your cabin rail.'}
  };
  const charms = {fish: 'Paper fish', cup: 'Little tea cup', pennant: 'Yumi’s pennant', star: 'Mio’s brass star'};
  const fresh = () => ({fishing: {casts: 0, catches: [], pending: null, relaxed: false}, kitchen: [], photos: {accepted: [], shots: [], delivered: []}});
  const at = (n, clock) => Number.isFinite(n) && n >= 1420 && n <= clock;
  const unique = (rows, allowed) => Array.isArray(rows) && new Set(rows).size === rows.length && rows.every(id => owns(allowed, id));
  function valid(s) {
    const l = s.leisure;
    if (l === undefined) return true;
    if (!record(l) || !record(l.fishing) || !record(l.photos)) return false;
    const f = l.fishing, p = l.photos;
    if (!Number.isInteger(f.casts) || f.casts < 0 || f.casts > 6 || typeof f.relaxed !== 'boolean' || !Array.isArray(f.catches) || f.catches.length !== f.casts) return false;
    if (!f.catches.every(c => record(c) && owns(fish, c.id) && W.ports.some(q => q.id === c.port) && at(c.at, s.clock) && ['kept', 'released', 'shared', 'cooked', 'gifted'].includes(c.outcome))) return false;
    if (f.catches.filter(c => c.outcome === 'kept').length > 3) return false;
    if (f.pending !== null && (!record(f.pending) || !owns(fish, f.pending.id) || f.pending.port !== s.docked || f.pending.index !== f.casts || !at(f.pending.at, s.clock) || f.casts >= 6 || f.catches.filter(c => c.outcome === 'kept').length >= 3)) return false;
    if (!Array.isArray(l.kitchen) || l.kitchen.length > 3 || !l.kitchen.every((r, i) => record(r) && r.customer === customers[i].id && at(r.at, s.clock) && typeof r.matched === 'boolean' && record(r.dish) && Object.keys(dishes).every(k => owns(dishes[k], r.dish[k])))) return false;
    if (!unique(p.accepted, jobs) || !unique(p.delivered, jobs) || !p.delivered.every(id => p.accepted.includes(id)) || !Array.isArray(p.shots) || p.shots.length > 3 || new Set(p.shots.map(r => r?.id)).size !== p.shots.length) return false;
    if (!p.shots.every(r => record(r) && owns(photos, r.id) && p.accepted.includes(photos[r.id].job) && at(r.at, s.clock) && ['wide', 'close'].includes(r.frame) && typeof r.weather === 'string' && r.weather.length < 30)) return false;
    return p.delivered.every(id => jobs[id].shots.every(key => p.shots.some(r => r.id === key)));
  }
  function hydrate(s) { if (s.leisure === undefined) s.leisure = fresh(); return s.leisure; }
  function status(s, kind) {
    const l = s.leisure || fresh();
    if (s.ended) return 'This voyage has ended';
    if (kind === 'fish') {
      if (!s.docked) return 'Moor at a quay first';
      if (l.fishing.casts >= 6) return 'Six casts completed this voyage';
      if (l.fishing.catches.filter(c => c.outcome === 'kept').length >= 3) return 'Catch basket full: release one or visit Nao';
      if (s.clock + 4 > 1800) return 'Needs 4 min before 06:00';
    } else if (kind === 'kitchen') {
      if (s.docked !== 'market' || s.flags.naoAboard) return 'Nao needs to be at her market counter';
      if (l.kitchen.length >= 3) return 'The three customers have been served';
      if (s.clock + 6 > 1800) return 'Needs 6 min before 06:00';
    } else if (kind === 'share') {
      if (s.docked !== 'market' || s.flags.naoAboard) return 'Bring the catch to Nao’s market counter';
      if (!l.fishing.catches.some(c => c.outcome === 'kept')) return 'No catch in the basket';
    }
    return '';
  }
  function chooseFish(s) {
    let pool = Object.keys(fish).filter(id => fish[id].ports.includes(s.docked));
    if (M.weather(s).name === 'rain' && !pool.includes('bream')) pool.push('bream');
    let hash = 17;
    for (const ch of s.seed + s.docked + M.weather(s).name + (s.leisure?.fishing.casts || 0)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return pool[hash % pool.length];
  }
  function cast(s) {
    if (status(s, 'fish')) return false;
    const f = hydrate(s).fishing;
    if (!f.pending) f.pending = {id: chooseFish(s), port: s.docked, index: f.casts, at: s.clock};
    return true;
  }
  function reel(s) {
    if (status(s, 'fish')) return false;
    const f = hydrate(s).fishing, p = f.pending;
    if (!p || p.port !== s.docked) return false;
    const c = {id: p.id, port: p.port, at: s.clock + 4, outcome: 'kept'};
    f.catches.push(c); f.casts++; f.pending = null;
    M.advance(s, 4); M.log(s, 'Caught a ' + fish[c.id].name.toLowerCase() + ' · 4 min, no credits spent.'); M.observe(s);
    return c;
  }
  function pack(s) { const f = hydrate(s).fishing; if (!f.pending) return false; f.pending = null; return true; }
  function releaseFish(s, index) {
    const c = s.leisure?.fishing.catches[index];
    if (s.ended || !Number.isInteger(index) || !c || c.outcome !== 'kept') return false;
    c.outcome = 'released'; M.log(s, 'Released the ' + fish[c.id].name.toLowerCase() + ' gently.'); return true;
  }
  function share(s, index) {
    if (status(s, 'share') || !Number.isInteger(index)) return false;
    const c = s.leisure.fishing.catches[index];
    if (!c || c.outcome !== 'kept') return false;
    M.hydrate(s); c.outcome = 'shared'; s.credits += 6;
    M.transaction(s, 'leisure', 6, 'Nao’s fresh catch · ' + fish[c.id].name);
    M.log(s, 'Nao accepted your ' + fish[c.id].name.toLowerCase() + ' · 6 cr, no handover time.'); return true;
  }
  function serve(s, dish) {
    if (status(s, 'kitchen') || !record(dish) || !Object.keys(dishes).every(k => owns(dishes[k], dish[k]))) return false;
    M.hydrate(s); const rows = hydrate(s).kitchen, customer = customers[rows.length], matched = Object.keys(dishes).every(k => dish[k] === customer.order[k]);
    const payment = matched ? 6 : 4;
    rows.push({customer: customer.id, at: s.clock + 6, dish: {...dish}, matched}); s.credits += payment;
    M.advance(s, 6); M.transaction(s, 'leisure', payment, 'Kitchen shift · ' + customer.id);
    M.log(s, 'Served ' + window.VoyagePorts.characters[customer.id].name + ' · ' + payment + ' cr thanks · 6 min.'); M.observe(s);
    return {matched, payment, text: matched ? customer.reply : 'Nao adds a little of the requested seasoning. “A warm bowl still finds a welcome. We can remember their favourite for next time.”'};
  }
  function acceptPhotos(s, id) {
    if (!owns(jobs, id) || s.ended || s.docked !== jobs[id].port || s.leisure?.photos.accepted.includes(id)) return false;
    hydrate(s).photos.accepted.push(id); M.log(s, 'Accepted ' + jobs[id].title + ' · No purchase or deadline.'); return true;
  }
  function nearPhoto(s) {
    if (s.docked || s.ended) return null;
    const p = s.leisure?.photos;
    return Object.keys(photos).find(id => p?.accepted.includes(photos[id].job) && !p.shots.some(r => r.id === id) && Math.hypot(s.ship.x - photos[id].x, s.ship.y - photos[id].y) <= photos[id].radius) || null;
  }
  function takePhoto(s, id, frame) {
    if (!owns(photos, id) || !['wide', 'close'].includes(frame) || nearPhoto(s) !== id || s.ship.speed > .1 || s.clock + 2 > 1800) return false;
    const shot = {id, frame, at: s.clock + 2, weather: M.weather(s).name};
    hydrate(s).photos.shots.push(shot); M.advance(s, 2); M.log(s, 'Photographed ' + photos[id].title + ' · 2 min, free.'); return shot;
  }
  function deliverPhotos(s, id) {
    const p = s.leisure?.photos;
    if (!owns(jobs, id) || s.ended || s.docked !== jobs[id].port || !p?.accepted.includes(id) || p.delivered.includes(id) || !jobs[id].shots.every(key => p.shots.some(r => r.id === key))) return false;
    p.delivered.push(id); M.log(s, jobs[id].thanks); return true;
  }
  function stories(s) {
    const l = s.leisure; if (!l) return [];
    const rows = l.photos.accepted.map(id => {
      const j = jobs[id], next = j.shots.find(key => !l.photos.shots.some(r => r.id === key)), done = l.photos.delivered.includes(id);
      return {id: 'photos-' + id, title: j.title, done, to: next ? photos[next].quay : j.port, text: done ? j.thanks : next ? photos[next].hint + ' Use Frame a photo while alongside the view, then return to ' + window.VoyagePorts.characters[id].name + '.' : 'Bring the photographs to ' + window.VoyagePorts.characters[id].name + ' · Free, no deadline.'};
    });
    if (l.kitchen.length) rows.push({id: 'kitchen-shift', title: 'Nao’s kitchen shift', done: l.kitchen.length === 3, to: 'market', text: l.kitchen.length + ' / 3 customers served · ' + l.kitchen.filter(r => r.matched).length + ' favourite trays remembered.'});
    if (l.fishing.casts) rows.push({id: 'fishing', title: 'A little dockside fishing', done: !l.fishing.catches.some(c => c.outcome === 'kept'), to: 'market', text: l.fishing.casts + ' / 6 casts · ' + l.fishing.catches.filter(c => c.outcome === 'kept').length + ' in the catch basket. Share with Nao or release them through Harbour pastimes.'});
    return rows;
  }
  const originalDestinationInfo = M.destinationInfo;
  M.destinationInfo = (s, id) => { const info = originalDestinationInfo(s, id); if (info) info.steps.push(...stories(s).filter(r => !r.done && r.to === id).map(r => r.title + ' · ' + r.text)); return info; };
  const originalValid = M.valid, originalHydrate = M.hydrate, originalCreate = M.create, originalStories = M.stories, originalDepart = M.depart, originalEntry = M.voyageEntry;
  M.valid = s => originalValid(s) && valid(s);
  M.hydrate = s => { originalHydrate(s); hydrate(s); return s; };
  M.create = seed => { const s = originalCreate(seed); hydrate(s); return s; };
  M.stories = s => [...originalStories(s), ...stories(s)];
  M.depart = s => { const result = originalDepart(s); if (result) pack(s); return result; };
  M.voyageEntry = s => { const entry = originalEntry(s); entry.result += s.ledger?.totals.leisure?.in || 0; return entry; };
  window.VoyageLeisure = {fish, dishes, customers, photos, jobs, charms, fresh, valid, hydrate, status, cast, reel, pack, releaseFish, share, serve, acceptPhotos, nearPhoto, takePhoto, deliverPhotos, stories};
})();
