(function(){'use strict';
window.VoyageWorld={width:3400,height:1800,
 land:[{x:0,y:0,w:3400,h:35},{x:0,y:1765,w:3400,h:35},{x:0,y:0,w:35,h:1800},{x:3365,y:0,w:35,h:1800},
 {x:70,y:55,w:450,h:270},{x:1120,y:55,w:580,h:285},{x:1120,y:885,w:580,h:245},{x:730,y:485,w:200,h:210},{x:70,y:1060,w:410,h:280},{x:740,y:1420,w:480,h:260},{x:2050,y:100,w:450,h:420},{x:1960,y:1170,w:210,h:510},{x:2290,y:1170,w:210,h:510},{x:1350,y:1400,w:320,h:230},{x:2930,y:590,w:350,h:360},{x:2800,y:1030,w:450,h:45},{x:3250,y:945,w:40,h:130}],
 ports:[
 {id:'landing',shore:{x:365,y:325},name:'Landing 3',subtitle:'The exchange & harbour office',x:365,y:385,color:'#a9c5bf',people:['priya'],arrival:'Priya lifts her clipboard. “Welcome alongside, captain. News at the office, gold at the hatch, fuel at the pump.”'},
 {id:'bar',shore:{x:1320,y:340},name:'Kurage 33',subtitle:'Mei’s kitchen · Your home quay',x:1320,y:395,color:'#e3ae78',people:['mei'],arrival:'A warm kitchen window catches your wake. Mei has already moved a bowl away from the rain.'},
 {id:'market',shore:{x:1280,y:885},name:'Lantern Market',subtitle:'Sora’s scale · Nao’s counter',x:1280,y:830,color:'#d8b877',people:['sora','nao','kenji'],arrival:'You tie up beneath a row of lanterns. Somewhere inside the arcade a kettle welcomes the next customer.'},
 {id:'metro',name:'Metro Quay',subtitle:'Line 9 · Night crews & homeward trains',x:365,y:1000,shore:{x:365,y:1060},color:'#c2a6c0',people:['lam','yumi'],arrival:'The terminus lamps make little pools in the rain. Captain Lam waves from the shelter; Yumi is taking a well-earned break.'},
 {id:'yard',name:'Starling Yard',subtitle:'Rin’s workshop · Second chances',x:960,y:1360,shore:{x:960,y:1420},color:'#a9c89e',people:['rin'],arrival:'A crane sleeps above the sheds. Rin clears a dry corner of the bench and points out the kettle.'},
 {id:'pier',name:'Frostline Pier 9',subtitle:'Cold store · The instrument desk',x:1990,y:450,shore:{x:2050,y:450},color:'#acd3d4',people:['matte'],arrival:'Refrigeration fans hum over the water. Matte checks your line, then nods toward the desk and its freshly written prices.'},
 {id:'canal',name:'Kisaragi',subtitle:'Beyond the locks · Tea & festival tables',x:1900,y:1410,shore:{x:1960,y:1410},color:'#dfb598',people:['jun','hana','mako'],arrival:'Lantern reflections lead you to the lockside quay. Jun has warmed the pot; Hana is finding space for one more little table.'},
 {id:'island',name:'Hoshimi Island',subtitle:'The guiding light · Aki’s watch',x:1290,y:1510,shore:{x:1350,y:1510},color:'#c8b9d5',people:['aki'],arrival:'The lighthouse beam passes softly over your roof. Aki comes down to meet the Tern with a thermos and a very patient smile.'}
,
 {id:'observatory',name:'Tsukimi Observatory',subtitle:'Outer bay · The night sky workshop',x:2870,y:830,shore:{x:2930,y:830},color:'#b6c9e5',people:['mio'],arrival:'Beyond the city lights, a sheltered quay waits below a silver dome. Mio waves a torch once, then puts the kettle on.'}
 ],discoveries:[{id:'drift',kind:'crate',x:1780,y:1190,name:'Drifting survey chest'},{id:'boat',kind:'boat',x:590,y:960,name:'A delivery boat at rest'},{id:'letter',kind:'letter',x:2660,y:1130,name:'A lantern message'}],reedBeds:[{x:85,y:810},{x:60,y:910},{x:750,y:650}],fogBanks:[{x:530,y:690,r:145},{x:1820,y:850,r:180},{x:2660,y:680,r:200}],salvage:{x:485,y:860,name:'A lantern in the reeds'},beacons:[{x:605,y:425},{x:1085,y:735},{x:940,y:415},{x:1750,y:710},{x:1650,y:1170},{x:655,y:1200},{x:1725,y:1620},{x:2720,y:830},{x:2820,y:1120},{x:3140,y:1100}]};
})();

(function(){'use strict';const W=window.VoyageWorld;
W.weather=function(s){let hash=0;for(const c of s.seed)hash=(hash*31+c.charCodeAt(0))>>>0;
 const phase=(s.clock-1420)/35+(hash%3),index=Math.floor(phase),fraction=phase-index,t=Math.max(0,(fraction-.72)/.28),blend=t*t*(3-2*t),types=['rain','clear','mist'],a=types[index%3],b=types[(index+1)%3],result={name:blend<.5?a:b};
 for(const name of types)result[name]=(a===name?1-blend:0)+(b===name?blend:0);return result;};
W.discoveryPosition=function(s,d){return {x:d.x+Math.sin(s.clock*.08+d.x)*6,y:d.y+Math.cos(s.clock*.05+d.y)*4};};
})();

(function(){const W=window.VoyageWorld;W.discoveries.push({id:'pontoon',kind:'pontoon',x:1745,y:500,name:'The sheltered tea pontoon'},{id:'weather',kind:'station',x:2590,y:710,name:'The retired weather station'},{id:'flowers',kind:'flowers',x:1815,y:1070,name:'A flower seller on the tide'});})();
