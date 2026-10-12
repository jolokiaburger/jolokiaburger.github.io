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
  constructor(tag='div',canvasFactory=null) {
    this.canvasFactory=canvasFactory;
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
  get width(){return this._width||0;} set width(value){this._width=value;if(this.native)this.native.width=value;}
  get height(){return this._height||0;} set height(value){this._height=value;if(this.native)this.native.height=value;}
  toDataURL(...args){return this.native?this.native.toDataURL(...args):'data:image/webp;base64,AQIDBA==';}
  getContext(){if(this.canvasFactory){if(!this.native)this.native=this.canvasFactory(this.width||1280,this.height||720);return this.native.getContext('2d');}return new Proxy({measureText:text=>({width:String(text).length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(target,key)=>key in target?target[key]:()=>{}});}
  querySelector(){return this.span||(this.span=new Element('span'));}
}
const walk=node=>[node,...node.children.flatMap(walk)];

export function boot(setup=()=>{},options={}) {
  const nodes=new Map(),groups={},documentEvents={};
  const timers=new Map();let timerID=0,elapsed=0,nextFrame;
  for(const [,id]of fs.readFileSync(root+'voyage/index.html','utf8').matchAll(/id="([^"]+)"/g))nodes.set(id,new Element(id==='sea'?'canvas':'div',id==='sea'?options.canvasFactory:null));
  for(const [kind,values]of Object.entries({tab:['people','market','cargo','services'],steer:['up','left','down','right']})) {
    groups['[data-'+kind+']']=values.map(value=>{const node=new Element('button');node.dataset[kind]=value;return node;});
  }
  const saved=new Map([['neon-tides:save:v1','classic-unchanged']]);
  const confirmState={value:true};
  const context=vm.createContext({
    window:{addEventListener(){}},console,devicePixelRatio:1,
    document:{getElementById:id=>nodes.get(id),createElement:tag=>new Element(tag,tag==='canvas'?options.canvasFactory:null),querySelectorAll:q=>groups[q]||[],addEventListener:(name,fn)=>{documentEvents[name]=fn;},body:new Element(),hidden:false},
    localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
    performance:{now:()=>1000+elapsed},matchMedia:()=>({matches:options.reduced===true}),
    requestAnimationFrame:fn=>{nextFrame=fn;},setTimeout:(fn,ms)=>{timers.set(++timerID,{fn,at:elapsed+ms});return timerID;},clearTimeout:id=>timers.delete(id),setInterval:()=>1,clearInterval(){},
    confirm:()=>confirmState.value,location:{href:''}
  });
  for(const file of ['trade.js','market.js','voyage/world-map.js','voyage/regions.js','voyage/navigation.js','voyage/ports.js','voyage/model.js','voyage/leisure.js','voyage/neighbours.js','voyage/conversations.js','voyage/breakwater.js','voyage/travel-plan.js','voyage/profile.js','voyage/leisure-profile.js','voyage/neighbours-profile.js','voyage/breakwater-profile.js','voyage/leisure-ui.js','voyage/neighbours-ui.js','voyage/breakwater-ui.js','halloween-radio.js','voyage/sound.js','voyage/camera.js','voyage/sea-boundary.js','voyage/harbour-art.js','voyage/coast-art.js']) {
    vm.runInContext(fs.readFileSync(root+file,'utf8'),context,{filename:file});
  }
  const {VoyageModel:M,VoyageWorld:W,VoyageProfile:Pr,VoyagePorts:P,VoyageLeisure:L,VoyageNeighbours:H,VoyageConversations:C,VoyageNavigation:N,VoyageBreakwater:B,VoyageRegions:R}=context.window;
  const state=M.create('ui-audit');
  if(!options.welcome)Object.assign(state.flags,{welcome:true,continuitySeen:true});
  const moor=id=>{const port=W.ports.find(p=>p.id===id);state.docked=id;state.ship={x:port.x,y:port.y,angle:0,speed:0};};
  setup({state,M,P,Pr,L,H,C,N,B,R,saved,moor});
  saved.set(KEY,options.rawSave??JSON.stringify(state));
  vm.runInContext(fs.readFileSync(root+'voyage/voyage.js','utf8'),context,{filename:'voyage/voyage.js'});
  const find=(id,label)=>walk(nodes.get(id)).find(n=>n.textContent.startsWith(label));
  const click=node=>{check(!!node,'control exists');check(!node.disabled,'control is enabled');(node.listeners.click||node.onclick)();};
  const person=name=>click(walk(nodes.get('port-content')).find(n=>n.className==='person'&&n.children[1].children[0].textContent===name));
  const current=()=>context.window.NeonVoyage.getState();
  const advance=ms=>{const end=elapsed+ms;for(;;){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;timers.delete(due[0]);elapsed=due[1].at;due[1].fn();}elapsed=end;};
  const key=(key,editing=false)=>documentEvents.keydown({key,repeat:false,target:{closest:()=>editing},preventDefault(){}});
  return {context,expedition:context.window.NeonVoyage.expedition,neighbours:context.window.NeonVoyage.neighbours,pastimes:context.window.NeonVoyage.pastimes,nodes,groups,saved,find,click,person,current,confirmState,advance,key,frame:now=>nextFrame(now),course:context.window.NeonVoyage.course};
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

// 0.15: deliberately opened activities use real model boundaries and save callbacks.
const fishUI=boot();
fishUI.click(fishUI.nodes.get('tools-button'));
fishUI.click(fishUI.find('panel-content','Harbour pastimes'));
fishUI.click(fishUI.find('panel-content','Dockside fishing'));
fishUI.click(fishUI.find('panel-content','Cast the line'));
equal(fishUI.current().clock,1420,'casting waits without spending game time');
check(fishUI.find('panel-content','Waiting for a bite').disabled,'reel waits for float');
fishUI.advance(2199);check(fishUI.find('panel-content','Waiting for a bite').disabled,'bite boundary is not early');
fishUI.advance(1);fishUI.click(fishUI.find('panel-content','Reel in'));
equal(fishUI.current().leisure.fishing.casts,1,'UI lands one catch');
equal(fishUI.current().clock,1424,'UI charges advertised four minutes');
fishUI.click(fishUI.find('panel-content','Another cast'));
fishUI.click(fishUI.find('panel-content','Cast the line'));
fishUI.click(fishUI.nodes.get('panel-close'));fishUI.click(fishUI.nodes.get('tools-button'));fishUI.advance(8000);
equal(fishUI.current().leisure.fishing.casts,1,'closed activity has no late catch callback');
equal(fishUI.nodes.get('panel-content').children[0].textContent,'Ferry tools','bite callback cannot replace Menu');
const savedPending=JSON.parse(fishUI.saved.get(KEY));check(!!savedPending.leisure.fishing.pending,'pending line is saved');
const resumedFish=boot(()=>{}, {rawSave:JSON.stringify(savedPending)});
check(!resumedFish.nodes.get('panel').open,'pending line does not force a panel on reload');
resumedFish.pastimes.fishing();resumedFish.advance(2200);resumedFish.click(resumedFish.find('panel-content','Reel in'));
equal(resumedFish.current().leisure.fishing.casts,2,'saved cast resumes exactly once');
const relaxedFish=boot(()=>{}, {reduced:true});relaxedFish.pastimes.fishing();
relaxedFish.click(relaxedFish.find('panel-content','Relaxed mode'));
relaxedFish.click(relaxedFish.find('panel-content','Cast the line'));relaxedFish.advance(2200);
equal(relaxedFish.current().leisure.fishing.casts,1,'relaxed mode reels automatically without rapid tapping');
equal(relaxedFish.current().leisure.fishing.relaxed,true,'relaxed setting saved');

const kitchenUI=boot(({moor})=>moor('market'));kitchenUI.pastimes.kitchen();
check(!kitchenUI.find('panel-content','Serve the tray').disabled,'first tray available');
kitchenUI.click(kitchenUI.find('panel-content','Serve the tray'));
equal(kitchenUI.current().leisure.kitchen.length,1,'first kitchen customer settled');
equal(kitchenUI.current().credits,366,'default tray matches Priya and pays once');
kitchenUI.click(kitchenUI.find('panel-content','Next customer'));
for(const choice of ['Ginger broth','Roasted mushrooms','Black tea'])kitchenUI.click(kitchenUI.find('panel-content',choice));
check(kitchenUI.find('panel-content','Black tea')['aria-pressed']==='true','selected tea visibly pressed');
kitchenUI.click(kitchenUI.find('panel-content','Serve the tray'));kitchenUI.click(kitchenUI.find('panel-content','Next customer'));
for(const choice of ['Spring greens','Jasmine tea'])kitchenUI.click(kitchenUI.find('panel-content',choice));
kitchenUI.click(kitchenUI.find('panel-content','Serve the tray'));kitchenUI.click(kitchenUI.find('panel-content','Finish the shift'));
equal(kitchenUI.current().credits,378,'all favourite trays produce advertised total');
const kitchenProfile=JSON.parse(kitchenUI.saved.get(PROFILE));check(kitchenProfile.charms.includes('cup'),'earned kitchen decoration saved immediately');
kitchenUI.click(kitchenUI.find('panel-content','Ferry decorations'));kitchenUI.click(kitchenUI.find('panel-content','Little tea cup'));
equal(JSON.parse(kitchenUI.saved.get(PROFILE)).look.charm,'cup','earned charm can be equipped');

const photoUI=boot(({state,moor,L})=>{moor('metro');L.acceptPhotos(state,'yumi');moor('market');state.docked=null;state.ship.x-=30;});
check(!photoUI.nodes.get('photo-button').hidden,'camera action appears only beside accepted view');
photoUI.click(photoUI.nodes.get('photo-button'));photoUI.click(photoUI.find('panel-content','Closer view'));photoUI.click(photoUI.find('panel-content','Take photograph'));
equal(photoUI.current().leisure.photos.shots.length,1,'camera records one view');equal(photoUI.current().leisure.photos.shots[0].frame,'close','framing choice is retained');
equal(photoUI.current().clock,1422,'camera charges two minutes');
check(photoUI.nodes.get('photo-button').hidden,'completed view no longer advertises capture');
equal(JSON.parse(photoUI.saved.get(PROFILE)).album.length,1,'actual thumbnail path reaches profile save');
photoUI.click(photoUI.nodes.get('panel-close'));photoUI.frame(1200);
const photoReload=boot(()=>{}, {rawSave:photoUI.saved.get(KEY)});check(photoReload.nodes.get('photo-button').hidden,'completed photo remains complete after reload');
const requestUI=boot(({moor})=>moor('observatory'));requestUI.pastimes.album();
const requestControls=walk(requestUI.nodes.get('panel-content')).filter(n=>n.tagName==='button'&&n.textContent.startsWith('Accept photo errand'));
check(requestControls[0].disabled&&!requestControls[1].disabled,'requests explain their physical meeting place through availability');requestUI.click(requestControls[1]);
equal(requestUI.current().leisure.photos.accepted[0],'mio','Mio request accepted through album');

for(const quay of ['bar','market','canal']){
 const view=boot(({moor})=>moor(quay));view.click(view.find('port-content','Take a closer dockside seat'));
 const art=walk(view.nodes.get('panel-content')).find(n=>n.className==='dockside-art');
 check(!!art?.src&&fs.existsSync(root+'voyage/'+art.src),'close view uses a shipped scene');
 check(!!view.find('panel-content','Chat with'),'close view includes functional conversation');view.click(view.find('panel-content','Chat with'));
 check(!view.nodes.get('panel').open,'conversation returns to the port');check(!!view.find('port-content','Keep chatting'),'close view opens the correct character controls');
}
const journeyUI=boot(({state,moor,M})=>{moor('bar');M.action(state,'accept-tea');state.docked=null;state.voyage={distance:0,from:'bar',to:'market',line:{speaker:'Captain',text:'Crossing'}};});
const journeyText=walk(journeyUI.nodes.get('journey-strip')).map(n=>n.textContent).join(' ');
check(journeyText.includes('Next')&&journeyText.includes('ETA')&&journeyText.includes('fuel')&&journeyText.includes('Handover by'),'journey strip brings route, fuel and deadline together');
equal(journeyUI.saved.get('neon-tides:save:v1'),'classic-unchanged','new activity integration preserves Classic save');
const fuelUI=boot(({state,moor,M})=>{M.action(state,'accept-tea');moor('landing');state.docked=null;state.fuel=.1;state.voyage={distance:0,from:'bar',to:'market',line:{speaker:'Captain',text:'Crossing'}};});
fuelUI.click(fuelUI.find('journey-strip','Set course to Landing 3 fuel pump'));equal(fuelUI.current().voyage.to,'landing','fuel-strip shortcut sets a course to the reachable pump');

// 0.16: conversations remain in the quay; topics and choices remember learning without charging.
const topicsUI=boot();
topicsUI.person('Mei Kusanagi');
const topicDetails=walk(topicsUI.nodes.get('port-content')).find(n=>n.className==='conversation-topics');
check(topicDetails,'inline conversation topic section exists');equal(topicDetails.open,false,'topic section opens only by choice');
topicDetails.open=true;
const topicClock=topicsUI.current().clock,topicPurse=topicsUI.current().credits;
topicsUI.click(topicsUI.find('port-content','How would you cook a harbour catch?'));
check(!topicsUI.nodes.get('panel').open,'reading a dockside topic does not open a modal');
check(topicsUI.current().neighbours.learned.includes('lantern'),'topic learns the actual recipe');
equal(topicsUI.current().clock,topicClock,'topic reading pauses clock');equal(topicsUI.current().credits,topicPurse,'topic reading free');
topicsUI.click(topicsUI.find('port-content','“I’ll write down your lantern catch bowl.'));
equal(topicsUI.current().neighbours.replies['mei-broth'],'learn','chosen full reply saved');
check(walk(topicsUI.nodes.get('port-content')).some(n=>n.className==='npc-reply'&&!n.hidden&&n.textContent.includes('leave a line')),'NPC gives the matching reply');
check(JSON.parse(topicsUI.saved.get(PROFILE)).neighbours.facts.includes('mei-broth'),'attributed knowledge persists in profile');
check(!topicsUI.nodes.get('port-back').hidden,'fixed person Back is visible');
topicsUI.click(topicsUI.nodes.get('port-back'));equal(topicsUI.nodes.get('port-back').hidden,true,'fixed Back returns to people');

// Scroll positions are distinct per quay/tab/person and survive a return visit.
const scrollUI=boot();scrollUI.nodes.get('port-content').scrollTop=144;
scrollUI.click(scrollUI.groups['[data-tab]'].find(n=>n.dataset.tab==='market'));equal(scrollUI.nodes.get('port-content').scrollTop,0,'new tab begins at top');
scrollUI.nodes.get('port-content').scrollTop=33;scrollUI.click(scrollUI.groups['[data-tab]'].find(n=>n.dataset.tab==='people'));
equal(scrollUI.nodes.get('port-content').scrollTop,144,'return restores People scroll');
scrollUI.click(scrollUI.groups['[data-tab]'].find(n=>n.dataset.tab==='market'));equal(scrollUI.nodes.get('port-content').scrollTop,33,'return restores Market scroll');

// New fare terms and optional route choice go through actual visible callbacks.
const boardUI=boot(({state,moor,M})=>{moor('landing');M.advance(state,70);});
boardUI.neighbours.trip('priya');boardUI.click(boardUI.find('panel-content','Offer a direct crossing'));
equal(boardUI.current().neighbours.rides.priya.stage,'aboard','fare boarding callback works');
boardUI.click(boardUI.find('panel-content','Suggest a thermos stop instead'));
equal(boardUI.current().neighbours.rides.priya.route,'tea','route dialogue choice changes tracked route');
check(boardUI.current().track==='ride-priya','passenger objective tracked');
check(!boardUI.nodes.get('panel-back').hidden,'fixed modal Back available');
boardUI.click(boardUI.nodes.get('panel-back'));check(boardUI.find('panel-content','Passenger trips · People across the water'),'fixed Back follows actual panel action');
boardUI.click(boardUI.nodes.get('panel-close'));boardUI.person('Priya Gale');
check(walk(boardUI.nodes.get('port-content')).some(n=>n.textContent.includes('Aboard the Tern')),'passenger role shows actual aboard status');

const fareUI=boot(({state,moor,H,M})=>{moor('landing');M.advance(state,70);H.ride(state,'priya','board','tea');moor('metro');state.docked=null;state.ship.x-=20;});
const beforeFare=fareUI.current().credits;fareUI.click(fareUI.nodes.get('dock-button'));
equal(fareUI.current().credits,beforeFare,'docking does not automatically pay the new fare');
fareUI.neighbours.trip('priya');fareUI.click(fareUI.find('panel-content','Disembark at Metro Quay'));
equal(fareUI.current().credits,beforeFare+18,'explicit destination control pays promised fare');
equal(fareUI.current().neighbours.rides.priya.stage,'done','fare completed through actual UI');
check(JSON.parse(fareUI.saved.get(PROFILE)).charms.includes('ticket'),'earned ticket persisted');
equal(fareUI.saved.get('neon-tides:save:v1'),'classic-unchanged','passenger UI leaves Classic save alone');

// Recipe ingredients remain a free draft until a full, explicit serving.
const recipeUI=boot(({state,moor,C,L})=>{C.read(state,'mei','mei-broth');L.cast(state);L.reel(state);moor('market');});
recipeUI.neighbours.recipe('lantern');const recipeClock=recipeUI.current().clock,recipeCash=recipeUI.current().credits;
check(recipeUI.find('panel-content','Place all ingredients before serving').disabled,'unfinished tray cannot be served');
for(const label of ['Gentle miso','Spring greens','Roasted tea'])recipeUI.click(recipeUI.find('panel-content',label));
equal(recipeUI.current().clock,recipeClock,'draft ingredient choices cost no time');equal(recipeUI.current().credits,recipeCash,'draft ingredient choices free');
check(recipeUI.find('panel-content','Place all ingredients before serving').disabled,'fish recipe needs an explicit catch');
const fishName=recipeUI.context.window.VoyageLeisure.fish[recipeUI.current().leisure.fishing.catches[0].id].name;
recipeUI.click(recipeUI.find('panel-content',fishName));recipeUI.click(recipeUI.find('panel-content','Share the bowl'));
equal(recipeUI.current().clock,recipeClock+6,'serving costs full six minutes');
equal(recipeUI.current().leisure.fishing.catches[0].outcome,'cooked','serving consumes selected kept fish');
check(recipeUI.current().neighbours.recipes[0].matched,'assembled recipe matches authored dish');
equal(recipeUI.current().credits,recipeCash,'recipe serving free');
const draftUI=boot(({state,moor,C})=>{moor('canal');C.read(state,'jun','jun-garden');moor('market');});
draftUI.neighbours.recipe('garden');const draftClock=draftUI.current().clock;
draftUI.click(draftUI.find('panel-content','Gentle miso'));draftUI.click(draftUI.find('panel-content','Leave the tray'));
equal(draftUI.current().clock,draftClock,'leaving partial recipe charges nothing');equal(draftUI.current().neighbours.recipes.length,0,'leaving records no false serving');

// Favour and evidence interpretations use visible labels and update the board truthfully.
const favourUI=boot(({state,moor,H,C})=>{moor('landing');H.favour(state,'bell','accept');C.read(state,'priya','priya-bell');moor('canal');C.read(state,'mako','mako-bell');moor('landing');});
favourUI.neighbours.favourView('bell');const bellClock=favourUI.current().clock;
favourUI.click(favourUI.find('panel-content','Keep the tale as a labelled harbour legend'));
equal(favourUI.current().neighbours.favours.bell.answer,'legend','chosen mystery interpretation saved');equal(favourUI.current().clock,bellClock+3,'comparison time explicit');
check(JSON.parse(favourUI.saved.get(PROFILE)).charms.includes('bell'),'bell keepsake earned once');
const blockedBell=boot(({state,moor,H})=>{moor('landing');H.favour(state,'bell','accept');});
blockedBell.neighbours.favourView('bell');check(blockedBell.find('panel-content','Publish the checked maintenance account').disabled,'cannot resolve mystery without records');

// Opt-in guide has truthful feedback; default sailing has no guide.
const practiceUI=boot(({state,moor})=>{moor('market');state.docked=null;state.ship.x-=20;state.neighbours.practice=true;});
practiceUI.frame(1000);check(!practiceUI.nodes.get('dock-guide').hidden,'enabled practice guide appears near a quay');
check(practiceUI.nodes.get('dock-guide').classList.contains('gentle'),'slow aligned guide is green');
practiceUI.click(practiceUI.nodes.get('dock-button'));equal(practiceUI.current().neighbours.landings[0].grade,'gentle','landing graded at actual docking');
check(practiceUI.nodes.get('arrival-text').textContent.startsWith('Gentle landing.'),'arrival explains the practice result');
check(JSON.parse(practiceUI.saved.get(PROFILE)).neighbours.gentle.includes('market'),'practice progress persists');
const noGuide=boot(({state,moor})=>{moor('market');state.docked=null;state.ship.x-=20;});noGuide.frame(1000);check(noGuide.nodes.get('dock-guide').hidden,'practice does not appear by default');

// New illustrated seats have functioning controls and stable production asset paths.
for(const [port,file,title]of [['metro','metro','A seat by Metro'],['yard','yard','Rin’s workshop'],['observatory','observatory','Mio’s dockside']]) {
  const r=boot(({moor})=>moor(port));r.click(r.find('port-content','Take a closer dockside seat'));
  check(r.find('panel-content',title),'correct dockside seat title');
  check(walk(r.nodes.get('panel-content')).some(n=>n.src==='../assets/scenes/'+file+'-dockside.webp'&&n.alt),'new illustration has correct source and descriptive alt');
  check(!r.nodes.get('panel-back').hidden,'seat return is fixed outside scrolling content');
  r.click(r.nodes.get('panel-back'));check(!r.nodes.get('panel').open,'fixed seat Back returns to the quay');
}
const readUI=boot(({state,moor,C})=>{moor('observatory');C.read(state,'mio','mio-depth');});
readUI.neighbours.notebook();check(walk(readUI.nodes.get('panel-content')).some(n=>n.href?.startsWith('https://science.nasa.gov/')&&n.rel==='noopener noreferrer'),'science note links directly to its primary source');
// 0.17: the new story is optional; actual chapter and chart controls reach the model.
const inviteUI=boot(({moor})=>moor('market'));
check(!inviteUI.nodes.get('panel').open,'new expansion does not force an intro');
inviteUI.expedition.notebook();inviteUI.click(inviteUI.find('panel-content','Read Nao’s invitation'));
equal(inviteUI.current().breakwater.chapter,1,'invitation creates chapter one');
inviteUI.click(inviteUI.find('panel-content','Choose the expedition menu with Nao'));
inviteUI.click(inviteUI.find('panel-content','“Let’s bring a gentle bowl'));
equal(inviteUI.current().breakwater.menu,'herbs','full menu reply commits choice');
check(inviteUI.find('panel-content','“Then the broth'),'choice-specific Nao reply visible');
check(!inviteUI.nodes.get('panel-back').hidden,'new conversation has fixed Back');
inviteUI.click(inviteUI.nodes.get('panel-back'));inviteUI.click(inviteUI.find('panel-content','Illustrated region chart'));
check(walk(inviteUI.nodes.get('panel-content')).some(n=>n.className==='region-chart'&&n['aria-label']),'chart has accessible description');
check(inviteUI.find('panel-content','Prepare chapter one'),'locked quays explain how they open');
check(!!inviteUI.saved.get('neon-tides:voyage:v1'),'new story saves under existing Voyage key');
equal(inviteUI.saved.get('neon-tides:save:v1'),'classic-unchanged','expansion leaves Classic untouched');
const chapterUI=boot(({state,moor,B})=>{moor('market');B.start(state);B.talk(state,'menu','smoked');moor('bar');B.action(state,'pack');moor('yard');B.action(state,'trim');});
chapterUI.expedition.notebook();chapterUI.click(chapterUI.find('panel-content','Finish this night & review continuation'));
check(chapterUI.find('panel-content','Continue the expedition · Next chapter'),'report offers real chapter continuation');
const carryPurse=chapterUI.current().credits,carryFuel=chapterUI.current().fuel;
chapterUI.click(chapterUI.find('panel-content','Continue the expedition · Next chapter'));
equal(chapterUI.current().breakwater.chapter,2,'actual report advances chapter');equal(chapterUI.current().credits,carryPurse,'report retains purse');equal(chapterUI.current().fuel,carryFuel,'report retains tank');
check(!chapterUI.nodes.get('panel').open,'continuation returns to the quay');
const outerUI=boot(({state,moor,B})=>{state.breakwater={...B.fresh(),chapter:2,menu:'herbs',steps:['packed','trim'],crew:true};moor('tea-island');});
outerUI.click(outerUI.find('port-content','Take a closer coastal seat'));
check(walk(outerUI.nodes.get('panel-content')).some(n=>n.src==='../assets/scenes/aonami-dockside.webp'&&n.alt),'tea island has its own arrival illustration');
outerUI.click(outerUI.nodes.get('panel-back'));outerUI.person('Nao Mizuno');
check(outerUI.find('port-content','Beyond the Breakwater'),'travelling Nao has expedition control');
outerUI.click(outerUI.nodes.get('chart-button'));check(outerUI.find('panel-content','Preview Aonami'),'chart exposes named quay controls');
outerUI.click(outerUI.find('panel-content','Pin this route'));check(outerUI.current().breakwater.pin,'chart pin persisted');
const routeUI=boot(({state,moor,B})=>{state.breakwater={...B.fresh(),chapter:2,menu:'herbs',steps:['packed','trim']};moor('landing');});
routeUI.expedition.routes();check(routeUI.find('panel-content','Pilots’ short inlet').disabled,'unheard route remains disabled');
routeUI.click(routeUI.find('panel-content','Ask Priya'));routeUI.click(routeUI.find('panel-content','“Please mark the surveyed inlet'));
routeUI.expedition.routes();routeUI.click(routeUI.find('panel-content','Pilots’ short inlet'));
equal(routeUI.current().breakwater.route,'inlet','knowledge unlocks actual route selection');
const coastFishUI=boot(({state,B})=>{state.breakwater={...B.fresh(),chapter:2,menu:'herbs',steps:['packed','trim'],crew:true};state.docked=null;state.ship={x:3500,y:800,angle:0,speed:0};});
check(!coastFishUI.nodes.get('coast-fish-button').hidden,'coastal action appears only in unlocked water');
coastFishUI.click(coastFishUI.nodes.get('coast-fish-button'));coastFishUI.click(coastFishUI.find('panel-content','Fish the coastal water'));
equal(coastFishUI.current().breakwater.catches.length,1,'actual coastal fish callback works');
equal(coastFishUI.current().clock,1424,'coastal fishing charges full time');

console.log(`Passed ${checks} Voyage DOM integration checks (browser layout is not covered).`);
