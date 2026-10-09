/* Playtest rules and saves are separate from Classic. */
(function(){'use strict';const P=window.VoyagePorts,W=window.VoyageWorld,N=window.VoyageNavigation,M=window.NeonMarket;
const time=n=>String(Math.floor(n/60)%24).padStart(2,'0')+':'+String(Math.floor(n)%60).padStart(2,'0');
function create(seed){const truth=M.pickTruth(P.economy,seed);return {version:1,seed,truth,ship:{x:1320,y:395,angle:Math.PI/2,speed:0},docked:'bar',clock:1420,credits:360,fuel:6,gold:[{grams:2,cost:91,karat:24}],trades:[],quotes:{},flags:{},chats:{},log:['Your first voyage begins at Mei’s quay.'],ended:false};}
function valid(s){return !!s&&s.version===1&&typeof s.seed==='string'&&['order','vault','both'].includes(s.truth)&&s.ship&&[s.ship.x,s.ship.y,s.ship.angle,s.ship.speed,s.clock,s.credits,s.fuel].every(Number.isFinite)&&N.water(s.ship.x,s.ship.y)&&s.credits>=0&&s.fuel>=0&&s.fuel<=6&&s.clock>=1420&&s.clock<=1800&&(s.docked===null||W.ports.some(p=>p.id===s.docked))&&(!s.docked||Math.hypot(s.ship.x-W.ports.find(p=>p.id===s.docked).x,s.ship.y-W.ports.find(p=>p.id===s.docked).y)<70)&&Array.isArray(s.gold)&&s.gold.every(l=>l&&Number.isFinite(l.grams)&&l.grams>=0&&Number.isFinite(l.cost)&&l.cost>=0)&&Array.isArray(s.trades)&&s.trades.every(t=>t&&['buy','sell'].includes(t.kind)&&W.ports.some(p=>p.id===t.where)&&[t.at,t.grams,t.total,t.price].every(Number.isFinite))&&s.flags&&!Array.isArray(s.flags)&&typeof s.flags==='object'&&Object.values(s.flags).every(v=>typeof v==='boolean')&&s.chats&&!Array.isArray(s.chats)&&typeof s.chats==='object'&&Object.entries(s.chats).every(([id,n])=>P.characters[id]&&Number.isInteger(n)&&n>=0)&&s.quotes&&!Array.isArray(s.quotes)&&typeof s.quotes==='object'&&Object.entries(s.quotes).every(([id,q])=>W.ports.some(p=>p.id===id)&&q&&[q.buy,q.sell,q.at].every(Number.isFinite))&&Array.isArray(s.log)&&s.log.every(x=>typeof x==='string')&&typeof s.ended==='boolean';}
function log(s,text){s.log.unshift(time(s.clock)+' · '+text);s.log=s.log.slice(0,40);}
function advance(s,minutes){s.clock=Math.min(1800,s.clock+minutes);if(s.clock>=1800){s.ended=true;s.ship.speed=0;}}
function observe(s){if(!s.docked)return;const q=M.quote(P.economy,s.truth,s.seed,s.docked,s.clock,s.trades);s.quotes[s.docked]={buy:q.buy,sell:q.sell,at:s.clock};}
function trade(s,kind,amount){if(s.ended||!s.docked||!Number.isInteger(amount)||amount<1||!['buy','sell'].includes(kind))return false;
 const q=M.quote(P.economy,s.truth,s.seed,s.docked,s.clock,s.trades),held=M.lots.total(s.gold);
 if(kind==='buy'){if(amount>q.canBuy||amount*q.buy>s.credits)return false;const total=amount*q.buy;s.credits-=total;s.gold=M.lots.buy(s.gold,amount,q.buy,{where:s.docked,at:s.clock});s.trades.push({kind,grams:amount,total,price:q.buy,where:s.docked,at:s.clock});}
 else{if(amount>held||amount>q.canSell)return false;const sold=M.lots.sell(s.gold,amount),total=amount*q.sell;s.gold=sold.lots;s.credits+=total;s.trades.push({kind,grams:amount,total,basis:sold.basis,price:q.sell,where:s.docked,at:s.clock});}
 log(s,(kind==='buy'?'Bought ':'Sold ')+amount+' g of gold.');observe(s);return true;}
function action(s,id){if(s.ended)return false;
 if(id==='accept-tea'){if(s.docked!=='bar'||s.flags.teaAccepted||s.clock+5>P.tea.deadline)return false;s.flags.teaAccepted=true;advance(s,5);log(s,'Collected Mei’s sealed tea for Nao.');}
 else if(id==='deliver-tea'){if(s.docked!=='market'||!s.flags.teaAccepted||s.flags.teaDelivered||s.clock>P.tea.deadline)return false;s.flags.teaDelivered=true;s.credits+=P.tea.fee;advance(s,5);log(s,'Nao received Mei’s tea. Courier payment: 24 cr.');}
 else if(id==='meal'){const meal=P.meals[s.docked];if(!meal||s.credits<meal.price)return false;s.credits-=meal.price;advance(s,meal.minutes);log(s,'Sat down for '+meal.name.toLowerCase()+'.');}
 else if(id==='fuel'){if(s.docked!=='landing'||s.fuel>=5.99||s.credits<30)return false;s.credits-=30;s.fuel=6;advance(s,10);log(s,'Refuelled at Landing 3.');}
 else if(id==='engine'){if(s.docked!=='market'||s.flags.engine||s.credits<80)return false;s.credits-=80;s.flags.engine=true;advance(s,15);log(s,'Kenji tuned the engine: faster sailing, 20% less fuel per distance.');}
 else if(id==='salvage'){if(s.docked||s.flags.salvage||Math.hypot(s.ship.x-W.salvage.x,s.ship.y-W.salvage.y)>65)return false;s.flags.salvage=true;s.credits+=36;s.ship.speed=0;advance(s,12);log(s,'Recovered a sealed signal-light kit. Salvage value: 36 cr.');}
 else if(id==='tow'){if(s.docked)return false;const fee=Math.min(20,s.credits);s.credits-=fee;s.fuel=Math.max(3,s.fuel);s.docked='landing';s.ship={x:365,y:385,angle:0,speed:0};advance(s,20);log(s,'Harbour tug brought you home for '+fee+' cr.');observe(s);}
 else return false;observe(s);return true;}
function nearby(s){return W.ports.find(p=>Math.hypot(p.x-s.ship.x,p.y-s.ship.y)<65)||null;}
function dock(s){if(s.ended||s.docked)return false;const p=nearby(s);if(!p)return false;s.docked=p.id;s.ship={x:p.x,y:p.y,angle:s.ship.angle,speed:0};observe(s);log(s,'Moored at '+p.name+'.');return true;}
function depart(s){if(s.ended||!s.docked)return false;s.docked=null;s.ship.speed=0;return true;}
function move(s,input,dt){if(s.ended||s.docked)return 0;if(s.fuel<=0){s.ship.speed=0;return 0;}const distance=N.step(s.ship,input,dt,s.flags.engine);if(distance>0){s.fuel=Math.max(0,s.fuel-distance/620*(s.flags.engine?.8:1));advance(s,Math.max(0,Math.min(.05,dt))*2);}return distance;}
function chat(s,id){const c=P.characters[id];if(!c||!s.docked||!W.ports.find(p=>p.id===s.docked).people.includes(id))return null;let text;
 if(id==='nao'&&s.flags.teaDelivered&&!s.flags.naoThanks){s.flags.naoThanks=true;text='Mei’s tea, safe and dry! Thank you, captain. The delivery fee is settled; this smile is simply mine to give.';}
 else{const n=s.chats[id]||0;text=c.chats[n%c.chats.length];s.chats[id]=n+1;}return text;}
window.VoyageModel={create,valid,time,log,advance,observe,trade,action,nearby,dock,depart,move,chat};})();
