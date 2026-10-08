// Run with Node 22+: node tools/adventure-checks.mjs
// Exercises the actual engine in a VM with presentation hooks disabled. No dependencies.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const ids=new Set([...read('index.html').matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const saved=new Map();
const context=vm.createContext({console,window:{},document:{readyState:'loading',addEventListener(){},getElementById(id){return ids.has(id)?{}:null;}},location:{protocol:'file:',search:''},setTimeout(){return 1;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},URLSearchParams});
context.window.localStorage={getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)};
context.window.matchMedia=()=>({matches:false,addEventListener(){}});
for(const name of ['cases.js','trade.js','market.js','dialogue.js','expansion.js','night-market.js','night-two.js'])vm.runInContext(read(name),context,{filename:name});
let engine=read('game.js');
engine=engine.replace('  if (document.readyState === "loading")', `
  window.Review = {newState, newTradeState, setState, locationActions, actionLines, nextCasual, casualActions, conditionHolds, saveProblem, setEndFlags, tradeChoicesResult, canTravel, travelCost, cheapestExit, tradeActionAffordable, marketActionLabel, breakfastOffer, breakfastProgress, secondNightProgress, renderTradeActions, showTradeResolution, summaryDom: (nodes) => {Object.assign(dom,nodes);revealResolution=function(){};},
    state: () => state, activeCase: () => activeCase,
    visit: (loc, clock) => {state.location=loc;if(clock!==undefined)state.clock=parseClock(clock);},
    readSaved: () => readSave()};
  render = function () {}; renderKeepingFocus = function () {}; focusEncounter = function () {};
  beginCrossing = function () {};
  setMode = function () {}; positionFerry = function () {}; toast = function () {};
  showResolution = function () {}; debugMarket = function () {};
  if (document.readyState === "loading")`);
vm.runInContext(engine,context,{filename:'game.js'});
const api=context.window.NeonTides,R=context.window.Review;
let checks=0;const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(a,b,message)=>{assert.equal(a,b,message);checks++;};
const json=x=>JSON.stringify(x);
const report=api.validateAll();
for(const [id,errors] of Object.entries(report))equal(errors.length,0,`${id}: ${errors.join('; ')}`);
const D=context.window.NEON_TIDES, T=context.window.NEON_TIDES_TRADE, C=context.window.NEON_TIDES_CHAT;
for(const [id,character] of Object.entries(C)){
 check(D.world.characters[id]||T.characters[id],`known speaker ${id}`);
 equal(new Set(character.lines.map(x=>x.id)).size,character.lines.length,`unique line IDs ${id}`);
 check(character.lines.filter(x=>!x.when&&!x.mode).length>=5,`five evergreen lines ${id}`);
 for(const visit of character.visits)check(D.world.locations[visit.at],`known visit ${id}`);
 if(character.thing)check(ids.has(character.thing),`drawn thing ${id}`);
}
for(const seed of ['frost-order','vault-light','two-tides']){
 api.trade.start(seed);
 const initial=R.state();
 const protectedState=()=>json({clock:R.state().clock,credits:R.state().credits,fuel:R.state().fuel,rel:R.state().rel,gold:R.state().gold,rumors:R.state().rumors});
 const before=protectedState();let lines=[];
 for(let i=0;i<15;i++){
  api.performAction('chat_mei');const text=R.state().lastResult.lines[0].text;
  if(i)check(text!==lines[i-1],`no consecutive repeated chat ${seed}`);
  lines.push(text);
 }
 equal(new Set(lines.slice(0,5)).size,5,`five distinct chats ${seed}`);
 equal(protectedState(),before,`chat cannot farm resources, trust or rumours ${seed}`);
 equal(api.readSave().used['chat_seen:mei:welcome'],1,'chat memory autosaves');
 const expected=R.nextCasual('mei')[0].text;
 R.setState(api.readSave());
 equal(R.nextCasual('mei')[0].text,expected,'chat rotation survives reload');
 // Food keeps its cost and original event/conversation rewards.
 const purse=R.state().credits,clock=R.state().clock;
 api.performAction('bar_noodles');equal(R.state().credits,purse-14,'noodle price preserved');equal(R.state().clock,clock+15,'meal advances time');
 check(R.state().rumors.some(r=>r.id==='r_vault'),'meal still delivers first story lead');
 const mealRel=R.state().rel.mei;
 api.performAction('chat_mei');equal(R.state().rel.mei,mealRel,'chat does not buy trust');
 // Free repeatable story speech rotates only after its current version has been read.
 api.performAction('bar_mei_talk');const first=R.state().lastResult.lines[0].text;
 api.performAction('bar_mei_talk');check(R.state().lastResult.lines[0].text!==first,'repeatable story talk gets a different reply');
 // Buy/sell still execute and save, with no clock change.
 const tradeClock=R.state().clock,grams=R.state().gold.reduce((n,l)=>n+l.grams,0);
 check(api.trade.buy(1),'can buy gold');equal(R.state().gold.reduce((n,l)=>n+l.grams,0),grams+1,'gold added');
 check(api.trade.sell(1),'can sell gold');equal(R.state().clock,tradeClock,'trades remain free of time');
 // Rei and Dex cannot be chatted to after they leave their quays.
 R.visit('bar','01:20');check(!R.casualActions().some(a=>a.casual==='teo'),'Rei leaves bar at 01:20');
 R.visit('pier','01:29');check(!R.casualActions().some(a=>a.casual==='teo'),'Rei not yet at pier');
 R.visit('pier','01:30');check(R.casualActions().some(a=>a.casual==='teo'),'Rei arrives at pier at 01:30');
 R.visit('metro','01:39');check(R.casualActions().some(a=>a.casual==='dex'),'Dex before last train');
 R.visit('metro','01:40');check(!R.casualActions().some(a=>a.casual==='dex'),'Dex leaves with last train');
 // Rereading a save without new counters is supported.
 const legacy=JSON.parse(json(R.state()));for(const key of Object.keys(legacy.used))if(key.startsWith('chat_')||key.startsWith('dialogue:'))delete legacy.used[key];
 equal(R.saveProblem(legacy),null,'older save remains valid');
 R.setState(legacy);R.visit('bar','02:00');api.performAction('chat_mei');check(R.state().lastResult.lines.length>0,'legacy save can chat');
 api.trade.turnIn();check(R.state().resolved,'morning report still resolves');
 equal(R.casualActions().length,0,'no casual chat after ending');
}
// All four case graphs still build. Check every ending through the real confrontation flow
// with the case's actual evidence and timeline answers; this does not claim a UI walkthrough.
for(const variant of D.variants){
 const built=(()=>{R.setState(R.newState(variant.seeds[0],variant.id));return R.activeCase()})();
 for(const choice of built.finalChoices){
  R.setState(R.newState(variant.seeds[0],variant.id));let state=R.state();state.flags.accepted=true;
  for(const id of Object.keys(built.clues))state.clues.push({id,foundAt:state.clock,where:state.location});
  for(const row of built.timeline)state.timeline[row.id]=row.answer;
  state.location=built.confrontation.at;
  api.performAction('sys_confront');check(state.confront,'confrontation opens');
  const evidence=[];
  for(const tag of built.confrontation.requires){const clue=Object.keys(built.clues).find(id=>(built.clues[id].proves||[]).includes(tag));if(!evidence.includes(clue))evidence.push(clue);}
  evidence.forEach(api.toggleEvidence);api.submitEvidence();equal(state.confront.stage,'explain','evidence still proves the lie');
  // The explanation is selected by the same state fields as the UI.
  const answer=built.confrontation.explanations.find(e=>e.id===variant.truth);
  state.confront.explanation=answer.id;
  state.confront.support=Object.keys(built.clues).find(id=>(built.clues[id].proves||[]).includes(answer.proof));
  api.submitExplanation();equal(state.confront.stage,'choice','motive still proves the truth');
  api.chooseEnding(choice.id);equal(state.ending,choice.ending,'ending still reachable');
 }
}
// Full expedition via real travel/action APIs: resource costs, unlocks, mutually exclusive payment,
// autosave, capped dealers and rescue all apply without presentation hooks.
for (const seed of ['frost-order','vault-light','two-tides']) {
 for (const payment of ['cash','gold']) {
  api.trade.start(seed);
  check(!R.canTravel('island').ok,'island needs a discovered chart');
  api.performAction('exp_chart');check(!R.state().flags.exp_chart,'cannot obtain chart from another quay');
  for(const from of Object.keys(D.world.locations))for(const to of Object.keys(D.world.locations)){
   if(from===to)continue;
   check(R.travelCost(from,to)?.fuel>0,`explicit route ${from} to ${to}`);
  }
  const startClock=R.state().clock;
  api.travelTo('market');equal(R.state().location,'market','market crossing succeeds');
  api.performAction('exp_accept');check(R.state().flags.exp_job,'delivery accepted');
  api.travelTo('yard');api.performAction('exp_chart');check(R.state().flags.exp_chart,'chart unlocks island');
  const purse=R.state().credits;api.performAction('yard_refuel');equal(R.state().credits,purse-30,'yard fuel costs credits');equal(R.state().fuel,6,'yard fills tank');
  const beforeCrossing=R.state().clock;
  api.travelTo('island');equal(R.state().fuel,3,'outbound island crossing uses three fuel');equal(R.state().clock,beforeCrossing+35,'island crossing uses 35 minutes');
  equal(api.readSave().location,'island','island visit autosaves');equal(R.saveProblem(api.readSave()),null,'expanded save validates');
  check(api.trade.buy(1),'island gold can be bought');check(api.trade.sell(1),'island gold can be sold');
  api.performAction('exp_collect');check(R.state().flags.exp_cargo,'kits collected');
  const collectedAt=R.state().clock;api.performAction('exp_collect');equal(R.state().clock,collectedAt,'cannot repeatedly collect kits');
  api.travelTo('market');equal(R.state().fuel,0,'return crossing uses remaining tank');
  const beforeCash=R.state().credits,beforeGold=R.state().gold.reduce((n,l)=>n+l.grams,0);
  api.performAction('exp_deliver_'+payment);check(R.state().flags.exp_done,'delivery completed');
  equal(R.state().credits,beforeCash+(payment==='cash'?85:0),'chosen cash reward only');
  equal(R.state().gold.reduce((n,l)=>n+l.grams,0),beforeGold+(payment==='gold'?1:0),'chosen gold reward only');
  const rewardState=json(R.state());api.performAction('exp_deliver_cash');api.performAction('exp_deliver_gold');equal(json(R.state()),rewardState,'reward cannot be collected twice or switched');
  check(api.currentObjective().includes('complete'),'objective records completion');
  check(R.state().clock>startClock,'journey costs real time');
  check(!R.canTravel('bar').ok,'empty tank prevents crossing');
  api.performAction('sys_tug');equal(R.state().location,'landing','tug rescues expedition traveller');
  api.trade.turnIn();check(R.state().resolved,'expanded night ends normally');
  check(Number.isFinite(R.tradeChoicesResult()),'reward accounting leaves finite trade result');
 }
}
// A no-trade quest never appears as trading profit. Gifted gold uses zero cash basis.
api.trade.start('frost-order');R.visit('market');R.state().flags.exp_cargo=true;
api.performAction('exp_deliver_cash');api.trade.turnIn();equal(R.tradeChoicesResult(),0,'cash quest reward excluded from trading performance');
api.trade.start('frost-order');R.visit('market');R.state().flags.exp_cargo=true;
api.performAction('exp_deliver_gold');api.trade.turnIn();equal(R.tradeChoicesResult(),0,'gold quest reward excluded from trading performance');
for(const variant of D.variants){R.setState(R.newState(variant.seeds[0],variant.id));for(const dest of ['market','yard','island'])check(!R.canTravel(dest).ok,'investigation retains original destinations');}
for(const loc of ['market','yard','island']){
 api.trade.start('vault-light');R.visit(loc);R.state().credits=100000;
 const stock=T.market.dealers[loc].stock;
 check(api.trade.buy(stock),'dealer stock can be bought');check(!api.trade.buy(1),'stock cannot be exceeded');
 check(api.trade.sell(stock),'dealer accepts purchase back');
 check(api.trade.debug().prices[loc].sell!==null,'expanded price is reported in debug');
}
// Buying caps and fuel affordability are enforced, not merely displayed.
for(const loc of ['market','yard','island']){
 api.trade.start('frost-order');R.visit(loc);
 const limit=T.market.dealers[loc].limit;
 R.state().gold=[{grams:limit+1,cost:0,karat:24,purity:0.999,where:loc,at:R.state().clock,provenance:'test cargo'}];
 check(api.trade.sell(limit),'dealer buys up to its limit');check(!api.trade.sell(1),'dealer cannot exceed its buying limit');
}
api.trade.start('vault-light');R.visit('yard');R.state().credits=29;
const poorState=json(R.state());api.performAction('yard_refuel');equal(json(R.state()),poorState,'refuel cannot overdraw purse');
api.trade.start('vault-light');R.visit('island');R.state().fuel=2;
check(R.locationActions().some(a=>a.id==='exp_collect')===false,'island pickup requires accepting the job');
check(R.canTravel('market').ok===false,'island return needs three fuel');
check(R.cheapestExit('island')===3,'rescue threshold uses actual island routes');
check(R.activeCase().actions.island.length>0,'island retains exploration choices');
const noRewardSave=JSON.parse(json(R.state()));delete noRewardSave.rewardCredits;delete noRewardSave.rewardGrams;
equal(R.saveProblem(noRewardSave),null,'pre-expansion reward fields remain optional');
noRewardSave.rewardCredits=-1;check(R.saveProblem(noRewardSave)!==null,'negative reward counter rejected');
// Character redesign keeps save-facing IDs while updating every player-facing identity.
equal(D.world.characters.teo.name,'Rei Minato','courier display identity updated');
equal(D.world.characters.teo.artStyle,'manga','courier uses larger portrait presentation');
equal(D.world.characters.mei.artStyle,'manga','Mei uses larger portrait presentation');
for(const [id,person] of Object.entries({...D.world.characters,...T.characters})){
 const portrait=person.portrait;
 check(portrait&&fs.existsSync(path.join(root,portrait)),`${id} portrait is shipped`);
 equal(person.artStyle,'manga',`${id} uses manga presentation`);
 const asset=fs.readFileSync(path.join(root,portrait));
 equal(asset.toString('ascii',0,4),'RIFF',`${id} valid WebP container`);
 equal(asset.toString('ascii',8,12),'WEBP',`${id} valid WebP signature`);
 equal(asset.toString('ascii',12,16),'VP8 ',`${id} lossy WebP frame`);
 equal(asset.readUInt16LE(26)&0x3fff,512,`${id} portrait width`);
 equal(asset.readUInt16LE(28)&0x3fff,512,`${id} portrait height`);
 check(asset.length<60000,`${id} portrait under 60 KB`);
}
for(const id of ['rei-pier','oduya-figure','hollis-landing','hollis-bar','priya-figure'])check(ids.has(id),`${id} figure is drawn`);
api.trade.start('two-tides');R.visit('pier','01:30');
equal(R.casualActions().find(a=>a.casual==='teo').thing,'rei-pier','Rei chat targets pier figure');
R.visit('landing','00:25');equal(R.casualActions().find(a=>a.casual==='hollis').thing,'hollis-landing','Hollis chat targets landing figure');
R.visit('bar','01:00');equal(R.casualActions().find(a=>a.casual==='hollis').thing,'hollis-bar','Hollis chat follows him to bar');
R.visit('landing','00:40');check(!R.casualActions().some(a=>a.casual==='hollis'),'Hollis leaves landing on schedule');
R.visit('bar','01:40');check(!R.casualActions().some(a=>a.casual==='hollis'),'Hollis leaves bar on schedule');
for(const source of ['cases.js','trade.js','dialogue.js'])check(!/\bTeo\b|\bVale\b|T\.V\./.test(read(source)),'old display name removed consistently');
check(read('cases.js').includes('WITNESS: R. Minato'),'witness signature follows renamed courier');
check(read('cases.js').includes('checked — R.M.'),'log initials follow renamed courier');
// The complete market lead: each seeded dispatch, both choices, and persistent chat.
const M=context.window.NeonMarket;
for(const seed of ['frost-order','vault-light','two-tides'])for(const reward of ['contract','report']){
 api.trade.start(seed);api.travelTo('market');
 const st=R.state(), opening=api.trade.debug().prices.market;
 const protectedState=()=>json({clock:st.clock,credits:st.credits,fuel:st.fuel,gold:st.gold,rumors:st.rumors});
 const freeBefore=protectedState();
 for(const id of ['nm_visit_gold','nm_visit_food','nm_visit_repair','nm_visit_lane'])api.performAction(id);
 equal(protectedState(),freeBefore,'browsing never purchases or advances time');
 for(const id of ['nao','kenji']){
  const lines=[];
  for(let i=0;i<8;i++){api.performAction('chat_'+id);const text=st.lastResult.lines[0].text;if(i)check(text!==lines[i-1],'market chats do not repeat consecutively');lines.push(text);}
  equal(new Set(lines.slice(0,5)).size,5,'market character has five distinct casual replies');
 }
 equal(protectedState(),freeBefore,'new character chats cannot farm rewards');
 const mealCash=st.credits,mealTime=st.clock;
 api.performAction('market_skewers');equal(st.credits,mealCash-9,'Nao skewers price');equal(st.clock,mealTime+10,'Nao meal takes ten minutes');
 check(st.rumors.some(r=>r.id==='r_market_guess'),'a meal supplies a sourced uncertain lead');
 const beforeJob=json(st);api.performAction('nm_manifest');equal(json(st),beforeJob,'manifest requires accepting dispatch lead');
 api.performAction('nm_notice');check(st.flags.nm_job,'market job accepted');
 const beforeSearch=st.clock;api.performAction('nm_manifest');equal(st.clock,beforeSearch+5,'checking manifest costs five minutes');
 const origin=st.truth==='vault'?'landing':'yard';const other=origin==='landing'?'yard':'landing';
 api.travelTo(other);const unverified=json(st);api.performAction('nm_dispatch_'+other);equal(json(st),unverified,'wrong dispatch origin cannot verify lead');
 api.travelTo(origin);api.performAction('nm_dispatch_'+origin);check(st.flags.nm_verified,'actual dispatcher confirms route');
 check(st.rumors.some(r=>r.id==='r_market_confirmed_'+origin),'checked lead recorded in notebook');
 api.performAction(origin==='yard'?'yard_refuel':'landing_refuel');api.travelTo('market');equal(st.location,'market','verified route returns by real crossing');
 const beforeMeal=st.credits;api.performAction('market_tea');equal(st.credits,beforeMeal-6,'tea is a separate paid order');
 check(st.convos.includes('nm_food_verified'),'return meal responds to checked dispatch');
 const reload=api.readSave();equal(R.saveProblem(reload),null,'market save validates');R.setState(reload);const restored=R.state();
 const cash=restored.credits,held=M.lots.total(restored.gold);const bid=api.trade.debug().prices.market.sell;
 api.performAction('nm_'+reward);check(restored.flags.nm_done,'market lead closes');
 if(reward==='contract'){
  check(R.marketActionLabel(R.activeCase().actions.market.find(a=>a.id==='nm_contract')).includes(String(2*(bid+4))+' cr now'),'contract label previews the actual payout');
  equal(M.lots.total(restored.gold),held-2,'repair order consumes two real grams');
  equal(restored.credits,cash+2*(bid+4),'repair order pays displayed bid plus premium');
  equal(restored.trades.at(-1).contract,'nm_contract','repair order recorded as a trade');
  equal(api.trade.debug().prices.market.canSell,16,'order counts against dealer buying cap');
  equal(restored.rewardCredits||0,0,'sale is not counted as courier reward');
 }else{
  equal(restored.credits,cash+25,'courier fee is twenty-five credits');equal(M.lots.total(restored.gold),held,'courier fee leaves gold untouched');
  equal(restored.rewardCredits,25,'fee recorded separately from trading');
 }
 const finished=json(restored);api.performAction('nm_contract');api.performAction('nm_report');equal(json(restored),finished,'market choices mutually exclusive and unrepeatable');
 // The restock is independent of quest completion and never refreshes buying capacity.
 const arrival=restored.truth==='vault'?'03:00':'02:00';R.visit('market',arrival);
 check(api.trade.debug().prices.market.canBuy>opening.canBuy,'arrival adds real sale stock');
 equal(api.trade.debug().prices.market.canSell,reward==='contract'?16:18,'arrival does not reset buying allowance');
 api.performAction('market_tea');check(restored.convos.includes('nm_food_after'),'meal recognises completed market lead');
 api.trade.turnIn();check(Number.isFinite(R.tradeChoicesResult()),'market night produces finite result');
}
// Supply changes match their own event component, not a promise about the whole gold market.
for(const [truth,time,amount] of [['order','02:00',16],['both','02:00',12],['vault','03:00',12]]){
 const at=M.parseClock(time), seed=T.truths.find(t=>t.id===truth).seeds[0];
 const before=M.available(T,truth,'market',at-1,[]);const after=M.available(T,truth,'market',at,[]);
 equal(after.buy,before.buy+amount,'shipment adds configured grams at its exact minute');
 equal(M.available(T,truth,'market',at,[{where:'market',kind:'buy',grams:12,at:at-10}]).buy,amount,'restock preserves previous purchases');
 const short=M.breakdown(T,truth,seed,'market',M.parseClock('01:00')).events.filter(e=>e.event.startsWith('market_')).reduce((n,e)=>n+e.pct,0);
 const eased=M.breakdown(T,truth,seed,'market',at+15).events.filter(e=>e.event.startsWith('market_')).reduce((n,e)=>n+e.pct,0);
 check(eased<short,'delivery eases local shortage modifier');
 equal(M.available(T,truth,'market',at,[{where:'market',kind:'sell',grams:18,at:at-10}]).sell,0,'restock cannot refresh buying allowance');
 if(truth==='vault')equal(M.available(T,truth,'market',M.parseClock('02:00'),[]).buy,12,'late dispatch has no two-o-clock restock');
}
api.trade.start('two-tides');R.visit('market','01:00');R.state().flags.nm_verified=true;
R.state().gold=[];const noGold=json(R.state());check(!R.tradeActionAffordable(R.activeCase().actions.market.find(a=>a.id==='nm_contract')),'order button disabled without gold');api.performAction('nm_contract');equal(json(R.state()),noGold,'repair order cannot sell nonexistent gold');
api.performAction('nm_report');check(R.state().flags.nm_report_done,'no-gold skipper can finish through courier work');
api.trade.start('two-tides');R.visit('market','01:00');R.state().flags.nm_verified=true;api.performAction('nm_report');api.trade.turnIn();equal(R.tradeChoicesResult(),0,'courier fee excluded from trading performance');
api.trade.start('two-tides');R.visit('market','01:00');R.state().flags.nm_verified=true;
R.state().trades.push({where:'market',kind:'sell',grams:17,price:90,total:1530,at:R.state().clock});
const capped=json(R.state());check(!R.tradeActionAffordable(R.activeCase().actions.market.find(a=>a.id==='nm_contract')),'order button disabled at buying cap');api.performAction('nm_contract');equal(json(R.state()),capped,'order cannot exceed remaining buying allowance');
api.performAction('nm_report');check(R.state().flags.nm_done,'capped seller retains courier alternative');
api.trade.start('frost-order');R.visit('market','01:00');R.state().fuel=5;
const canTime=R.state().clock,canCash=R.state().credits;api.performAction('nm_fuel');equal(R.state().fuel,6,'reserve can adds one fuel');equal(R.state().credits,canCash-6,'reserve can costs six credits');equal(R.state().clock,canTime+5,'reserve can takes five minutes');
const oneCan=json(R.state());api.performAction('nm_fuel');equal(json(R.state()),oneCan,'reserve fuel cannot be farmed');
api.trade.start('frost-order');R.visit('market','01:00');R.state().fuel=4;R.state().credits=5;
const unaffordable=json(R.state());api.performAction('nm_fuel');equal(json(R.state()),unaffordable,'reserve fuel cannot overdraw purse');
api.trade.start('vault-light');R.visit('market','03:29');check(R.casualActions().some(a=>a.casual==='kenji'),'Kenji present before closing');
R.visit('market','03:30');check(!R.casualActions().some(a=>a.casual==='kenji'),'Kenji leaves exactly at closing');
for(const id of ['nm_visit_repair','nm_contract','nm_fuel','market_skewers','nm_bench'])check(!R.locationActions().some(a=>a.id===id),'closed bench and grill actions unavailable');
check(R.locationActions().some(a=>a.id==='nm_late_bun'),'late food replaces grill');check(R.locationActions().some(a=>a.id==='market_tea'),'late tea remains available');
const latePrice=R.state().credits;api.performAction('nm_late_bun');equal(R.state().credits,latePrice-8,'late bun and tea price');check(R.state().convos.includes('nm_food_late'),'late sitting acknowledges closed bench');
check(!R.state().rumors.some(r=>r.id==='r_market_guess'),'new late visitor does not hear stale early gossip');
for(const [seed,wait,to] of [['frost-order','nm_wait_early','02:00'],['vault-light','nm_wait_late','03:00']]){
 api.trade.start(seed);R.visit('market','01:20');R.state().flags.nm_verified=true;const cash=R.state().credits;api.performAction(wait);equal(R.state().clock,M.parseClock(to),'explicit wait reaches checked arrival');equal(R.state().credits,cash,'waiting does not silently order food');check(R.state().fired.some(e=>e.id.startsWith('market_')&&e.id!=='market_delay'),'waiting fires dispatch event');
}
for(const id of ['market-scale','market-lane','market-wall','exp-nao','exp-kenji'])check(ids.has(id),'market target exists in illustration');
check(read('index.html').indexOf('night-market.js')<read('index.html').indexOf('src="game.js"'),'market data loads before engine');
const scene=fs.readFileSync(path.join(root,'assets/scenes/lantern-market.webp'));
equal(scene.toString('ascii',8,12),'WEBP','market scene is local WebP');equal(scene.readUInt16LE(26)&0x3fff,1440,'market scene width');equal(scene.readUInt16LE(28)&0x3fff,800,'market scene height');check(scene.length<500000,'market scene stays under 500 KB');
for(const id of ['sora','nao','kenji']){
 const asset=fs.readFileSync(path.join(root,'assets/sprites/'+id+'-market.webp'));
 equal(asset.toString('ascii',8,12),'WEBP','sprite is WebP');equal(asset.toString('ascii',12,16),'VP8X','sprite has extended WebP header');check((asset[20]&16)!==0,'sprite preserves alpha channel');equal(asset.readUIntLE(24,3)+1,240,'sprite width');equal(asset.readUIntLE(27,3)+1,360,'sprite height');check(asset.length<60000,'sprite stays under 60 KB');
}
for(const match of read('index.html').matchAll(/<image[^>]+href="([^"]+)"/g))check(fs.existsSync(path.join(root,match[1])),'scene image reference shipped');
api.trade.start('frost-order');R.visit('market','03:30');R.state().flags.nm_verified=true;check(api.currentObjective().includes('closed'),'objective updates after repair deadline');
// Nao's personal thread: real routes, both suppliers, invitations, capped sales and saves.
for(const seed of ['frost-order','vault-light','two-tides'])for(const source of ['local','wharf']){
 api.trade.start(seed);api.travelTo('market');const st=R.state();
 const start=st.credits;api.performAction('nb_start');equal(st.credits,start,'Nao story begins without a purchase');check(st.flags.nb_started,'Nao thread accepted');check(st.rumors.some(r=>r.id==='r_nao_breakfast'),'terms written in sourced notebook');
 api.performAction('nb_recipe');check(st.flags.nb_story,'personal recipe conversation available');
 api.performAction('nb_repair');check(st.flags.nb_repaired&&st.flags.nb_warmer,'Kenji helps repair warmer');
 if(source==='local')api.performAction('nb_local_batch');
 api.travelTo('landing');
 if(source==='wharf'){
  const beforeQuote=st.credits;api.performAction('nb_wharf_batch');equal(st.credits,beforeQuote,'co-op requires reading its terms');
  api.performAction('nb_quote');check(st.rumors.some(r=>r.id==='r_nao_wharf'),'co-op collection terms recorded');api.performAction('nb_wharf_batch');
 }
 equal(st.breakfastCost,source==='local'?24:18,'chosen supplier cost recorded separately');
 api.performAction('nb_invite_priya');api.performAction('landing_refuel');api.travelTo('bar');api.performAction('nb_invite_mei');api.travelTo('metro');api.performAction('nb_invite_lam');api.travelTo('market');
 equal(st.location,'market','all invitations reachable with actual crossings');
 const repeatPurchase=json(st);api.performAction('nb_local_batch');equal(json(st),repeatPurchase,'second supplier cannot create another batch');
 const handoverAt=st.clock;api.performAction('nb_deliver');equal(st.clock,handoverAt+5,'batch handover takes five minutes');check(st.flags.nb_batch_delivered,'batch handed over');
 const ready=api.readSave();equal(R.saveProblem(ready),null,'pre-opening breakfast save validates');R.setState(ready);const restored=R.state();
 check(R.breakfastProgress().some(line=>line.includes('3/3')),'all invited neighbours shown in progress');
 api.performAction('nb_wait');equal(restored.clock,M.parseClock('05:00'),'explicit wait reaches breakfast');
 const expectedSales=seed==='vault-light'?44:48;const quote=R.breakfastOffer(false);equal(quote.sold,expectedSales/4,'prepared attendance follows seeded demand and twelve-portion cap');
 check(R.marketActionLabel(R.activeCase().actions.market.find(a=>a.id==='nb_open')).includes(expectedSales+' cr'),'opening previews actual payout');
 const before=restored.credits;api.performAction('nb_open');check(restored.flags.nb_done,'opening completed');equal(restored.credits,before+expectedSales,'opening pays actual batch sales');equal(restored.breakfastRevenue,expectedSales,'batch sales tracked separately');equal(restored.rewardCredits||0,0,'food sales are not adventure gifts');
 for(const who of ['mei','priya','lam'])check(restored.lastResult.lines.some(l=>l.who===who),'invited character appears in opening dialogue');
 const closed=json(restored);for(const id of ['nb_open','nb_open_late','nb_deliver','nb_local_batch'])api.performAction(id);equal(json(restored),closed,'opening payments and deliveries cannot repeat');
 const net=restored.breakfastRevenue-restored.breakfastCost;equal(net,expectedSales-(source==='local'?24:18),'supply result before fuel is correct');
 api.performAction('nb_after');check(restored.flags.nb_after,'Nao has a personal follow-up');
 const cash=restored.credits,clock=restored.clock;api.performAction('nb_bowl');equal(restored.credits,cash-7,'sunrise meal costs seven');equal(restored.clock,clock+10,'sunrise meal takes ten minutes');check(restored.convos.includes('nb_breakfast_chat'),'sunrise meal has its own conversation');
 const done=api.readSave();equal(R.saveProblem(done),null,'completed breakfast save validates');R.setState(done);api.trade.turnIn();equal(R.tradeChoicesResult(),0,'food sales excluded from gold-trading performance');
}
// Attendance alone gives the full personal ending, even with an empty purse.
api.trade.start('frost-order');R.visit('market','04:55');R.state().credits=0;
api.performAction('nb_start');api.performAction('nb_recipe');const freeTime=R.state().clock;
api.performAction('nb_wait');api.performAction('nb_open');check(R.state().flags.nb_done,'no-money skipper reaches personal ending');equal(R.state().credits,0,'free opening does not invent a monetary reward');equal(R.state().breakfastRevenue,0,'Nao pantry does not become player stock');check(R.state().clock>=freeTime,'explicit wait costs time');
check(R.state().lastResult.lines.some(l=>l.text.includes('smaller rounds')),'no-warmer opening acknowledged');
// Low turnout can lose money; getting neighbours involved changes sales, not a free reward.
for(const seed of ['frost-order','vault-light','two-tides']){
 api.trade.start(seed);R.visit('market','01:00');api.performAction('nb_start');api.performAction('nb_local_batch');api.performAction('nb_deliver');R.visit('market','05:00');
 const expected=T.breakfast.demand[R.state().truth]*4;api.performAction('nb_open');equal(R.state().breakfastRevenue,expected,'unprepared turnout follows seeded demand');check(R.state().breakfastRevenue<24,'quiet opening can lose money on extra batch');
 api.trade.turnIn();equal(R.tradeChoicesResult(),0,'loss on supply batch does not appear as gold loss');
 api.trade.start(seed);R.visit('market','04:00');api.performAction('nb_start');api.performAction('nb_handwarm');check(R.state().flags.nb_handwarm&&R.state().flags.nb_warmer,'late insulated-tray fallback works');
 api.performAction('nb_local_batch');api.performAction('nb_deliver');R.visit('market','05:45');const lateQuote=R.breakfastOffer(true);const cash=R.state().credits;api.performAction('nb_open_late');equal(R.state().credits,cash+lateQuote.revenue,'late payout matches fewer customers');check(R.state().flags.nb_late&&R.state().flags.nb_done,'late return still finishes warmly');check(!R.locationActions().some(a=>a.id==='nb_open'),'late ending cannot switch to early payout');
}
api.trade.start('vault-light');R.visit('market','01:00');api.performAction('nb_start');api.performAction('nb_local_batch');R.visit('market','05:10');api.performAction('nb_open');equal(R.state().breakfastRevenue,0,'undelivered batch earns no money');check(R.state().lastResult.lines.some(l=>l.text.includes('still aboard')),'unserved cargo explained');
api.trade.start('vault-light');R.visit('market','01:00');api.performAction('nb_start');R.state().credits=17;R.visit('landing');api.performAction('nb_quote');const poor=json(R.state());api.performAction('nb_wharf_batch');equal(json(R.state()),poor,'supply purchase cannot overdraw purse');
// Deadline boundaries and alternative paths are authored explicitly.
api.trade.start('frost-order');R.visit('market','03:19');api.performAction('nb_start');check(R.locationActions().some(a=>a.id==='nb_repair'),'repair starts before its last safe time');R.visit('market','03:20');check(!R.locationActions().some(a=>a.id==='nb_repair'),'repair cutoff reserves ten minutes before Kenji closes');R.visit('market','03:30');check(R.locationActions().some(a=>a.id==='nb_handwarm'),'fallback available when Kenji leaves');R.visit('market','04:45');check(!R.locationActions().some(a=>a.id==='nb_handwarm'),'fallback cannot run beyond preparation time');R.visit('market','04:50');check(!R.locationActions().some(a=>a.id==='nb_local_batch'),'local batch closes at advertised cutoff');
R.visit('landing','04:30');check(!R.locationActions().some(a=>a.id==='nb_wharf_batch'),'co-op closes at its cutoff');R.visit('bar','05:00');check(!R.locationActions().some(a=>a.id==='nb_invite_mei'),'invitations close at opening');R.visit('market','04:59');check(!R.locationActions().some(a=>a.id==='nb_open'),'opening cannot occur before five');R.visit('market','05:00');check(R.locationActions().some(a=>a.id==='nb_open'),'opening available at five');R.visit('market','05:45');check(!R.locationActions().some(a=>a.id==='nb_open')&&R.locationActions().some(a=>a.id==='nb_open_late'),'quarter-to-six switches to last bowl');
api.trade.start('two-tides');R.visit('market','05:50');api.performAction('nb_start');check(R.state().lastResult.lines[0].text.includes('put Dad'),'new late visit uses past-tense introduction');api.performAction('nb_open_late');check(R.state().flags.nb_done,'late discoverer can still close story');
api.trade.start('two-tides');R.visit('market','01:00');api.performAction('nb_start');api.performAction('nb_local_batch');api.trade.turnIn();check(!R.state().flags.nb_done,'turning in early does not auto-complete Nao');equal(R.state().breakfastRevenue||0,0,'unfinished batch has no auto-payout');equal(R.tradeChoicesResult(),0,'unserved batch cost excluded from gold statistic');
const legacy=JSON.parse(json(R.state()));for(const key of ['breakfastCost','breakfastRevenue','breakfastSold'])delete legacy[key];equal(R.saveProblem(legacy),null,'new breakfast counters remain optional for older saves');
for(const [key,value] of [['breakfastCost',-1],['breakfastRevenue',Infinity],['breakfastSold',13],['breakfastSold',1.5]]){const bad=JSON.parse(json(legacy));bad[key]=value;check(R.saveProblem(bad)!==null,'bad optional breakfast field rejected');}
for(const variant of D.variants){R.setState(R.newState(variant.seeds[0],variant.id));check(!R.locationActions().some(a=>a.id.startsWith('nb_')),'Nao subplot stays outside investigation mode');}
api.trade.start('two-tides');R.visit('market','05:10');api.performAction('nb_start');api.performAction('nb_open');
const guestRule=T.sceneClasses.find(rule=>rule.class==='nao-breakfast-guests');check(!R.conditionHolds(guestRule.when),'uninvited opening has no guest overlay');
R.state().flags.nb_invite_mei=true;check(R.conditionHolds(guestRule.when),'one invitation enables guest overlay');R.state().flags.nb_late=true;check(!R.conditionHolds(guestRule.when),'late return has notes instead of guest overlay');
check(!R.conditionHolds(C.nao.lines.find(line=>line.id==='market_late_watch').when),'old tea-only chat stops after breakfast opens');
api.trade.start('two-tides');R.visit('market','03:20');R.state().credits=0;api.performAction('nb_start');api.performAction('nb_wait_trays');equal(R.state().clock,M.parseClock('03:30'),'free wait bridges warmer preparation gap');api.performAction('nb_handwarm');check(R.state().flags.nb_warmer,'empty-purse skipper can prepare trays after repair cutoff');equal(R.state().credits,0,'tray preparation needs no food purchase');
// Night Two is a real, saved chapter transition, not a fresh game with renamed text.
const firstData=json(T);
function beginSecond(truth, flags={nb_done:true,nb_warmer:true}) {
 api.trade.start('frost-order');R.visit('market','05:00');Object.assign(R.state().flags,flags);
 R.state().rel.nao=2;R.state().rel.mei=1;api.trade.turnIn();
 const old=JSON.parse(json(R.state()));
 check(api.trade.nextNight(),'finished Night One transitions');
 R.state().truth=truth;R.setState(R.state());
 return old;
}
for(const truth of ['order','vault','both'])for(const recipe of ['smoky','plum'])for(const source of ['landing','market'])for(const crates of [1,2]) {
 const old=beginSecond(truth,{nb_done:true,nb_warmer:true,nb_invite_mei:true,exp_done:true,exp_chart:true});
 const st=R.state();equal(st.night,2,'second chapter selected');equal(st.credits,old.credits,'actual purse carried');equal(json(st.gold),json(old.gold),'actual gold lots and costs carried');equal(st.fuel,old.fuel,'no free overnight fuel');equal(st.rel.nao,2,'relationship carried');
 equal(st.start.credits,st.credits,'gold benchmark uses carried credits');equal(st.start.grams,M.lots.total(st.gold),'gold benchmark uses carried holdings');
 check(st.previous.flags.nb_invite_mei&&st.previous.flags.exp_done&&st.flags.exp_chart,'story choices and channel unlock carried');
 equal(st.spent,0,'spending resets for this evening');equal(st.trades.length,0,'fresh dealer allowance and trading history');equal(st.rumors.length,0,'old rumours do not masquerade as current news');
 const untouched=json(st);check(!api.trade.nextNight(),'active Night Two cannot transition again');equal(json(st),untouched,'retry cannot duplicate carry-over resources');
 api.travelTo('market');api.performAction('n2_nao_start');
 check(st.lastResult.lines.some(l=>l.text.includes('warmer we prepared')),'Nao remembers warmer');check(st.lastResult.lines.some(l=>l.text.includes('thermos')),'Nao remembers invitation');
 api.performAction('n2_menu_'+recipe);check(st.flags['n2_'+recipe],'recipe choice recorded');check(!R.locationActions().some(a=>a.id==='n2_menu_'+(recipe==='smoky'?'plum':'smoky')),'menu choice mutually exclusive');
 api.performAction('n2_prep');check(st.flags.n2_prepped,'seasoning help recorded');
 if(source==='landing')api.travelTo('landing');
 const cash=st.credits;api.performAction('n2_buy_'+source+'_'+crates);equal(st.credits,cash-(source==='landing'?18:26)*crates,'cargo purchase cost exact');equal(st.cargo.crates,crates,'one or two ingredient slots filled');
 const purchase=json(st);api.performAction('n2_buy_'+source+'_'+crates);equal(json(st),purchase,'purchase cannot repeat');
 check(!R.locationActions().some(a=>a.cargoBuy),'one chosen purchase route blocks all other purchases');
 const loaded=api.readSave();equal(R.saveProblem(loaded),null,'Night Two cargo save validates');R.setState(loaded);const now=R.state();
 if(source==='landing')api.travelTo('market');
 const deliveryCash=now.credits;const offer=R.locationActions().find(a=>a.id==='n2_deliver');check(R.marketActionLabel(offer).includes((30*crates)+' cr'),'actual cargo payout preview');api.performAction('n2_deliver');equal(now.credits,deliveryCash+30*crates,'agreed cargo payment');equal(now.cargo.crates,0,'sold cargo consumed');equal(now.cargo.sold,crates,'delivered crates logged');
 const sold=json(now);api.performAction('n2_deliver');equal(json(now),sold,'handover cannot pay twice');
 api.performAction('n2_wait');equal(now.clock,M.parseClock('05:00'),'explicit recipe wait');api.performAction('n2_taste');check(now.flags.n2_done,'recipe story completed');check(now.lastResult.lines.some(l=>l.text.includes(recipe==='smoky'?'Mushroom':'Plum')),'ending reflects selected recipe');
 check(R.secondNightProgress().some(line=>line.includes('complete')),'cargo log reflects finished recipe');
 const finished=json(now);api.performAction('n2_taste');equal(json(now),finished,'tasting cannot replay completion');api.trade.turnIn();equal(R.tradeChoicesResult(),0,'cargo profits excluded from gold performance');equal(now.cargo.revenue-now.cargo.cost,(source==='landing'?12:4)*crates,'cargo margin before travel separate');equal(R.saveProblem(api.readSave()),null,'resolved Night Two reloads');
 check(!api.trade.nextNight(),'two-night chapter ends, no automatic third night');
 equal(R.saveProblem(old),null,'Night One save validates while chapter two active');R.setState(old);check(api.trade.data===T,'loading first night restores original data');
}
equal(json(T),firstData,'chapter builder never mutates original story');
// Prior missed/late endings produce honest, different introductions.
for(const [flags,phrase] of [[{},'while you were away'],[{nb_done:true,nb_late:true},'last-bowl skipper']]){beginSecond('vault',flags);api.travelTo('market');api.performAction('n2_nao_start');check(R.state().lastResult.lines.some(l=>l.text.includes(phrase)),'intro reflects previous attendance');}
// A zero-credit, zero-gold, empty-tank player still has a complete no-purchase route.
api.trade.start('two-tides');R.state().gold=[];R.state().credits=0;R.state().fuel=0;R.visit('bar','01:30');api.trade.turnIn();check(api.trade.nextNight(),'empty purse continues');
api.performAction('sys_tug');equal(R.state().location,'landing','stranded carry-over has tug recovery');api.performAction('n2_reserve_fuel');equal(R.state().fuel,2,'one co-op emergency voucher');const reserve=json(R.state());api.performAction('n2_reserve_fuel');equal(json(R.state()),reserve,'fuel voucher cannot farm');api.travelTo('market');api.performAction('n2_nao_start');api.performAction('n2_menu_plum');api.performAction('n2_wait');api.performAction('n2_taste');check(R.state().flags.n2_done,'free ending reachable by actual crossings with no trade');equal(R.state().credits,0,'free ending has no hidden cost');
beginSecond('both');api.travelTo('market');api.performAction('n2_nao_start');api.travelTo('landing');api.performAction('n2_courier');const courier=R.state();equal(courier.cargo.cost,0,'co-op property not paid stock');api.travelTo('market');const beforeFee=courier.credits;api.performAction('n2_deliver');equal(courier.credits,beforeFee+12,'courier fee paid exactly once');equal(courier.rewardCredits,12,'fee separate from commodity revenue');equal(courier.cargo.revenue,0,'courier cannot sell borrowed goods as owned stock');api.trade.turnIn();equal(R.tradeChoicesResult(),0,'courier fee excluded from gold return');
// Deadline boundaries include the five-minute handover; owned returns make losses explicit.
beginSecond('order');R.visit('market','01:00');api.performAction('n2_nao_start');api.performAction('n2_buy_market_2');R.visit('market','04:25');check(R.locationActions().some(a=>a.id==='n2_deliver'),'last on-time start at 04:25');R.visit('market','04:26');check(!R.locationActions().some(a=>a.id==='n2_deliver'),'delivery closes after last safe start');R.visit('landing','05:40');check(R.locationActions().some(a=>a.id==='n2_return'),'return last safe start at 05:40');const returnCash=R.state().credits;api.performAction('n2_return');equal(R.state().credits,returnCash+32,'owned two-crate return pays 16 each');equal(R.state().clock,M.parseClock('05:45'),'handover completes at deadline');api.trade.turnIn();equal(R.tradeChoicesResult(),0,'cargo return loss excluded from gold');equal(R.state().cargo.revenue-R.state().cargo.cost,-20,'return loss explicit');
beginSecond('vault');R.visit('market','01:00');api.performAction('n2_nao_start');api.performAction('n2_menu_smoky');api.performAction('n2_buy_market_1');R.visit('market','05:45');check(!R.locationActions().some(a=>a.id==='n2_taste'),'late tasting switches action');api.performAction('n2_taste_late');check(R.state().flags.n2_late,'saved bowl ending');R.visit('landing','05:41');check(!R.locationActions().some(a=>a.id==='n2_return'),'return closes after last safe start');api.trade.turnIn();equal(R.state().cargo.revenue,0,'unserved cargo has no dawn payout');equal(R.tradeChoicesResult(),0,'unserved cargo cost is not gold loss');
beginSecond('order');R.visit('market','01:00');api.performAction('n2_nao_start');api.performAction('n2_menu_plum');api.trade.turnIn();check(!R.state().flags.n2_done,'early rest does not auto-complete recipe');
// New facts and gold events are separate from yesterday's rumour graph.
for(const truth of ['order','vault','both']) {
 beginSecond(truth);R.visit('pier','02:10');equal(!!M.quote(api.trade.data,truth,R.state().seed,'pier',R.state().clock),truth!=='vault','fog desk availability agrees with story');
 api.performAction(truth==='vault'?'n2_pier_check_fog':'n2_pier_check_open');check(R.state().rumors.some(r=>r.id===(truth==='vault'?'n2_pier_fog':'n2_pier_open')),'confirmed desk status recorded');
 R.visit('market','01:00');api.performAction('n2_nao_start');
 for(let i=0,last='';i<12;i++){api.performAction('chat_nao');const text=R.state().lastResult.lines[0].text;check(text!==last,'Night Two casual replies rotate');last=text;}
 equal(api.trade.validate().length,0,'each second-night state validates');
 check(!R.locationActions().some(a=>a.id.startsWith('nb_')||a.id.startsWith('exp_')||a.id==='nm_contract'),'first-night quests absent from second chapter');
}
// Reject malformed optional chapter/cargo data without invalidating older saves.
const chapter=JSON.parse(json(R.state()));
for(const [key,value] of [['crates',3],['cost',-1],['revenue',Infinity],['bought',1],['courier','yes']]){const bad=JSON.parse(json(chapter));bad.cargo[key]=value;check(R.saveProblem(bad)!==null,'malformed cargo rejected: '+key);}
const badMemory=JSON.parse(json(chapter));badMemory.previous.flags.nb_done='yes';check(R.saveProblem(badMemory)!==null,'nonboolean memory rejected');const badChapter=JSON.parse(json(chapter));badChapter.night=3;check(R.saveProblem(badChapter)!==null,'unknown chapter rejected');
api.trade.start('frost-order');check(api.trade.data===T&&R.state().night===undefined,'fresh night resets data and chapter');equal(R.saveProblem(R.state()),null,'legacy shape remains valid');
// Repeatable campaign seeds, courier returns, dawn and current-night gold accounting.
api.trade.start('replay-lanterns');R.visit('bar','01:30');api.trade.turnIn();const replayFirst=JSON.parse(json(R.state()));api.trade.nextNight();const replayTruth=R.state().truth,replaySeed=R.state().seed;R.setState(replayFirst);api.trade.nextNight();equal(R.state().seed,replaySeed,'chapter seed reproducible');equal(R.state().truth,replayTruth,'chapter market truth reproducible');
beginSecond('vault');api.travelTo('market');api.performAction('n2_nao_start');api.travelTo('landing');api.performAction('n2_courier');const returnFeeCash=R.state().credits;api.performAction('n2_return');equal(R.state().credits,returnFeeCash,'co-op return cannot pay owned-stock price');equal(R.state().cargo.returned,1,'co-op returned quantity recorded');check(!R.locationActions().some(a=>a.cargoBuy),'returned cargo does not reopen purchase allowance');
beginSecond('order');R.visit('market','05:55');api.performAction('n2_nao_start');api.performAction('n2_menu_smoky');api.performAction('n2_taste_late');api.performAction('n2_bowl');check(R.state().resolved&&R.state().flags.end_dawn,'meal crossing dawn ends second chapter automatically');equal(R.saveProblem(api.readSave()),null,'automatic chapter ending save valid');equal(R.tradeChoicesResult(),0,'late meal does not appear as gold loss');
beginSecond('both');const goldCash=R.state().credits;check(api.trade.buy(1),'Night Two actual gold buy');check(api.trade.sell(1),'Night Two actual gold sale');const spreadLoss=R.state().credits-goldCash;api.trade.turnIn();equal(R.tradeChoicesResult(),spreadLoss,'Night Two gold stats measure spread rather than carry-over');
// Render the actual new controls and report into a small DOM mock. This checks
// labels/handlers/accounting rows, not visual layout or browser focus behavior.
class TestNode {
 constructor(tag=''){this.tag=tag;this.children=[];this.attrs={};this.events={};this.textContent='';}
 appendChild(child){this.children.push(child);return child;}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(k,fn){this.events[k]=fn;}
 set innerHTML(value){this.children=[];this.textContent=value;}
 get innerHTML(){return '';}
}
context.document.createElement=tag=>new TestNode(tag);
context.document.createTextNode=text=>{const n=new TestNode('#text');n.textContent=text;return n;};
const flatten=n=>[n,...n.children.flatMap(flatten)];
const textOf=n=>flatten(n).map(x=>x.textContent).join(' ');
api.trade.start('frost-order');R.visit('bar','01:30');api.trade.turnIn();
let panel=new TestNode();R.renderTradeActions(panel);let transition=flatten(panel).find(n=>(n.attrs['data-label']||'').startsWith('Continue to Night Two'));
check(transition&&transition.events.click,'resolved controls expose chapter transition');transition.events.click();equal(R.state().night,2,'actual rendered handler starts second chapter');
api.travelTo('market');api.performAction('n2_nao_start');panel=new TestNode();R.renderTradeActions(panel);
check(textOf(panel).includes('Choose smoky mushroom rice')&&textOf(panel).includes('Choose plum & sesame rice'),'both recipe controls rendered');check(textOf(panel).includes('Buy 2 sealed rice crates'),'cargo purchase controls rendered');check(flatten(panel).some(n=>n.tag==='details'&&textOf(n).includes('Recipe & cargo log')),'progress log folded in scrolling action panel');
api.performAction('n2_menu_smoky');api.performAction('n2_buy_market_1');api.performAction('n2_deliver');api.performAction('n2_wait');api.performAction('n2_taste');api.trade.turnIn();
const summary=Object.fromEntries(['resKicker','resTitle','resBody','resStats','btnResContinue','btnResNew'].map(k=>[k,new TestNode()]));R.summaryDom(summary);R.showTradeResolution();check(summary.resKicker.textContent.includes('Night Two'),'morning card identifies chapter');check(textOf(summary.resBody).includes('smoky mushroom'),'morning story reflects recipe');check(textOf(summary.resStats).includes('30 cr returned − 26 cr stock'),'morning report shows exact cargo account');equal(summary.btnResNew.textContent,'Start fresh Night One','chapter ending clearly labels fresh restart');
panel=new TestNode();R.renderTradeActions(panel);const fresh=flatten(panel).find(n=>n.attrs['data-label']==='Start fresh Night One');check(fresh&&fresh.events.click,'fresh restart handler rendered');fresh.events.click();check(R.state().night===undefined&&api.trade.data===T,'fresh restart restores original chapter');
console.log(`Passed ${checks} adventure checks (engine/data; browser layout is checked separately).`);
