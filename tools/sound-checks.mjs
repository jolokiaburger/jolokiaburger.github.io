// Node-only Web Audio contract checks; does not assess timbre or browser autoplay.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>fs.readFileSync(root+p,'utf8');
let checks=0;const check=(v,m)=>{assert.ok(v,m);checks++;};
const saved=new Map(),timers=[],nodes=[];
function param(){return {value:0,events:[],setValueAtTime(v,t){this.value=v;this.events.push({v,t});},setTargetAtTime(v,t){this.value=v;this.events.push({v,t});},exponentialRampToValueAtTime(v,t){this.value=v;this.events.push({v,t});}};}
function node(kind){const n={kind,gain:param(),frequency:param(),Q:param(),detune:param(),threshold:param(),ratio:param(),connect(to){this.destination=to;},disconnect(){this.disconnected=true;},start(t){this.started=t;},stop(t){this.stopped=t;}};nodes.push(n);return n;}
class Audio {
 constructor(){this.sampleRate=8000;this.currentTime=10;this.state='running';this.destination={};}
 createGain(){return node("gain");}createOscillator(){return node("oscillator");}createBufferSource(){return node("buffer");}createBiquadFilter(){return node("filter");}createDynamicsCompressor(){return node();}createConvolver(){return node();}
 createBuffer(ch,len){const data=Array.from({length:ch},()=>new Float32Array(len));return {getChannelData:i=>data[i]};}
 resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}
}
const context=vm.createContext({console,window:{AudioContext:Audio,matchMedia:()=>({matches:false,addEventListener(){}}),localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)}},document:{hidden:false,readyState:'loading',addEventListener(){}},location:{search:'',protocol:'file:'},URLSearchParams,setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},setInterval(){return 1;},clearInterval(){}});
for(const p of ['cases.js','trade.js','market.js','dialogue.js','expansion.js','night-market.js','night-two.js','canal-town.js','harbour-life.js','morning-after.js','harbour-wire.js','release.js','halloween-radio.js','voyage/sound.js'])vm.runInContext(read(p),context);
let source=read('game.js').replace('  if (document.readyState === "loading")',`
 window.SoundReview={soundCue,marketAmbience,radio,settings,loadSettings,settingsKey:SETTINGS_KEY,visit:(loc,clock)=>{state.location=loc;state.clock=parseClock(clock);transient.mode="play";transient.marketSpot="all";},state:()=>state};
 render=function(){};renderKeepingFocus=function(){};focusEncounter=function(){};positionFerry=function(){};toast=function(){};setMode=function(){};showResolution=function(){};debugMarket=function(){};
 if (document.readyState === "loading")`);
vm.runInContext(source,context);
const api=context.window.NeonTides,R=context.window.SoundReview;
check(!api.radio.state().effects&&!api.radio.state().hasContext,'new game silent without creating audio');
api.trade.start('frost-order');api.trade.buy(1);
check(!api.radio.state().hasContext,'muted trade does not create context');
api.radio.setEffects(true,0.3);
check(api.radio.state().effects&&api.radio.state().effectsVolume===0.3,'independent effects enabled');
check(api.radio.state().station==='off','effects do not start music');
check(R.radio.effects.destination!==R.radio.master,'separate effects bus');
const step=()=>{R.radio.ctx.currentTime+=3;};
step();let count=R.radio.sfxPlayed;
check(api.trade.buy(1),'successful buy');check(R.radio.sfxPlayed===count+1,'successful buy emits one cue');
check(!R.soundCue('tea'),'rapid click is rate limited');
step();count=R.radio.sfxPlayed;R.state().credits=0;
check(!api.trade.buy(1),'unaffordable buy rejected');check(R.radio.sfxPlayed===count,'failed buy silent');
check(api.trade.sell(1),'sell succeeds');check(R.radio.sfxPlayed===count+1,'successful sell emits cue');
for(const kind of ['buy','sell','opening','repair','grill','tea','bowl']){
 step();const before=nodes.length;check(R.soundCue(kind),kind+' scheduled');
 const created=nodes.slice(before),finite=created.filter(n=>n.stopped!==undefined);
 check(finite.length>0&&finite.every(n=>n.stopped>n.started&&n.stopped-n.started<2.1),kind+' sources have bounded duration');
 if(kind!=='opening'){
  const tones=created.filter(n=>n.kind==='oscillator');
  check(tones.every(n=>n.type==='sine'&&n.frequency.events.every(e=>e.v<=1100)),kind+' has no bright synthetic beep sequence');
  check(created.filter(n=>n.kind==='gain').every(n=>n.gain.events.every(e=>e.v<=0.02)),kind+' has restrained peak levels');
  check(created.some(n=>n.kind==='buffer'),kind+' includes environmental texture');
 }
 for(const n of created.filter(n=>n.kind==='buffer')){
  check(n.destination.destination.type==='lowpass'&&n.destination.destination.frequency.value<=1800,kind+' noise loses harsh high frequencies');
 }
 for(const n of created.filter(n=>n.kind==='gain')){
  const e=n.gain.events;
  check(e[0].v===0.0001&&e.at(-1).v===0.0001&&e[1].t>e[0].t&&e.at(-1).t>e[1].t,kind+' has a smooth attack and release');
 }
 for(const n of finite)n.onended();
 check(created.every(n=>n.disconnected),kind+' cleans up every source, filter and gain');
}
step();R.visit('market','01:00');count=R.radio.sfxPlayed;R.radio.ctx.currentTime+=10;R.marketAmbience();check(R.radio.sfxPlayed===count+1,'market ambience triggers when eligible');
R.visit('bar','01:00');count=R.radio.sfxPlayed;R.radio.ctx.currentTime+=20;R.marketAmbience();check(R.radio.sfxPlayed===count,'market ambience stays in market');
R.visit('market','01:00');context.document.hidden=true;check(!R.soundCue('opening'),'hidden tab suppresses cues');R.marketAmbience();check(R.radio.sfxPlayed===count,'hidden tab suppresses ambience');context.document.hidden=false;
R.radio.ctx.state='suspended';R.marketAmbience();check(R.radio.ctx.state==='suspended','ambience cannot resume audio');R.radio.ctx.state='running';
api.radio.setStation('off');for(const f of timers.splice(0))f();check(R.radio.ctx.state==='running','turning music off keeps effects available');
api.radio.setEffects(false);for(const f of timers.splice(0))f();check(R.radio.ctx.state==='suspended','both off suspends audio');check(R.radio.effects.gain.value===0,'muting effects silences existing bus');check(!R.soundCue('buy'),'muted cue rejected');
const old=R.settings.effectsVolume;api.radio.setEffects(false,-2);check(R.settings.effectsVolume===old,'invalid volume ignored');
saved.set(R.settingsKey,JSON.stringify({station:'lantern'}));R.loadSettings();check(R.settings.effects,'legacy radio-on settings preserve ferry effects');
saved.set(R.settingsKey,JSON.stringify({station:'off',effects:false,effectsVolume:0.3}));R.loadSettings();check(!R.settings.effects&&R.settings.effectsVolume===0.3,'saved independent mute and volume restored');
// Actual action hooks: the celebration follows successful opening, never render/reload.
api.trade.start('two-tides');R.visit('market','05:00');api.performAction('nb_start');api.radio.setEffects(true);step();count=R.radio.sfxPlayed;api.performAction('nb_open');check(R.radio.sfxPlayed===count+1,'Nao opening emits one flourish');step();api.performAction('nb_open');check(R.radio.sfxPlayed===count+1,'completed opening cannot replay its flourish');
// Halloween station shares the existing music bus and cleans its private graph on retuning.
check(api.radio.stations.some(s=>s.id==='ghost'),'Halloween station available in Classic');
const ghostBegin=nodes.length;api.radio.setStation('ghost');check(api.radio.state().station==='ghost','Halloween station selected');
const ghostNodes=nodes.slice(ghostBegin),ghostLoops=ghostNodes.filter(n=>n.loop);
check(ghostLoops.length===2,'sea and wind beds loop independently');check(context.window.NeonGhostRadio.bpm===72,'slow 72 BPM tempo');
check(ghostNodes.filter(n=>n.kind==='oscillator').every(n=>['sine','triangle'].includes(n.type)),'no harsh sawtooth oscillator');
check(ghostNodes.filter(n=>n.kind==='filter').every(n=>n.frequency.value<=980),'station uses faded low-frequency filters');
check(ghostNodes.filter(n=>n.kind==='gain').every(n=>n.gain.events.every(e=>Number.isFinite(e.v)&&e.v>=0)),'envelopes are finite and nonnegative');
api.radio.setStation('off');for(const f of timers.splice(0))f();check(ghostLoops.every(n=>n.stopped!==undefined),'turning off stops both environmental loops');
// radioStatic is an existing finite transition outside the station's own graph.
check(ghostNodes.filter(n=>n.loop||n.kind==='oscillator').every(n=>n.disconnected),'station sources disconnect on exit');
saved.set(R.settingsKey,JSON.stringify({station:'ghost',effects:false}));R.loadSettings();check(R.settings.station==='ghost','Halloween choice restores as a valid setting');
// Voyage ferry sounds: separate, opt-in bus and a speed-responsive engine.
const ferryCtx=new context.window.AudioContext(),ferryStart=nodes.length,ferry=context.window.VoyageSound.create(ferryCtx,ferryCtx.destination);
check(!ferry.cue('depart'),'ferry sounds start muted');ferry.enable(true,.6);const ferryState={docked:null,ended:false,fuel:6,ship:{speed:86}};ferry.update(ferryState,{mist:0,rain:1},true);
const continuous=nodes.slice(ferryStart),engineTone=continuous.find(n=>n.kind==='oscillator');check(engineTone.frequency.value>42&&engineTone.frequency.value<70,'engine hum follows speed softly');
check(continuous.filter(n=>n.kind==='buffer'&&n.loop).length===3,'wake, wind and rain textures available');check(ferry.cue('depart')&&ferry.cue('moor'),'departure and mooring cues play when enabled');
const ferryNotes=nodes.slice(ferryStart).filter(n=>n.kind==='oscillator'&&n.stopped!==undefined);check(ferryNotes.every(n=>n.type==='sine'&&n.stopped-n.started<1.5),'ferry cues use quiet bounded tones');
ferry.enable(false,.6);check(continuous[0].gain.value===0,'effects off mutes its separate bus');check(!ferry.cue('moor'),'muted ferry cue rejected');
ferryCtx.state='suspended';ferry.enable(true,.6);check(!ferry.cue('depart'),'ferry cue cannot resume a suspended context');ferry.stop();for(const f of timers.splice(0))f();check(nodes.slice(ferryStart).every(n=>n.disconnected),'ferry graph fully disconnects after stop');
// Browsers without Web Audio still play and save normally.
R.radio.ctx=null;delete context.window.AudioContext;api.radio.setEffects(true);check(!R.settings.effects,'unavailable audio leaves effects off');
console.log(`Passed ${checks} sound checks (mock Web Audio; listening and device QA still required).`);
