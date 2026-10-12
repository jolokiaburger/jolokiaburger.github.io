/* Native coast silhouettes, terraced gardens, signal room and expedition luggage. */
(function(){'use strict';
 function draw(c,s,phase,reduced){if(!window.VoyageRegions.unlocked(s))return;
  const box=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);},line=(x,y,a,b,col,width=1)=>{c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();};
  const lamp=(x,y)=>{c.fillStyle='#f1cb86';c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.fillStyle='#edb97420';c.beginPath();c.arc(x,y,28,0,Math.PI*2);c.fill();};
  for(let i=0;i<6;i++){box(3830+i*8,290+i*44,370-i*22,29,'#6f8862');line(3820+i*8,325+i*44,4220-i*14,325+i*44,'#c4b68e',2);for(let j=0;j<10;j++){c.fillStyle='#95a879';c.beginPath();c.ellipse(3844+j*33+i*5,305+i*44,11,5,0,0,Math.PI*2);c.fill();}}
  window.VoyageHarbourArt.roof(c,3790,558,180,85,'#8a7260');box(3790,644,165,19,'#c1a277');for(let i=0;i<4;i++){lamp(3805+i*45,655);box(3802+i*34,638,12,7,'#e1d4b1');}
  box(4190,610,58,56,'#798774');for(let i=0;i<5;i++)line(4190,620+i*8,4248,620+i*8,'#b4b899',1);
  window.VoyageHarbourArt.roof(c,4570,1180,260,134,'#716d78');box(4590,1280,73,61,'#46615f');box(4690,1293,82,42,'#947658');
  box(4830,1120,52,120,'#8b8872');box(4818,1108,78,20,'#c0b397');lamp(4857,1108);
  for(let i=0;i<4;i++){box(4587+i*55,1200,27,20,s.breakwater.steps.includes('station')?'#e3c893':'#7e9293');lamp(4590+i*60,1350);}
  box(4572,1365,160,27,'#8e725c');for(let i=0;i<3;i++){c.fillStyle='#ddd3b4';c.beginPath();c.ellipse(4600+i*44,1377,10,4,0,0,Math.PI*2);c.fill();}
  c.font='600 13px Georgia';c.fillStyle='#e5d4af';c.fillText('AONAMI · TEA & SUPPER',3790,691);c.fillText(s.breakwater.steps.includes('station')?'SHIOSAI · THE KETTLE RETURNS':'SHIOSAI · SIGNAL ROOM',4570,1420);
  if(!reduced){for(const [x,y]of[[3838,630],[4700,1280]]){c.strokeStyle='#e9e0c944';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+Math.sin(phase)*4,y-10,x-5,y-18,x+3,y-29);c.stroke();}}
  for(const d of window.VoyageRegions.discoveries){if(s.finds[d.id])continue;box(d.x-10,d.y-7,20,14,d.kind==='signal'?'#9ba68e':d.kind==='pages'?'#9b8263':'#7c9890');lamp(d.x,d.y-12);}
 }
 window.VoyageCoastArt={draw};
})();
