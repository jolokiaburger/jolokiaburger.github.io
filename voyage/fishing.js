/* Deterministic, patient angling. Actions advance the fight; only landing spends game time. */
(function () {
  'use strict';
  const M=window.VoyageModel,L=window.VoyageLeisure,B=window.VoyageBreakwater,W=window.VoyageWorld;
  const own=(o,k)=>Object.hasOwn(o,k),record=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const lures={crumb:{name:'Bread crumb',hint:'A quiet offering for grazers.'},silk:{name:'Silk fly',hint:'A soft, drifting imitation.'},spinner:{name:'Tin spinner',hint:'A glint for fish that chase.'}};
  const depths={surface:{name:'Surface',hint:'Just below the lantern reflections.'},middle:{name:'Mid-water',hint:'Between the light and the seabed.'},bottom:{name:'Near the bottom',hint:'Above stones and canal silt.'}};
  const actions={reel:{name:'Reel steadily',hint:'Gain distance; raises tension.'},ease:{name:'Give line',hint:'Let a surge pass; lowers tension.'},lift:{name:'Lift the rod',hint:'Take up slack; makes a stronger pull.'}};
  const grades={expert:'Delicate touch',steady:'Steady hands',patient:'Patient landing',assisted:'Relaxed catch'};
  const notes={
    silver:{lure:'silk',depth:'surface',range:[70,180],body:8,pattern:['cruise','slack','cruise','surge'],habitat:'Small shoals beneath Kurage, Market and Metro lanterns.',diet:'Drifting plankton and tiny insects in the Basin’s surface water.',tell:'Quick, light taps; the float skates sideways before a brief dash.',field:'Its silver sides catch each lantern in turn. Mako calls a passing shoal “the harbour’s loose change”.',food:'Nao folds the small catch into crisp ginger rice.',tea:'Roasted tea',voice:'Mako',colour:'#c2d9d4'},
    bream:{lure:'crumb',depth:'middle',range:[170,420],body:24,pattern:['cruise','surge','cruise','slack'],habitat:'Landing 3, Frostline and the Market. Rain brings it to other quays.',diet:'Small shellfish and loose morsels around the quay piles.',tell:'A deliberate dip, then a heavy sideways sweep.',field:'The gold on its flank is easiest to see under a warm lamp. Priya sketches its rounded outline in the margin of her tide ledger.',food:'Mei suggests a gentle miso bowl with spring greens.',tea:'Jasmine tea',voice:'Priya',colour:'#d8b174'},
    carp:{lure:'crumb',depth:'bottom',range:[220,650],body:22,pattern:['surge','cruise','slack','surge','cruise'],habitat:'Kurage’s quiet backwater and the Kisaragi canal.',diet:'Seeds, soft water plants and small bottom-dwelling morsels.',tell:'A slow pull into the silt, followed by a stubborn, broad turn.',field:'Jun recognises individuals by the bronze pattern near the gill. He insists the largest one knows when his kettle is ready.',food:'Jun favours a ginger broth and a slow, unhurried supper.',tea:'Black tea',voice:'Jun',colour:'#b99576'},
    mackerel:{lure:'spinner',depth:'middle',range:[180,440],body:10,pattern:['surge','slack','surge','cruise'],habitat:'The working water beside Starling Yard, Frostline and Shiosai.',diet:'Small schooling fish in the clear channels.',tell:'Fast runs separated by an abrupt turn back towards the line.',field:'Rin compares the dark waves on its back to a tidy wiring diagram. The comparison lasts until Kenji asks for a legend.',food:'Rin’s workshop table pairs it with smoky rice and ginger.',tea:'Black tea',voice:'Rin',colour:'#7cacc4'},
    rockfish:{lure:'spinner',depth:'bottom',range:[140,380],body:22,pattern:['surge','cruise','surge','slack','cruise'],habitat:'The sheltered reef water beside Hoshimi’s quay.',diet:'Small crustaceans hiding around the Basin’s reef stones.',tell:'A firm downward tug; hold patiently when it digs in.',field:'Hana calls its rust-coloured patches “little islands”. Her notebook keeps each patch separate from the shape of the reef.',food:'Hana recommends a mushroom broth and a little ginger.',tea:'Roasted tea',voice:'Hana',colour:'#c08774'},
    moonfish:{lure:'silk',depth:'middle',range:[120,350],body:20,pattern:['slack','cruise','surge','slack','cruise'],habitat:'Tsukimi, Hoshimi and the tea island’s quiet mooring water.',diet:'Tiny drifting animals in the Basin’s deeper lantern pools.',tell:'A soft flutter, a pause, then a crescent-shaped turn.',field:'Mio named the pale band on its flank after a moonrise. It is a Basin name, rather than a star-chart classification.',food:'Mio keeps its broth simple so the shared table can linger.',tea:'Jasmine tea',voice:'Mio',colour:'#b9b9dd'},
    'moon-mullet':{name:'Moon mullet',lure:'crumb',depth:'surface',range:[250,580],body:12,pattern:['cruise','surge','slack','cruise'],habitat:'The outer coastal water beyond the Breakwater.',diet:'Soft algae and drifting morsels in the coastal shallows.',tell:'A smooth, long sweep before a short, powerful surge.',field:'Nao watches the silver lines from the tea-island steps. “A table can start with something as small as a patient cast.”',food:'The coastal cooks share it in a tea-leaf broth.',tea:'Coastal green tea',voice:'Nao',colour:'#adbdbb'},
    'ribbon-mackerel':{name:'Ribbon mackerel',lure:'spinner',depth:'middle',range:[240,600],body:10,pattern:['surge','slack','surge','cruise','slack'],habitat:'The outer coastal channels beyond the Breakwater.',diet:'Small fish travelling between the outer channels.',tell:'A sharp dash, a turn towards the boat, then another dash.',field:'The tea growers call its blue flank pattern a ribbon. Rin records the name beside the station’s supper rota.',food:'The station cooks serve it with spring rice and ginger.',tea:'Coastal green tea',voice:'Rin',colour:'#7aadc5'}
  };
  const species=Object.fromEntries(Object.entries(notes).map(([id,n])=>[id,{...L.fish[id],...n,id,art:'../assets/fish/'+id+'.webp',source:L.fish[id]?'harbour':'coast'}]));
  const hash=text=>{let n=17;for(const ch of text)n=(n*31+ch.charCodeAt(0))>>>0;return n;};
  const fresh=()=>({pending:null});
  function hydrate(s){if(s.angling===undefined)s.angling=fresh();return s.angling;}
  function status(s,source='harbour'){return source==='coast'?B.catchStatus(s):source==='harbour'?L.status(s,'fish'):'Unknown fishing water';}
  function pool(s,source='harbour'){
    if(source==='coast')return ['moon-mullet','ribbon-mackerel'];
    const ids=Object.keys(L.fish).filter(id=>L.fish[id].ports.includes(s.docked));
    if(M.weather(s).name==='rain'&&!ids.includes('bream'))ids.push('bream');
    return ids;
  }
  const index=(s,source)=>source==='coast'?s.breakwater.catches.length:s.leisure.fishing.casts;
  function choose(s,source,lure,depth){
    const weighted=pool(s,source).flatMap(id=>Array(1+(species[id].lure===lure?3:0)+(species[id].depth===depth?3:0)).fill(id));
    return weighted[hash(s.seed+(s.breakwater?.night||1)+source+(s.docked||'outer-coast')+M.weather(s).name+index(s,source)+lure+depth)%weighted.length];
  }
  function cast(s,source='harbour',lure='silk',depth='middle'){
    if(status(s,source)||!own(lures,lure)||!own(depths,depth))return false;
    const a=hydrate(s);if(a.pending)return a.pending.source===source&&active(s)?a.pending:false;
    let id;
    if(source==='harbour'){
      const already=s.leisure.fishing.pending;if(!L.cast(s))return false;
      id=already?already.id:choose(s,source,lure,depth);s.leisure.fishing.pending.id=id;
    }else id=choose(s,source,lure,depth);
    a.pending={source,id,index:index(s,source),port:s.docked,x:s.ship.x,y:s.ship.y,at:s.clock,lure,depth,phase:'waiting',moves:[]};
    s.ship.speed=0;return a.pending;
  }
  function active(s){const p=s.angling?.pending;if(!p||status(s,p.source))return false;return p.source==='harbour'?s.docked===p.port&&s.leisure.fishing.pending?.id===p.id&&s.leisure.fishing.pending?.index===p.index:!s.docked&&index(s,'coast')===p.index&&Math.hypot(s.ship.x-p.x,s.ship.y-p.y)<.01;}
  function bite(s){const p=s.angling?.pending;if(!active(s)||p.phase!=='waiting')return false;p.phase='bite';return true;}
  function hook(s){const p=s.angling?.pending;if(!active(s)||p.phase!=='bite')return false;p.phase='fight';return true;}
  function cue(p,turn=p.moves.length){const pattern=species[p.id].pattern;return pattern[(turn+hash(p.id+p.index+p.lure+p.depth)%pattern.length)%pattern.length];}
  const cues={cruise:{name:'Swimming evenly',text:'The rod settles. There is room for a steady pull.'},surge:{name:'Pulling away',text:'The rod bends sharply. Give the fish some line.'},slack:{name:'Turning towards you',text:'The line loosens. Lift the rod to take up slack.'}};
  function metrics(p){
    let tension=45,progress=0,mistakes=0;
    for(let i=0;i<p.moves.length;i++){
      const action=p.moves[i],movement=cue(p,i),ideal=movement==='surge'?'ease':movement==='slack'?'lift':'reel';
      if(action===ideal){tension+=movement==='surge'?-12:movement==='slack'?10:4;progress+=movement==='surge'?12:movement==='slack'?23:24;}
      else {mistakes++;tension+=action==='ease'?-20:action==='lift'?28:18;progress+=action==='ease'?0:9;}
      if(tension<20||tension>80){mistakes++;progress=Math.max(0,progress-12);tension=45;}
      tension=Math.max(0,Math.min(100,tension));progress=Math.min(100,progress);
    }
    return {tension,progress,mistakes,turns:p.moves.length,done:progress>=100,exhausted:p.moves.length>=24&&progress<100};
  }
  function movesOK(p){return p.moves.every((_,i)=>!metrics({...p,moves:p.moves.slice(0,i)}).done);}
  function move(s,action){const p=s.angling?.pending;if(!active(s)||p.phase!=='fight'||!own(actions,action))return false;const m=metrics(p);if(m.done||m.exhausted)return false;p.moves.push(action);return metrics(p);}
  function coach(p){const c=cue(p);return c==='surge'?'ease':c==='slack'?'lift':'reel';}
  function restart(s){const p=s.angling?.pending;if(!active(s)||p.phase!=='fight')return false;p.moves=[];return true;}
  function pack(s){const a=hydrate(s),present=!!a.pending||!!s.leisure?.fishing.pending;a.pending=null;if(s.leisure?.fishing.pending)L.pack(s);return present;}
  const grade=(moves,assisted,id,lure,depth,index)=>assisted?'assisted':metrics({id,lure,depth,index,moves}).mistakes===0?'expert':metrics({id,lure,depth,index,moves}).mistakes<=2?'steady':'patient';
  function size(s,id,source,number){const d=species[id],h=hash(s.seed+(s.breakwater?.night||1)+source+number+id+'length');const lengthMm=d.range[0]+h%(d.range[1]-d.range[0]+1);return {lengthMm,weightG:Math.max(1,Math.round(lengthMm**3*d.body/1000000))};}
  function landingDetail(s,p,assisted){return {...size(s,p.id,p.source,p.index),lure:p.lure,depth:p.depth,weather:M.weather(s).name,grade:grade(p.moves,assisted,p.id,p.lure,p.depth,p.index),assisted,moves:p.moves.slice()};}
  function land(s,assisted=false){
    const p=s.angling?.pending;if(typeof assisted!=='boolean'||!active(s)||p.phase!=='fight'||(!assisted&&!metrics(p).done))return false;
    const detail=landingDetail(s,p,assisted);let catchRow;
    if(p.source==='harbour')catchRow=L.reel(s);
    else {if(!B.catchFish(s,p.id))return false;catchRow=s.breakwater.catches[p.index];}
    if(!catchRow)return false;catchRow.measure=detail;hydrate(s).pending=null;return catchRow;
  }
  function measureOK(id,c,number,s,source){
    if(c.measure===undefined)return true;const d=c.measure;if(!record(d)||!own(lures,d.lure)||!own(depths,d.depth)||typeof d.assisted!=='boolean'||!Array.isArray(d.moves)||d.moves.length>24||!d.moves.every(a=>own(actions,a))||typeof d.weather!=='string'||!['clear','rain','mist'].includes(d.weather))return false;
    if(d.lengthMm!==size(s,id,source,number).lengthMm||d.weightG!==size(s,id,source,number).weightG||d.grade!==grade(d.moves,d.assisted,id,d.lure,d.depth,number))return false;
    const fight={id,lure:d.lure,depth:d.depth,index:number,moves:d.moves};
    return movesOK(fight)&&(d.assisted||metrics(fight).done);
  }
  function valid(s){
    for(const [i,c]of(s.leisure?.fishing.catches||[]).entries())if(!measureOK(c.id,c,i,s,'harbour'))return false;
    for(const [i,c]of(s.breakwater?.catches||[]).entries())if(!measureOK(c.id,c,i,s,'coast'))return false;
    if(s.angling===undefined)return true;const a=s.angling;if(!record(a)||!own(a,'pending'))return false;const p=a.pending;if(p===null)return true;
    if(!record(p)||!own(species,p.id)||species[p.id].source!==p.source||!own(lures,p.lure)||!own(depths,p.depth)||!Number.isInteger(p.index)||p.index<0||p.index>= (p.source==='coast'?3:6)||!['waiting','bite','fight'].includes(p.phase)||!Array.isArray(p.moves)||p.moves.length>24||!p.moves.every(v=>own(actions,v))||p.phase!=='fight'&&p.moves.length||!Number.isFinite(p.at)||p.at<1420||p.at>s.clock||![p.x,p.y].every(Number.isFinite))return false;
    if(!movesOK(p)||Math.hypot(s.ship.x-p.x,s.ship.y-p.y)>=.01)return false;
    if(p.source==='harbour')return p.port===s.docked&&W.ports.some(q=>q.id===p.port)&&p.index===s.leisure?.fishing.casts&&s.leisure.fishing.pending?.id===p.id;
    return p.port===null&&s.breakwater?.chapter>=2&&p.x>=3400&&p.index===s.breakwater.catches.length&&!s.docked&&Math.hypot(s.ship.x-p.x,s.ship.y-p.y)<.01;
  }
  const originalValid=M.valid,originalHydrate=M.hydrate,originalCreate=M.create,originalMove=M.move,originalDepart=M.depart,originalDock=M.dock,originalAdvance=M.advance,originalReel=L.reel,originalPack=L.pack,originalCoastCatch=B.catchFish;
  M.valid=s=>originalValid(s)&&valid(s);
  M.hydrate=s=>{originalHydrate(s);hydrate(s);return s;};
  M.create=seed=>{const s=originalCreate(seed);hydrate(s);return s;};
  L.pack=s=>{const result=originalPack(s);if(s.angling?.pending?.source==='harbour')s.angling.pending=null;return result;};
  L.reel=s=>{const c=originalReel(s);if(c&&s.angling)s.angling.pending=null;return c;};
  B.catchFish=(s,...args)=>{const result=originalCoastCatch(s,...args);if(result&&s.angling?.pending?.source==='coast')s.angling.pending=null;return result;};
  M.depart=s=>{const result=originalDepart(s);if(result)pack(s);return result;};
  M.dock=s=>{const result=originalDock(s);if(result)pack(s);return result;};
  M.move=(s,...args)=>{const x=s.ship.x,y=s.ship.y,result=originalMove(s,...args);if(s.ship.x!==x||s.ship.y!==y)pack(s);return result;};
  M.advance=(s,...args)=>{const result=originalAdvance(s,...args);if(s.angling?.pending&&(s.ended||!active(s)))pack(s);return result;};
  window.VoyageFishing={species,lures,depths,actions,grades,cues,fresh,hydrate,status,pool,cast,active,bite,hook,cue,metrics,move,coach,restart,pack,land,valid};
})();
