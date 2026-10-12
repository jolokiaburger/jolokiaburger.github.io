/* Outer coast data. Existing quay IDs and coordinates are unchanged. */
(function () {
  'use strict';
  const W = window.VoyageWorld;
  const harbour = {width: W.width, height: W.height, ports: W.ports.slice()};
  W.width = 5100;
  W.land = W.land.filter(a => !(a.x === 3365 && a.w === 35));
  W.land[0].w = W.width; W.land[1].w = W.width;
  W.land.push({x:3365,y:0,w:35,h:450}, {x:3365,y:1150,w:35,h:650}, {x:5065,y:0,w:35,h:1800},
    {x:3750,y:250,w:560,h:450}, {x:4520,y:1100,w:470,h:480},
    {x:3990,y:920,w:150,h:200}, {x:4470,y:290,w:130,h:180});
  const ports = [
    {id:'tea-island',region:'coast',name:'Aonami Tea Island',subtitle:'Terraced gardens · The growers’ supper',x:3690,y:620,shore:{x:3750,y:620},color:'#b9cc9c',people:[],arrival:'The tea terraces rise above a sheltered landing. A cook has left space beside the brazier for your tasting notebook.'},
    {id:'coast-station',region:'coast',name:'Shiosai Coastal Station',subtitle:'The old signal room · Etsuko’s kitchen',x:4460,y:1200,shore:{x:4520,y:1200},color:'#c7bbd9',people:[],arrival:'Rin recognises the orange station lamps before the lettering. “Etsuko kept the kettle below that window. I hoped it would still be here.”'}
  ];
  W.ports.push(...ports);
  const discoveries = [
    {id:'coast-signal',kind:'signal',x:4400,y:740,name:'The lantern that answers',region:'coast'},
    {id:'coast-pages',kind:'pages',x:4270,y:930,name:'A waterproof recipe case',region:'coast'},
    {id:'coast-supper',kind:'supper',x:3620,y:1420,name:'The supper skiff',region:'coast'}
  ];
  W.discoveries.push(...discoveries);
  W.beacons.push({x:3430,y:500},{x:3550,y:950},{x:4310,y:1060},{x:4730,y:870});
  const unlocked = s => !!s?.breakwater && s.breakwater.chapter >= 2;
  const available = (s,id) => !ports.some(p=>p.id===id) || unlocked(s);
  const visiblePorts = s => W.ports.filter(p=>available(s,p.id));
  const routes = {
    sheltered:{name:'Sheltered coast',intro:'Follow the marked water round the outer reef. Available to every expedition.',factor:1},
    inlet:{name:'Pilots’ short inlet',intro:'Priya’s survey marks the shorter approach. The surveyed channel avoids the outer buoy detour and saves sailing time and fuel.',factor:1}
  };
  function canRoute(s,id) { return Object.hasOwn(routes,id) && (id==='sheltered'||s.breakwater?.notes.includes('inlet')); }
  function route(s,a,b) {
    const N=window.VoyageNavigation;
    if(!unlocked(s)||s.breakwater.route==='inlet'||a.x<3350&&b.x<3350)return N.route(a,b);
    const buoy=a.x>3350&&b.x>3350?{x:3680,y:1220}:{x:3480,y:1110};
    const first=N.route(a,buoy),last=N.route(buoy,b);return first.length&&last.length?[...first,...last]:[];
  }
  window.VoyageRegions={harbour,ports,discoveries,routes,unlocked,available,visiblePorts,canRoute,route};
})();
