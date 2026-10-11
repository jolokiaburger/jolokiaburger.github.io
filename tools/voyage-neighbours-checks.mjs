import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const context = vm.createContext({window: {}, console});
for (const file of ['trade.js','market.js','voyage/world-map.js','voyage/navigation.js','voyage/ports.js','voyage/model.js','voyage/leisure.js','voyage/neighbours.js','voyage/conversations.js','voyage/travel-plan.js','voyage/profile.js','voyage/leisure-profile.js','voyage/neighbours-profile.js']) vm.runInContext(fs.readFileSync(root + file, 'utf8'), context, {filename: file});
const {VoyageModel: M, VoyageNeighbours: H, VoyageConversations: C, VoyageLeisure: L, VoyageProfile: P, VoyagePorts: Ports, VoyageWorld: W, VoyageNavigation: N} = context.window;
let checks = 0;
const check = (v, message) => { assert.ok(v, message); checks++; };
const equal = (a, b, message) => { assert.equal(a, b, message); checks++; };
const clone = v => JSON.parse(JSON.stringify(v));
const moor = (s, id) => { const p = W.ports.find(p => p.id === id); s.docked = id; s.ship = {x: p.x, y: p.y, speed: 0, angle: 0}; };
const rejected = (s, fn, message) => { const before = JSON.stringify(s); check(!fn(), message); equal(JSON.stringify(s), before, message + ' has no side effects'); };
let s = M.create('neighbours'), p = P.create();
delete s.neighbours; delete s.leisure; check(M.valid(s), 'original Voyage state still accepted'); const cash = s.credits; M.hydrate(s);
equal(s.credits, cash, 'migration transfers no money'); equal(s.neighbours.learned.length, 0, 'migration learns nothing for free'); check(M.valid(clone(s)), 'hydrated legacy voyage valid');
delete p.neighbours; delete p.album; delete p.fishSeen; delete p.charms; delete p.look.charm; check(P.valid(p), 'old profile accepted'); P.hydrate(p); check(P.valid(clone(p)), 'profile defaults valid'); equal(p.neighbours.facts.length, 0, 'profile migration creates no facts');

// Every neighbour has original topics, meaningful replies, and a named note source.
equal(Object.keys(C.topics).length, 28, 'two authored topics per fourteen neighbours');
for (const port of W.ports) for (const who of port.people) {
  s = M.create('topics-' + who); moor(s, port.id); const beforeCash = s.credits, beforeFuel = s.fuel, beforeClock = s.clock, beforeQuotes = JSON.stringify(s.quotes);
  const available = C.available(s, who); equal(available.length, 2, 'two topics for ' + who);
  for (const t of available) {
    const result = C.read(s, who, t.id); check(result && result.text && t.fact && t.kind, 'read authored topic ' + t.id);
    const heard = s.neighbours.facts[t.id]; check(C.read(s, who, t.id), 'topic can be revisited'); equal(s.neighbours.facts[t.id], heard, 'first hearing time retained');
    for (const c of t.choices) {
      if (c.when && !c.when(s)) rejected(s, () => C.reply(s, who, t.id, c.id), 'evidence-gated reply');
      else check(C.reply(s, who, t.id, c.id), 'explicit reply ' + t.id + '/' + c.id);
    }
  }
  equal(s.credits, beforeCash, 'topics are free'); equal(s.fuel, beforeFuel, 'topics use no fuel'); equal(s.clock, beforeClock, 'topics pause the clock'); equal(JSON.stringify(s.quotes), beforeQuotes, 'topics do not reveal unseen quotes'); check(M.valid(clone(s)), 'conversation survives reload');
  rejected(s, () => C.read(s, who, 'toString'), 'inherited topic ID rejected'); rejected(s, () => C.reply(s, who, available[0].id, 'constructor'), 'unknown reply rejected');
}
s = M.create('remote'); rejected(s, () => C.read(s, 'mio', 'mio-depth'), 'remote character cannot be read at Mei’s quay');
C.read(s, 'mei', 'mei-broth'); equal(s.neighbours.learned[0], 'lantern', 'Mei teaches her own recipe'); M.advance(s, 20); C.read(s, 'mei', 'mei-broth'); equal(s.neighbours.facts['mei-broth'], 1420, 'rereading after time passes retains hearing time');
P.syncNeighbours(p, s); P.restoreNeighbourLearning(p, M.create('next-night')); check(p.neighbours.recipes.includes('lantern'), 'recipe learning persists'); check(P.valid(clone(p)), 'learned profile valid');

// All three fares, both route choices, optional stops, cancellation, coexistence and actual receipt boundaries.
for (const [id, d] of Object.entries(H.rides)) for (const route of ['direct', 'tea']) {
  s = M.create('ride-' + id + route); moor(s, d.from); rejected(s, () => H.ride(s, id, 'board', route), 'unreleased passenger cannot board');
  check(H.waitRide(s, id), 'wait for actual passenger release'); equal(s.clock, d.opens, 'release wait has exact time'); rejected(s, () => H.waitRide(s, id), 'wait cannot repeat');
  const cash = s.credits, capacity = M.held(s); check(H.ride(s, id, 'board', route), 'board ' + id); equal(s.clock, d.opens + 3, 'boarding full three minutes'); equal(s.credits, cash, 'boarding no purchase'); equal(M.held(s), capacity, 'passenger takes no freight slot');
  rejected(s, () => H.ride(s, id, 'board', route), 'no duplicate boarding'); const another = Object.keys(H.rides).find(k => k !== id); rejected(s, () => H.ride(s, another, 'board'), 'one fare passenger at a time');
  s.flags.naoAboard = true; s.flags.yumiAboard = true; s.waterMeetings.rider = 'lift'; moor(s, 'island'); check(M.people(s).includes(id), 'fare passenger present at another quay'); check(M.people(s).includes('nao') && M.people(s).includes('yumi'), 'existing passengers coexist'); check(M.chat(s, id), 'passenger can chat away from home');
  s.flags.naoAboard = false; s.flags.yumiAboard = false; s.waterMeetings = {};
  if (route === 'tea') { moor(s, d.stop); const clock = s.clock; check(H.ride(s, id, 'stop'), 'share optional thermos stop'); equal(s.clock, clock + 8, 'thermos stop full eight minutes'); equal(s.credits, cash, 'passenger’s own tea is free'); rejected(s, () => H.ride(s, id, 'stop'), 'thermos cannot repeat'); }
  moor(s, d.to); const clock = s.clock; check(H.ride(s, id, 'finish'), 'explicit passenger destination handover'); equal(s.clock, clock + 2, 'two minute disembark'); equal(s.credits, cash + d.payment, 'exact promised fare'); rejected(s, () => H.ride(s, id, 'finish'), 'fare cannot pay twice'); check(M.ledgerReport(s).reconciled, 'passenger ledger reconciles'); equal(M.voyageEntry(s).result, d.payment, 'fare included once in settled result'); check(M.valid(clone(s)), 'completed fare reloads');
  p = P.create(); P.hydrate(p); P.syncNeighbours(p, s); check(p.charms.includes('ticket'), 'ticket unlocked by real homecoming'); s.ended = true; check(P.record(p, s), 'completed fare archived'); check(P.valid(clone(p)), 'fare history and letters valid'); const letters = p.letters.length; P.record(p, s); equal(p.letters.length, letters, 'report reopening duplicates no letter');
}
s = M.create('close-fare'); moor(s, 'landing'); M.advance(s, 70); H.ride(s, 'priya', 'board', 'tea'); moor(s, 'yard'); const purse = s.credits; check(H.ride(s, 'priya', 'close'), 'step ashore at another quay'); equal(s.credits, purse, 'closing fare creates no payment'); check(M.stories(s).find(r => r.id === 'ride-priya').outcome === 'Closed', 'closed fare is not a successful memory'); check(M.valid(clone(s)), 'closed fare valid');
s = M.create('direct-after-tea'); moor(s, 'landing'); M.advance(s, 70); H.ride(s, 'priya', 'board', 'tea'); moor(s, 'metro'); check(H.ride(s, 'priya', 'finish'), 'optional stop does not block a direct homecoming'); equal(s.neighbours.rides.priya.stopped, false, 'unvisited stop not invented');

// Every favour, actual fish ownership, either picnic pickup order, evidence branches and closed jobs.
s = M.create('cook-supper'); check(H.favour(s, 'supper', 'accept'), 'accept supper favour at a quay'); rejected(s, () => H.favour(s, 'supper', 'deliver', 0), 'cannot give an absent fish'); L.cast(s); L.reel(s); check(H.favour(s, 'supper', 'deliver', 0), 'give one actual kept catch'); equal(s.leisure.fishing.catches[0].outcome, 'gifted', 'catch became supper'); rejected(s, () => L.share(s, 0), 'gifted fish cannot be sold'); rejected(s, () => H.favour(s, 'supper', 'deliver', 0), 'supper settles once'); check(M.valid(clone(s)), 'gifted catch reloads');
for (const id of ['crew', 'picnic']) for (const reverse of [false, true]) {
  s = M.create('favour-' + id + reverse); const d = H.favours[id]; H.favour(s, id, 'accept'); const steps = Object.entries(d.steps); if (reverse) steps.reverse();
  for (const [key, port] of steps) { moor(s, port); const clock = s.clock, hold = M.held(s); check(H.favour(s, id, 'pack', key), 'pack favour ingredient'); equal(s.clock, clock + 5, 'full packing time'); equal(M.held(s), hold, 'recipe packet has its separate basket'); rejected(s, () => H.favour(s, id, 'pack', key), 'ingredient cannot duplicate'); }
  moor(s, d.to); const cash = s.credits; check(H.favour(s, id, 'deliver'), 'complete ' + id); equal(s.credits, cash + d.payment, 'exact favour payment'); rejected(s, () => H.favour(s, id, 'deliver'), 'favour settles once'); check(M.ledgerReport(s).reconciled, 'favour ledger reconciles'); check(M.valid(clone(s)), 'favour reloads');
}
for (const answer of ['records', 'legend']) {
  s = M.create('bell-' + answer); moor(s, 'landing'); H.favour(s, 'bell', 'accept'); rejected(s, () => H.favour(s, 'bell', 'deliver', answer), 'mystery requires evidence'); C.read(s, 'priya', 'priya-bell'); moor(s, 'canal'); C.read(s, 'mako', 'mako-bell'); moor(s, 'landing'); check(C.reply(s, 'priya', 'priya-bell', 'compare'), 'cross-checked reply unlocks'); check(H.favour(s, 'bell', 'deliver', answer), 'bell interpretation settles'); check(Ports.board(s).some(r => r.title.includes(answer === 'records' ? 'Checked record' : 'Harbour legend')), 'board reflects the chosen interpretation'); check(M.valid(clone(s)), 'mystery branch reloads');
}
for (const id of Object.keys(H.favours)) { s = M.create('close-' + id); H.favour(s, id, 'accept'); const cash = s.credits; check(H.favour(s, id, 'close'), 'close optional favour'); equal(s.credits, cash, 'closing no reward'); rejected(s, () => H.favour(s, id, 'accept'), 'closed favour cannot restart'); check(M.valid(clone(s)), 'closed favour reloads'); }

// Three discoverable recipes, matches and variations, shared catch identity, persistence and finite servings.
for (const [id, d] of Object.entries(H.recipes)) for (const variation of [false, true]) {
  s = M.create('recipe-' + id + variation); const teacherPort = W.ports.find(p => p.people.includes(d.teacher)); moor(s, 'market'); rejected(s, () => H.cook(s, id, {broth:d.broth, topping:d.topping, tea:d.tea}), 'recipe must be learned');
  moor(s, teacherPort.id); check(C.read(s, d.teacher, d.topic), 'learn from correct cook'); if (d.fish) { check(L.cast(s), 'cast for recipe'); check(L.reel(s), 'land recipe catch'); } moor(s, 'market');
  const dish = {broth:d.broth, topping:d.topping, tea:variation ? d.tea === 'black' ? 'jasmine' : 'black' : d.tea}, cash = s.credits, clock = s.clock;
  const result = H.cook(s, id, dish, d.fish ? 0 : null); check(result, 'prepare discovered recipe'); equal(result.matched, !variation, 'variation has authored feedback'); equal(s.clock, clock + 6, 'whole cooking duration'); equal(s.credits, cash, 'recipe creates no cash'); check(M.valid(clone(s)), 'recipe survives reload'); rejected(s, () => H.cook(s, id, dish, d.fish ? 0 : null), 'one serving per recipe per voyage');
  if (d.fish) { equal(s.leisure.fishing.catches[0].outcome, 'cooked', 'selected fish consumed once'); rejected(s, () => L.share(s, 0), 'cooked fish cannot be sold'); }
  p = P.create(); P.hydrate(p); P.syncNeighbours(p, s); const next = M.create('new-night'); P.restoreNeighbourLearning(p, next); check(next.neighbours.learned.includes(id), 'recipe carried into fresh voyage'); equal(next.neighbours.recipes.length, 0, 'new voyage does not repeat a completed serving'); check(P.valid(clone(p)), 'recipe book profile valid');
}
s = M.create('all-recipes'); p = P.create(); P.hydrate(p);
for (const [id,d] of Object.entries(H.recipes)) { moor(s,W.ports.find(p=>p.people.includes(d.teacher)).id);C.read(s,d.teacher,d.topic);if(d.fish){L.cast(s);L.reel(s);}moor(s,'market');check(H.cook(s,id,{broth:d.broth,topping:d.topping,tea:d.tea},d.fish?s.leisure.fishing.catches.length-1:null),'complete cookbook page'); }
P.syncNeighbours(p,s);check(p.charms.includes('bowl'),'three distinct recipes earn bowl');check(M.valid(clone(s))&&P.valid(clone(p)),'complete cookbook save and profile valid');

// Optional docking has no gameplay penalty and keeps earned unique-quay progress.
s=M.create('dock-practice');p=P.create();P.hydrate(p);
for(const id of ['bar','landing','market']) {moor(s,id);s.docked=null;s.ship.x-=20;s.ship.speed=10;s.ship.angle=0;s.neighbours.practice=true;const fuel=s.fuel,clock=s.clock;check(N.approach(s.ship,W.ports.find(p=>p.id===id)).gentle,'slow aligned approach recognised');check(M.dock(s),'normal docking works with practice');equal(s.fuel,fuel,'practice no fuel charge');equal(s.clock,clock,'practice no time charge');P.syncNeighbours(p,s);}
check(p.charms.includes('rope'),'three different quays earn knot');equal(p.neighbours.gentle.length,3,'unique-quay progress');check(P.valid(clone(p)),'docking profile valid');
s=M.create('rough-dock');s.neighbours.practice=true;s.docked=null;s.ship.x-=20;s.ship.speed=80;check(M.dock(s),'fast landing still docks without damage');equal(s.neighbours.landings[0].grade,'secured','fast landing feedback truthful');
s=M.create('no-practice');s.docked=null;s.ship.x-=20;check(M.dock(s),'default docking unchanged');equal(s.neighbours.landings.length,0,'no unsolicited practice record');

// Full-duration guards, exact dawn and no reward on a rejected action.
for(const [action,minutes] of [['board',3],['stop',8],['finish',2]]) for(const exact of [false,true]) {
  s=M.create('dawn-ride');moor(s,'landing');M.advance(s,70);if(action!=='board')H.ride(s,'priya','board','tea');moor(s,action==='stop'?'bar':action==='finish'?'metro':'landing');M.advance(s,1800-minutes+(exact?0:1)-s.clock);
  if(exact){check(H.ride(s,'priya',action),'ride action fits exact dawn');equal(s.clock,1800,'ride exact dawn');check(s.ended&&M.valid(clone(s)),'exact-dawn ride save valid');}else rejected(s,()=>H.ride(s,'priya',action),'ride too late has no side effects');
}
for(const exact of [false,true]) {
  s=M.create('dawn-fish-gift');H.favour(s,'supper','accept');L.cast(s);L.reel(s);M.advance(s,1796+(exact?0:1)-s.clock);
  if(exact){check(H.favour(s,'supper','deliver',0),'supper exact dawn');check(s.ended&&M.valid(clone(s)),'exact-dawn gift valid');}else rejected(s,()=>H.favour(s,'supper','deliver',0),'late gift consumes no fish');
  s=M.create('dawn-recipe');C.read(s,'mei','mei-broth');L.cast(s);L.reel(s);moor(s,'market');M.advance(s,1794+(exact?0:1)-s.clock);
  if(exact){check(H.cook(s,'lantern',{broth:'miso',topping:'greens',tea:'roasted'},0),'recipe exact dawn');check(s.ended&&M.valid(clone(s)),'exact-dawn recipe valid');}else rejected(s,()=>H.cook(s,'lantern',{broth:'miso',topping:'greens',tea:'roasted'},0),'late recipe consumes no fish');
}

// Bad identifiers, shapes, receipts, times and cross-record catch ownership fail before use.
const base=M.create('bad-save');
const bad=[x=>x.neighbours=null,x=>x.neighbours.rides=[],x=>x.neighbours.practice='yes',x=>x.neighbours.learned=['toString'],x=>x.neighbours.learned=['garden','garden'],x=>x.neighbours.facts.toString=1420,x=>x.neighbours.facts['mei-clock']=1800,x=>x.neighbours.replies['mei-clock']='plan',x=>x.neighbours.landings=[{port:'constructor',at:1420,grade:'gentle'}],x=>x.neighbours.landings=Array(61).fill({port:'bar',at:1420,grade:'gentle'}),x=>x.neighbours.rides.priya={stage:'done',route:'direct',stopped:false,boarded:1493,at:1493,revenue:999},x=>x.neighbours.favours.supper={stage:'done',steps:[],catch:0,answer:null,at:1420,revenue:0}];
for(const mutate of bad){const x=clone(base);mutate(x);check(!M.valid(x),'malformed optional save rejected');}
const falseEvidence=clone(base);falseEvidence.neighbours.facts['priya-bell']=base.clock;falseEvidence.neighbours.replies['priya-bell']='compare';check(!M.valid(falseEvidence),'saved comparison requires the actual inspection account');
s=M.create('orphan');L.cast(s);L.reel(s);s.leisure.fishing.catches[0].outcome='cooked';check(!M.valid(s),'orphan cooked catch rejected');delete s.neighbours;check(!M.valid(s),'missing recipe record cannot legitimise a cooked catch');
for(const id of ['toString','constructor','__proto__','missing']) {s=M.create('unsafe-id');rejected(s,()=>H.ride(s,id,'board'),'unsafe passenger ID');rejected(s,()=>H.favour(s,id,'accept'),'unsafe favour ID');rejected(s,()=>H.cook(s,id,{}),'unsafe recipe ID');}
p=P.create();P.hydrate(p);for(const mutate of [x=>x.neighbours.facts=['constructor'],x=>x.neighbours.recipes=['garden','garden'],x=>x.neighbours.cooked=['lantern'],x=>x.neighbours.gentle=['unknown'],x=>x.neighbours.practice=1]){const x=clone(p);mutate(x);check(!P.valid(x),'malformed notebook profile rejected');}
console.log('Passed '+checks+' neighbour, dialogue, recipe, docking, dawn and save checks.');
