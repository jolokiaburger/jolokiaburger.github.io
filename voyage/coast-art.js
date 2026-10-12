/* Tea terraces and a working station kitchen, with native stateful details. */
(function(){
  'use strict';
  function draw(c,s,phase,reduced){if(!window.VoyageRegions.unlocked(s))return;c.save();
    const box=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);},line=(x,y,a,b,col,width=1)=>{c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();},oval=(x,y,rx,ry,col)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
    const lamp=(x,y)=>{const g=c.createRadialGradient(x,y,1,x,y,29);g.addColorStop(0,'#edc48944');g.addColorStop(1,'#edc48900');c.fillStyle=g;c.beginPath();c.arc(x,y,29,0,Math.PI*2);c.fill();oval(x,y,4,4,'#f1cb86');line(x,y-6,x,y-11,'#b7ac89');};
    const steam=(x,y)=>{if(reduced)return;for(let i=0;i<2;i++){c.strokeStyle='#eadfca55';c.lineWidth=1;c.beginPath();c.moveTo(x+i*7,y);c.bezierCurveTo(x+5+Math.sin(phase+i)*4,y-10,x-4+i*7,y-18,x+3+i*7,y-28);c.stroke();}};
    const ready=s.breakwater.steps.includes('station'),hosted=s.supper?.mode==='station',served=hosted?s.supper.served.length:0;
    // Hill paths and irregular hedges keep the terrace rows readable.
    for(let i=0;i<6;i++){box(3830+i*8,290+i*44,370-i*22,28,i%2?'#647e5d':'#708761');line(3820+i*8,325+i*44,4220-i*14,325+i*44,'#ada784',2);for(let j=0;j<10;j++){const x=3844+j*33+i*5,y=305+i*44;oval(x,y,12,6,'#81986b');oval(x-3,y-2,6,3,'#a0ad78');line(x-6,y,x+5,y-1,'#4a6a51');}}
    line(4204,282,4140,570,'#b2a27b',5);for(let j=0;j<4;j++)box(4146+j*5,552+j*8,15,6,'#b9ac81');
    window.VoyageHarbourArt.roof(c,3790,558,180,85,'#8a7260');box(3790,644,165,19,'#c1a277');line(3791,647,3952,647,'#ddc49a',2);
    for(let i=0;i<4;i++){lamp(3805+i*45,655);box(3802+i*34,638,12,7,'#e1d4b1');oval(3808+i*34,638,5,2,'#a89969');}
    for(let i=0;i<3;i++){const x=4015+i*48,y=600+i%2*17;box(x,y,32,19,'#9d885f');for(let j=0;j<3;j++)line(x+j*10,y+2,x+j*10,y+17,'#cebd8b');oval(x+16,y+4,13,6,'#74916a');}
    box(4190,610,58,56,'#798774');for(let i=0;i<5;i++)line(4190,620+i*8,4248,620+i*8,'#b4b899');
    window.VoyageHarbourArt.figure(c,'visitor',4030,561,phase,{coat:'#a7926b',hair:'#625346'},reduced);window.VoyageHarbourArt.figure(c,'visitor',4148,589,phase,{coat:'#6e9379',hair:'#535444'},reduced);
    if(s.breakwater.steps.includes('sample')){box(3800,672,72,17,'#a08865');for(let i=0;i<3;i++)oval(3812+i*23,675,7,3,'#dfd5b6');steam(3836,666);}
    // Masonry, copper roof, open windows, benches and a credited rota.
    box(4558,1191,286,147,'#334e55');window.VoyageHarbourArt.roof(c,4570,1180,260,134,'#716d78');
    for(let i=0;i<5;i++)line(4573,1212+i*23,4825,1212+i*23,'#8c888055');
    box(4590,1280,73,61,'#46615f');box(4597,1284,59,45,ready?'#a2986c':'#273f48');line(4626,1284,4626,1329,'#c0ab85',2);
    box(4690,1293,82,42,'#947658');oval(4728,1292,12,4,'#d2b99a');box(4775,1300,18,22,'#d5c19d');line(4778,1305,4790,1305,'#7a8172');line(4778,1311,4787,1311,'#7a8172');
    box(4830,1120,52,120,'#8b8872');for(let y=1130;y<1240;y+=15)line(4831,y,4881,y,'#a6a08a');box(4818,1108,78,20,'#c0b397');lamp(4857,1108);
    for(let i=0;i<4;i++){box(4587+i*55,1200,27,20,ready?'#e3c893':'#7e9293');line(4600+i*55,1200,4600+i*55,1220,'#65746d');lamp(4590+i*60,1350);}
    box(4572,1365,190,27,'#8e725c');line(4572,1368,4762,1368,'#bcaa7e');for(let i=0;i<3;i++){const x=4600+i*58;oval(x,1377,10,4,hosted&&i<served?'#778b84':'#ddd3b4');box(x-12,1399,25,7,'#78674e');if(hosted&&i<served){oval(x+15,1377,4,3,'#c0a774');window.VoyageHarbourArt.figure(c,'visitor',x,1417,phase,{coat:['#809677','#aa997d','#7b919d'][i],hair:'#5d5a50'},reduced);}}
    if(ready){steam(4700,1280);window.VoyageHarbourArt.figure(c,'rin',4688,1355,phase,{coat:'#7e896a',hair:'#3d403b'},reduced);if(hosted)window.VoyageHarbourArt.figure(c,'nao',4565,1365,phase,{coat:'#b39070',hair:'#665448'},reduced);}
    c.font='600 13px Georgia';c.fillStyle='#e5d4af';c.fillText('AONAMI · TEA & SUPPER',3790,708);c.fillText(hosted?'SHIOSAI · SUPPER FOR THE WATCH':ready?'SHIOSAI · THE KETTLE RETURNS':'SHIOSAI · SIGNAL ROOM',4570,1452);steam(3838,630);
    oval(4530,1480,9,24,'#849585');box(4526,1468,8,18,'#c0b499');line(4530,1458,4530,1500,'#334e54');
    for(const d of window.VoyageRegions.discoveries){if(s.finds[d.id])continue;box(d.x-10,d.y-7,20,14,d.kind==='signal'?'#9ba68e':d.kind==='pages'?'#9b8263':'#7c9890');lamp(d.x,d.y-12);}
    c.restore();
  }
  window.VoyageCoastArt={draw};
})();
