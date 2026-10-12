/* Replayable, action-paced tea simulation. Serving alone commits harbour time. */
(function () {
  'use strict';
  const M=window.VoyageModel;
  const blends={
    green:{name:'Aonami green',temperature:78,seconds:60,colour:'#a8b36b',note:'Tender leaves open in cooler water. Jun likes a light, clear cup.'},
    roasted:{name:'Lantern roast',temperature:92,seconds:90,colour:'#c69151',note:'Roasting brings a toasted aroma. Hana likes its warmth after tending the festival tables.'},
    jasmine:{name:'Moon jasmine',temperature:84,seconds:75,colour:'#d6c58d',note:'Keep the floral scent gentle. Mako likes a fragrant cup with room for conversation.'}
  };
  const guests=[{who:'jun',blend:'green',text:'“There. You can taste the leaf before you taste the heat. That is a small kindness worth learning.”'},
    {who:'hana',blend:'roasted',text:'“It smells like the lantern workshop after the rain. I was going to hurry back. Perhaps one more minute.”'},
    {who:'mako',blend:'jasmine',text:'“A flower that fits inside a cup. Don’t tell Jun I said that; he will put it on the menu.”'}];
  const actions={heat:'Heat · +8°C',warm:'Gentle heat · +2°C',cool:'Cool · −3°C',pour:'Pour · 30 ml',sip:'Fine pour · 10 ml',infuse:'Begin steeping',wait:'Steep · 15 sec',taste:'Steep · 5 sec',decant:'Decant into the cup'};
  const fresh=()=>({pending:null,cups:[]});
  const data=s=>s.teaCraft||(s.teaCraft=fresh());
  function status(s){return s.ended?'This night has ended':s.docked!=='canal'?'Visit Jun at Kisaragi':(s.teaCraft?.cups.length||0)>=6?'Six cups shared tonight':s.clock+6>1800?'Needs 6 min before 06:00':'';}
  function simulate(p){
    if(!p||typeof p.blend!=='string'||!Object.hasOwn(blends,p.blend)||!Array.isArray(p.moves)||p.moves.length>120)return null;
    const d=blends[p.blend],r={phase:'kettle',temperature:60,water:0,seconds:0,extraction:0,scorch:0,pourTemperature:0,quality:0};
    for(const a of p.moves){
      if(r.phase==='ready'||typeof a!=='string'||!Object.hasOwn(actions,a))return null;
      if(['heat','warm','cool'].includes(a)){if(r.phase!=='kettle')return null;r.temperature=Math.max(40,Math.min(100,r.temperature+(a==='heat'?8:a==='warm'?2:-3)));}
      else if(a==='pour'||a==='sip'){
        if(!['kettle','pour'].includes(r.phase)||r.water>=240)return null;
        const amount=Math.min(a==='pour'?30:10,240-r.water);r.pourTemperature=(r.pourTemperature*r.water+r.temperature*amount)/(r.water+amount);r.water+=amount;r.temperature=Math.max(40,r.temperature-1);r.phase='pour';
      }else if(a==='infuse'){if(r.phase!=='pour'||r.water<90)return null;r.phase='steep';r.temperature=r.pourTemperature;r.scorch=Math.max(0,r.temperature-d.temperature-8)*1.8;}
      else if(a==='wait'||a==='taste'){
        if(r.phase!=='steep'||r.seconds>=180)return null;const t=Math.min(a==='wait'?15:5,180-r.seconds);
        r.extraction+=t/d.seconds*Math.max(.3,1+(r.temperature-d.temperature)/50)*180/r.water;r.seconds+=t;r.temperature=Math.max(40,r.temperature-t*.035);
      }else if(a==='decant'){
        if(r.phase!=='steep'||r.seconds<5)return null;r.phase='ready';
        r.quality=Math.max(0,Math.round(100-Math.abs(1-r.extraction)*75-Math.abs(r.water-180)*.18-Math.abs(r.pourTemperature-d.temperature)*.65-r.scorch));
      }
    }
    return r;
  }
  function start(s,blend){if(status(s)||typeof blend!=='string'||!Object.hasOwn(blends,blend))return false;const t=data(s);if(t.pending)return false;t.pending={blend,moves:[]};return true;}
  function act(s,a){const p=s.teaCraft?.pending;if(status(s)||!p||!simulate({...p,moves:[...p.moves,a]}))return false;p.moves.push(a);return true;}
  function reset(s){if(!s.teaCraft?.pending)return false;s.teaCraft.pending=null;return true;}
  function serve(s){const t=s.teaCraft,p=t?.pending,r=simulate(p);if(status(s)||!r||r.phase!=='ready')return false;const cup={blend:p.blend,moves:p.moves.slice(),at:s.clock+6};t.cups.push(cup);t.pending=null;M.advance(s,6);M.log(s,'Shared '+blends[cup.blend].name+' at Jun’s tea table · '+r.quality+'/100 · 6 min, free.');return cup;}
  function valid(s){
    const t=s.teaCraft;if(t===undefined)return true;if(!t||typeof t!=='object'||Array.isArray(t)||!Array.isArray(t.cups)||t.cups.length>6||!Object.hasOwn(t,'pending'))return false;
    if(t.pending!==null&&(!simulate(t.pending)||s.docked!=='canal'||s.ended))return false;
    let last=1420;return t.cups.every(c=>{if(!c||!Number.isFinite(c.at)||c.at<last+6||c.at>s.clock||simulate(c)?.phase!=='ready')return false;last=c.at;return true;});
  }
  const old={valid:M.valid,depart:M.depart,advance:M.advance};
  M.valid=s=>old.valid(s)&&valid(s);
  M.depart=s=>{const ok=old.depart(s);if(ok)reset(s);return ok;};
  M.advance=(s,...args)=>{const r=old.advance(s,...args);if(s.ended)reset(s);return r;};
  window.VoyageTea={blends,guests,actions,fresh,data,status,simulate,start,act,reset,serve,valid};
})();
