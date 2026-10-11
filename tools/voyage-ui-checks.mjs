/* Headless DOM integration checks. No dependencies; this does not test CSS or real browser layout. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const KEY='neon-tides:voyage:v1', PROFILE='neon-tides:voyage:profile:v1';
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const equal=(actual,expected,message)=>{assert.equal(actual,expected,message);checks++;};

class Element {
  constructor(tag='div') {
    this.tagName=tag;this.children=[];this.dataset={};this.listeners={};
    this.textContent='';this.open=false;this.hidden=false;
    this.classList={add(){},remove(){},toggle(){}};
  }
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  setAttribute(name,value){this[name]=value;}
  focus(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.listeners.close?.();}
  getBoundingClientRect(){return {left:0,top:0,right:1280,bottom:720,width:1280,height:720};}
  getContext(){return {};}
  querySelector(){return this.span||(this.span=new Element('span'));}
}
const walk=node=>[node,...node.children.flatMap(walk)];

function boot(setup=()=>{},options={}) {
  const nodes=new Map(),groups={};
  for(const [,id]of fs.readFileSync(root+'voyage/index.html','utf8').matchAll(/id="([^"]+)"/g))nodes.set(id,new Element());
  for(const [kind,values]of Object.entries({tab:['people','market','cargo','services'],steer:['up','left','down','right']})) {
    groups['[data-'+kind+']']=values.map(value=>{const node=new Element('button');node.dataset[kind]=value;return node;});
  }
  const saved=new Map([['neon-tides:save:v1','classic-unchanged']]);
  const confirmState={value:true};
  const context=vm.createContext({
    window:{addEventListener(){}},console,devicePixelRatio:1,
    document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),querySelectorAll:q=>groups[q]||[],addEventListener(){},body:new Element(),hidden:false},
    localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
    performance:{now:()=>1000},matchMedia:()=>({matches:false}),
    requestAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},
    confirm:()=>confirmState.value,location:{href:''}
  });
  for(const file of ['trade.js','market.js','voyage/world-map.js','voyage/navigation.js','voyage/ports.js','voyage/model.js','voyage/profile.js','halloween-radio.js','voyage/sound.js','voyage/camera.js']) {
    vm.runInContext(fs.readFileSync(root+file,'utf8'),context,{filename:file});
  }
  const {VoyageModel:M,VoyageWorld:W,VoyageProfile:Pr,VoyagePorts:P}=context.window;
  const state=M.create('ui-audit');
  if(!options.welcome)Object.assign(state.flags,{welcome:true,continuitySeen:true});
  const moor=id=>{const port=W.ports.find(p=>p.id===id);state.docked=id;state.ship={x:port.x,y:port.y,angle:0,speed:0};};
  setup({state,M,P,Pr,saved,moor});
  saved.set(KEY,options.rawSave??JSON.stringify(state));
  vm.runInContext(fs.readFileSync(root+'voyage/voyage.js','utf8'),context,{filename:'voyage/voyage.js'});
  const find=(id,label)=>walk(nodes.get(id)).find(n=>n.textContent.startsWith(label));
  const click=node=>{check(!!node,'control exists');check(!node.disabled,'control is enabled');(node.listeners.click||node.onclick)();};
  const person=name=>click(walk(nodes.get('port-content')).find(n=>n.className==='person'&&n.children[1].children[0].textContent===name));
  const current=()=>context.window.NeonVoyage.getState();
  return {nodes,groups,saved,find,click,person,current,confirmState};
}

// First launch provides one concrete next action, and help remains available later.
const start=boot(()=>{},{welcome:true});
check(start.nodes.get('panel').open,'first voyage opens help');
check(start.find('panel-content','A good first crossing'),'onboarding focuses on the first route');
start.click(start.find('panel-content','Talk to Mei'));
check(!start.nodes.get('panel').open,'Mei shortcut closes help');
check(start.find('port-content','Collect Nao’s tea'),'Mei offers first courier action');
equal(start.current().clock,1420,'opening dialogue is free');
start.click(start.find('port-content','Collect Nao’s tea'));
start.nodes.get('journal-button').onclick();
const headings=walk(start.nodes.get('panel-content')).filter(n=>n.tagName==='h3').map(n=>n.textContent);
equal(headings[0],'Active stories','journal prioritises ongoing quests before planning and records');
check(start.find('panel-content','Preview next quay'),'active story offers a direct destination preview');
check(walk(start.nodes.get('panel-content')).some(n=>n.tagName==='details'&&n.children[0]?.textContent==='Cargo route planner'),'detailed planning is folded until requested');
start.nodes.get('panel-close').onclick();
start.nodes.get('tools-button').onclick();
start.click(start.find('panel-content','How to play'));
check(start.find('panel-content','Welcome aboard'),'help can be reopened');
equal(start.saved.get('neon-tides:save:v1'),'classic-unchanged','startup preserves Classic save');

// Full hold explains the reason before a player tries to accept another case.
const full=boot(({state})=>{state.flags.lampAccepted=true;state.cargo.bowls={cost:20,revenue:0,units:1};});
full.person('Mei Kusanagi');
const collect=full.find('port-content','Collect Nao’s tea');
check(collect.disabled&&collect.textContent.includes('Hold is full'),'courier button visibly explains shared capacity');

// Expired couriers can be closed from Cargo and Journal, with correct outcome labels.
const expired=boot(({state,moor})=>{moor('metro');state.clock=1741;state.flags.teaAccepted=true;state.flags.lampAccepted=true;});
expired.groups['[data-tab]'][2].onclick();
expired.click(expired.find('port-content','Unload expired tea case'));
check(expired.current().flags.teaClosed,'cargo control closes tea');
expired.nodes.get('journal-button').onclick();
expired.click(expired.find('panel-content','Unload expired lighthouse kit'));
check(expired.current().flags.lampClosed,'journal control closes lighthouse kit');
equal(expired.current().credits,360,'unloading pays nothing');
check(expired.find('panel-content','Closed · Mei'),'closed tea is not described as successfully completed');
check(expired.find('panel-content','Closed · Aki'),'closed lighthouse story is not described as completed');

// Buttons and model share dawn budgets, and exact-dawn completion keeps the ending panel.
const late=boot(({state})=>{state.clock=1798;});
late.person('Mei Kusanagi');
for(const title of ['Mei’s sunrise rice','Mei’s ginger noodles']) {
  const meal=late.find('port-content',title);
  check(meal.disabled&&meal.textContent.includes('before 06:00'),'late food control explains insufficient time');
}
equal(late.current().credits,360,'reading late dialogue never charges');
const exact=boot(({state})=>{state.clock=1788;});
exact.person('Mei Kusanagi');
exact.click(exact.find('port-content','Mei’s ginger noodles'));
check(exact.current().ended,'full meal ends exactly at dawn');
equal(exact.current().credits,353,'exact-dawn meal charges its full listed price');
check(exact.find('panel-content','The morning harbour wire'),'story callback cannot replace the ending');
check(JSON.parse(exact.saved.get(PROFILE)).history[0].accounting.reconciled,'ending keeps a reconciled ledger');

// Recovery confirmation cancellation preserves the tools panel; final-minute recovery shows the report.
const tow=boot(({state,M})=>{M.depart(state);state.clock=1798;state.fuel=0;});
tow.nodes.get('tools-button').onclick();
tow.confirmState.value=false;
tow.click(tow.find('panel-content','Call harbour tug · 2 min'));
check(tow.nodes.get('panel').open&&tow.find('panel-content','Ferry tools'),'cancelled tug keeps its previous panel');
equal(tow.current().clock,1798,'cancelled recovery costs no time');
tow.confirmState.value=true;
tow.click(tow.find('panel-content','Call harbour tug · 2 min'));
equal(tow.current().docked,'landing','late tug reaches the landing');
check(tow.find('panel-content','The morning harbour wire'),'late recovery keeps its ending visible');

// Current quest reactions come before historical memories, and memory greetings still hear rumours.
const memory=boot(({state,Pr,saved,moor})=>{
  moor('market');state.clock=1500;state.flags.teaAccepted=true;state.flags.teaDelivered=true;
  const profile=Pr.create();profile.memories={nao:['festival','visit'],sora:['visit']};saved.set(PROFILE,JSON.stringify(profile));
});
memory.person('Nao Mizuno');
check(memory.current().flags.naoThanks,'new tea delivery reaction has priority');
check(!memory.current().flags['remember-nao-festival'],'old festival memory waits for the current reaction');
memory.click(memory.find('port-content','Keep chatting'));
check(memory.current().flags['remember-nao-festival'],'next conversation can recall an earlier festival');
equal(memory.current().chats.nao||0,0,'remembering does not discard an introductory line');
memory.click(memory.find('port-content','Back to people'));
memory.person('Sora Ember');
check(memory.current().flags['remember-sora-visit'],'Sora remembers an earlier visit');
equal(memory.current().rumours.crews,1500,'memory greeting still hears available trading news');

// Travelling prices displayed in UI agree with the generation-specific price actually charged.
for(const legacy of [false,true]) {
  const tray=boot(({state,M,P})=>{if(legacy)delete state.encounterVersion;M.depart(state);const point=P.waterMeetings.trader;state.ship={x:point.x,y:point.y,angle:0,speed:0};});
  tray.nodes.get('meeting-button').onclick();
  const price=legacy?46:86;
  const purchase=tray.find('panel-content','Buy 1 g gold · '+price+' cr');
  tray.click(purchase);
  equal(tray.current().credits,360-price,'travelling UI and actual price agree');
}

// Changing comparison quantity reflects bulk margins without trading or spending time.
const bulk=boot(({state,M,moor})=>{moor('landing');M.observe(state);moor('bar');});
const bulkBefore=JSON.stringify(bulk.current());
bulk.nodes.get('journal-button').onclick();
bulk.click(bulk.find('panel-content','Trading overview'));
check(bulk.find('panel-content','1 g gold →'),'single-gram comparison is available');
const quantity=walk(bulk.nodes.get('panel-content')).find(n=>n.tagName==='select');
quantity.value='3';quantity.listeners.change();
check(bulk.find('panel-content','3 g gold →'),'three-gram comparison updates the opportunity');
equal(JSON.stringify(bulk.current()),bulkBefore,'quantity selection is free and read-only');

// A corrupt save fails safely before any scene or history tries to render it.
const corrupt=boot(({state})=>{state.finds={toString:'read'};});
check(corrupt.find('panel-content','That voyage save could not be read'),'invalid save has a visible recovery notice');
equal(corrupt.current().clock,1420,'invalid save starts a usable voyage');
check(JSON.parse(corrupt.saved.get(KEY+':unreadable')).finds.toString==='read','original corrupt save kept for possible recovery');
equal(corrupt.saved.get('neon-tides:save:v1'),'classic-unchanged','corrupt Voyage save leaves Classic intact');

const corruptJson=boot(()=>{},{rawSave:'{unfinished-json'});
equal(corruptJson.saved.get(KEY+':unreadable'),'{unfinished-json','unreadable JSON retained before replacement');
check(corruptJson.find('panel-content','That voyage save could not be read'),'JSON failure gives a recovery notice');
const corruptProfile=boot(({saved})=>saved.set(PROFILE,'{unfinished-history'));
equal(corruptProfile.saved.get(PROFILE+':unreadable'),'{unfinished-history','unreadable history retained before reset');
check(corruptProfile.nodes.get('toast').textContent.includes('unreadable captain history'),'history parse failure is visible to player');

const invalidProfileValue=boot(({saved})=>saved.set(PROFILE,'false'));
equal(invalidProfileValue.saved.get(PROFILE+':unreadable'),'false','invalid falsy history is retained too');
check(invalidProfileValue.nodes.get('toast').textContent.includes('unreadable captain history'),'invalid falsy history gives a notice');

console.log(`Passed ${checks} Voyage DOM integration checks (browser layout is not covered).`);
