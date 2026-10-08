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
for(const name of ['cases.js','trade.js','market.js','dialogue.js'])vm.runInContext(read(name),context,{filename:name});
let engine=read('game.js');
engine=engine.replace('  if (document.readyState === "loading")', `
  window.Review = {newState, newTradeState, setState, locationActions, actionLines, nextCasual, casualActions, conditionHolds, saveProblem, setEndFlags,
    state: () => state, activeCase: () => activeCase,
    visit: (loc, clock) => {state.location=loc;if(clock!==undefined)state.clock=parseClock(clock);},
    readSaved: () => readSave()};
  render = function () {}; renderKeepingFocus = function () {}; focusEncounter = function () {};
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
 // Teo and Dex cannot be chatted to after they leave their quays.
 R.visit('bar','01:20');check(!R.casualActions().some(a=>a.casual==='teo'),'Teo leaves bar at 01:20');
 R.visit('pier','01:29');check(!R.casualActions().some(a=>a.casual==='teo'),'Teo not yet at pier');
 R.visit('pier','01:30');check(R.casualActions().some(a=>a.casual==='teo'),'Teo arrives at pier at 01:30');
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
console.log(`Passed ${checks} adventure checks (engine/data; browser layout is checked separately).`);
