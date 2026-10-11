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
    this.textContent='';this.open=false;this.hidden=false;this.style={};
    const classes=new Set();
    this.classList={add:(...names)=>names.forEach(name=>classes.add(name)),remove:(...names)=>names.forEach(name=>classes.delete(name)),contains:name=>classes.has(name),toggle:(name,on)=>{if(on??!classes.has(name))classes.add(name);else classes.delete(name);}};
  }
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=nodes;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  setAttribute(name,value){this[name]=value;}
  focus(){}
  showModal(){this.open=true;}
  close(){this.open=false;this.listeners.close?.();}
  getBoundingClientRect(){return this.rect||{left:0,top:0,right:1280,bottom:720,width:1280,height:720};}
  getContext(){return new Proxy({measureText:text=>({width:String(text).length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(target,key)=>key in target?target[key]:()=>{}});}
  querySelector(){return this.span||(this.span=new Element('span'));}
}
const walk=node=>[node,...node.children.flatMap(walk)];

function boot(setup=()=>{},options={}) {
  const nodes=new Map(),groups={},documentEvents={};
  const timers=new Map();let timerID=0,elapsed=0,nextFrame;
  for(const [,id]of fs.readFileSync(root+'voyage/index.html','utf8').matchAll(/id="([^"]+)"/g))nodes.set(id,new Element());
  for(const [kind,values]of Object.entries({tab:['people','market','cargo','services'],steer:['up','left','down','right']})) {
    groups['[data-'+kind+']']=values.map(value=>{const node=new Element('button');node.dataset[kind]=value;return node;});
  }
  const saved=new Map([['neon-tides:save:v1','classic-unchanged']]);
  const confirmState={value:true};
  const context=vm.createContext({
    window:{addEventListener(){}},console,devicePixelRatio:1,
    document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag),querySelectorAll:q=>groups[q]||[],addEventListener:(name,fn)=>{documentEvents[name]=fn;},body:new Element(),hidden:false},
    localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
    performance:{now:()=>1000+elapsed},matchMedia:()=>({matches:options.reduced===true}),
    requestAnimationFrame:fn=>{nextFrame=fn;},setTimeout:(fn,ms)=>{timers.set(++timerID,{fn,at:elapsed+ms});return timerID;},clearTimeout:id=>timers.delete(id),setInterval:()=>1,clearInterval(){},
    confirm:()=>confirmState.value,location:{href:''}
  });
  for(const file of ['trade.js','market.js','voyage/world-map.js','voyage/navigation.js','voyage/ports.js','voyage/model.js','voyage/profile.js','halloween-radio.js','voyage/sound.js','voyage/camera.js','voyage/harbour-art.js']) {
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
  const advance=ms=>{const end=elapsed+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;timers.delete(due[0]);elapsed=due[1].at;due[1].fn();}elapsed=end;};
  const key=(key,editing=false)=>documentEvents.keydown({key,repeat:false,target:{closest:()=>editing},preventDefault(){}});
  return {nodes,groups,saved,find,click,person,current,confirmState,advance,key,frame:now=>nextFrame(now),course:context.window.NeonVoyage.course};
}

// Assisted arrival: a brief notice leaves docking enabled and clears on mooring.
for(const mobile of [false,true]) {
  const r=boot(({state,moor})=>{moor('market');state.docked=null;state.ship.x-=24;});
  const rect=(width,top,bottom)=>({left:0,right:width,width,top,bottom,height:bottom-top});
  const width=mobile?390:1280;
  r.nodes.get('sea').rect=rect(width,76,796);
  r.nodes.get('sailing-top').rect=rect(width,90,230);
  r.nodes.get('sailing-bottom').rect=rect(width,mobile?656:714,780);
  r.nodes.get('touch-pad').rect=rect(width,688,776);
  r.nodes.get('port').rect={left:820,top:96,right:1260,bottom:780,width:440,height:684};
  r.course('market');
  r.advance(1100);check(r.nodes.get('toast').classList.contains('show'),'longer sailing instructions remain readable');
  let now=1000;
  while(!r.nodes.get('toast').textContent.startsWith('Course complete')&&now<20000){now+=16;r.frame(now);}
  check(r.nodes.get('toast').textContent.startsWith('Course complete'),'assisted course reaches the quay');
  check(!r.nodes.get('dock-button').disabled,'Dock is enabled immediately on route completion');
  equal(r.nodes.get('toast').style.bottom,mobile?'152px':'94px','notice sits above measured sailing and touch controls');
  r.advance(999);check(r.nodes.get('toast').classList.contains('show'),'arrival is briefly visible');
  r.advance(1);check(!r.nodes.get('toast').classList.contains('show'),'course notice disappears after one second');
  r.course('market');r.frame(now+16);
  check(r.nodes.get('toast').classList.contains('show'),'a new arrival can show fresh feedback');
  r.click(r.nodes.get('dock-button'));
  equal(r.current().docked,'market','the captain can dock immediately');
  check(!r.nodes.get('toast').classList.contains('show'),'docking dismisses the notice');
  check(!r.nodes.get('panel').open,'arrival does not open a modal');
  check(r.nodes.get('arrival-title').textContent.startsWith('Docked at '),'arrival explains that mooring is complete');
  equal(r.nodes.get('arrival-countdown').textContent,'Closes in 6 s','arrival announces its auto-close time');
  const arrivalClock=r.current().clock,arrivalPurse=r.current().credits;
  r.advance(1000);
  equal(r.nodes.get('arrival-countdown').textContent,'Closes in 5 s','arrival counts down each second');
  r.groups['[data-tab]'][1].onclick();
  check(r.find('port-content','You pay to buy'),'Market remains usable while arrival is visible');
  r.advance(4999);check(!r.nodes.get('arrival-card').hidden,'arrival stays available for all six seconds');
  r.advance(1);check(r.nodes.get('arrival-card').hidden,'arrival automatically closes after six seconds');
  equal(r.current().clock,arrivalClock,'arrival countdown and tab changes spend no voyage time');
  equal(r.current().credits,arrivalPurse,'arrival countdown spends no credits');
}

// First launch leaves the harbour usable; help is deliberately opened through Menu.
const start=boot(()=>{},{welcome:true});
check(!start.nodes.get('panel').open,'first voyage never forces a welcome modal');
check(start.find('port-content','Mei has a small courier job'),'first crossing remains an optional dockside hint');
start.key('m',true);
check(!start.nodes.get('panel').open,'typing M in a text field does not open the menu');
start.key('m');
check(start.find('panel-content','Ferry tools'),'M deliberately opens the menu while docked');
start.click(start.find('panel-content','How to play'));
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

const legacyIntro=boot(({state})=>{delete state.flags.continuitySeen;state.credits=127;state.fuel=2;});
check(!legacyIntro.nodes.get('panel').open,'older saves do not force an old release announcement');
equal(legacyIntro.current().credits,127,'removing old announcements preserves the purse');
equal(legacyIntro.current().fuel,2,'removing old announcements preserves fuel');

// Dismissal and departure cancel the timer; a new arrival receives its own full timer.
for(const reduced of [false,true]) {
  const r=boot(({state,moor})=>{moor('market');state.docked=null;},{reduced});
  r.click(r.nodes.get('dock-button'));r.advance(2000);
  equal(r.nodes.get('arrival-countdown').textContent,'Closes in 4 s','reduced motion keeps the full reading time too');
  r.click(r.nodes.get('arrival-dismiss'));
  check(r.nodes.get('arrival-card').hidden,'Dismiss closes the arrival immediately');
  r.click(r.nodes.get('depart-button'));
  check(r.nodes.get('arrival-card').hidden,'casting off leaves no arrival card');
  r.click(r.nodes.get('dock-button'));
  equal(r.nodes.get('arrival-countdown').textContent,'Closes in 6 s','redocking starts a fresh countdown');
  r.advance(4000);
  check(!r.nodes.get('arrival-card').hidden,'the previous arrival cannot close a later card');
  r.click(r.nodes.get('tools-button'));
  check(r.nodes.get('arrival-card').hidden,'opening a menu dismisses the arrival');
  r.advance(2000);
  check(r.nodes.get('panel').open,'arrival timer never dismisses the menu');
}

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
check(corrupt.nodes.get('toast').textContent.includes('That voyage save could not be read'),'invalid save has a visible recovery notice');
check(!corrupt.nodes.get('panel').open,'save recovery does not force the welcome guide');
equal(corrupt.current().clock,1420,'invalid save starts a usable voyage');
check(JSON.parse(corrupt.saved.get(KEY+':unreadable')).finds.toString==='read','original corrupt save kept for possible recovery');
equal(corrupt.saved.get('neon-tides:save:v1'),'classic-unchanged','corrupt Voyage save leaves Classic intact');
corrupt.advance(8000);corrupt.nodes.get('tools-button').onclick();
check(corrupt.find('panel-content','That voyage save could not be read'),'recovery information remains available in the menu');

const corruptJson=boot(()=>{},{rawSave:'{unfinished-json'});
equal(corruptJson.saved.get(KEY+':unreadable'),'{unfinished-json','unreadable JSON retained before replacement');
check(corruptJson.nodes.get('toast').textContent.includes('That voyage save could not be read'),'JSON failure gives a recovery notice');
const corruptProfile=boot(({saved})=>saved.set(PROFILE,'{unfinished-history'));
equal(corruptProfile.saved.get(PROFILE+':unreadable'),'{unfinished-history','unreadable history retained before reset');
check(corruptProfile.nodes.get('toast').textContent.includes('unreadable captain history'),'history parse failure is visible to player');

const invalidProfileValue=boot(({saved})=>saved.set(PROFILE,'false'));
equal(invalidProfileValue.saved.get(PROFILE+':unreadable'),'false','invalid falsy history is retained too');
check(invalidProfileValue.nodes.get('toast').textContent.includes('unreadable captain history'),'invalid falsy history gives a notice');

console.log(`Passed ${checks} Voyage DOM integration checks (browser layout is not covered).`);
