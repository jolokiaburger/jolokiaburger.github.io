/* Optional decorative festival. No simulation state, geometry or audio changes. */
(function(){
 'use strict';
 const KEY='neon-tides:voyage:halloween:v1',TAU=Math.PI*2;
 function load(storage){try{return JSON.parse(storage.getItem(KEY)||'null')?.enabled===true;}catch(e){return false;}}
 function save(storage,enabled){try{storage.setItem(KEY,JSON.stringify({enabled:enabled===true}));return true;}catch(e){return false;}}
 function oval(c,x,y,rx,ry,colour){c.fillStyle=colour;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
 function glow(c,x,y,r,colour){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,colour);g.addColorStop(1,'#ed994500');oval(c,x,y,r,r,g);}
 function pumpkin(c,x,y,r,variant=0){
  c.save();c.translate(x,y);glow(c,0,2,r*2.8,'#f6ac4538');oval(c,1,r*.68,r*1.08,r*.3,'#15232e70');
  const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#ffd18b');g.addColorStop(.4,'#e99247');g.addColorStop(1,'#a64637');
  for(const [dx,sy]of[[-.52,.75],[.52,.75],[0,.9]]){oval(c,dx*r,0,r*.55,r*sy,g);c.strokeStyle='#923e363f';c.lineWidth=r*.055;c.stroke();}
  c.strokeStyle='#71886c';c.lineWidth=r*.19;c.lineCap='round';c.beginPath();c.moveTo(0,-r*.8);c.quadraticCurveTo(-r*.08,-r*1.12,r*.18,-r*1.21);c.stroke();
  c.fillStyle='#352936';for(const dx of [-.32,.32]){c.fillStyle='#352936';c.beginPath();if(variant%2)c.ellipse(dx*r,-r*.12,r*.15,r*.2,0,0,TAU);else{c.moveTo((dx-.16)*r,0);c.lineTo(dx*r,-r*.3);c.lineTo((dx+.16)*r,0);}c.fill();oval(c,(dx+.035)*r,-r*.07,r*.065,r*.08,'#ffebae');}
  c.strokeStyle='#3c2935';c.lineWidth=r*.13;c.beginPath();c.arc(0,r*.1,r*.39,.18,Math.PI-.18);c.stroke();c.strokeStyle='#ffd087';c.lineWidth=r*.045;c.stroke();
  oval(c,-r*.6,r*.2,r*.13,r*.07,'#ffca9c80');oval(c,r*.6,r*.2,r*.13,r*.07,'#ffca9c80');c.restore();
 }
 function spirit(c,x,y,r,phase=0){
  c.save();c.translate(x,y+Math.sin(phase)*r*.08);glow(c,0,0,r*2.2,'#c9b9fb1c');
  const g=c.createLinearGradient(0,-r,0,r);g.addColorStop(0,'#f0e8f4ed');g.addColorStop(1,'#b2b5d591');c.fillStyle=g;c.strokeStyle='#eff1db80';c.lineWidth=r*.035;
  c.beginPath();c.moveTo(-r*.65,r*.7);c.bezierCurveTo(-r*.85,-r*.8,r*.7,-r*1.3,r*.7,r*.3);c.quadraticCurveTo(r*.84,r*.7,r,r*.72);c.quadraticCurveTo(r*.5,r*1.04,r*.3,r*.6);c.quadraticCurveTo(0,r*1.02,-r*.2,r*.65);c.quadraticCurveTo(-r*.4,r,-r*.65,r*.7);c.fill();c.stroke();
  for(const dx of [-.25,.25]){oval(c,dx*r,-r*.05,r*.095,r*.16,'#3f3558');oval(c,(dx-.025)*r,-r*.11,r*.026,r*.04,'#fff9eb');oval(c,dx*r*1.75,r*.18,r*.12,r*.06,'#e8a4b88c');}
  c.strokeStyle='#685174';c.lineWidth=r*.045;c.beginPath();c.arc(0,r*.15,r*.12,0,Math.PI);c.stroke();c.restore();
 }
 function visible(a,x,y,r=180){return x+r>a.camera.x&&y+r>a.camera.y&&x-r<a.camera.x+a.width/a.camera.scale&&y-r<a.camera.y+a.height/a.camera.scale;}
 function water(c,a){
  c.save();const phase=a.reduced?0:a.phase;
  for(let y=240;y<a.W.height-120;y+=230)for(let x=200;x<a.W.width-100;x+=340){if(!visible(a,x,y,250)||!a.N.water(x,y,45))continue;
   const drift=Math.sin(phase*.65+x)*25,g=c.createRadialGradient(x+drift,y,10,x+drift,y,210);g.addColorStop(0,'#c1b4d226');g.addColorStop(.5,'#8c9dae13');g.addColorStop(1,'#8c9dae00');c.save();c.translate(x+drift,y);c.scale(1,.33);c.translate(-x-drift,-y);oval(c,x+drift,y,210,210,g);c.restore();
   for(let i=0;i<4;i++){const px=x-70+i*44,py=y+Math.sin(i+x+phase)*9;oval(c,px,py,1.7,1.3,'#d9c4f275');}
  }
  for(const [i,p]of a.W.ports.entries()){const x=p.x+(p.shore.x===p.x?95:(p.shore.x>p.x?-85:85)),y=p.y+55;if(visible(a,x,y)&&a.N.water(x,y,25)){oval(c,x,y+18,23,6,'#dabb8340');pumpkin(c,x,y,9,i);if(i%2===0)spirit(c,x+30,y-15,10,phase+i);}}
  c.restore();
 }
 function harbours(c,a){
  c.save();const phase=a.reduced?0:a.phase;
  for(const [i,p]of a.W.ports.entries()){if(!visible(a,p.x,p.y,220))continue;c.save();c.translate(p.shore.x,p.shore.y);const vertical=p.shore.x===p.x,angle=!vertical?(p.shore.x>p.x?-Math.PI/2:Math.PI/2):p.shore.y>p.y?Math.PI:0;c.rotate(angle);const upright=(fn,x,y,...args)=>{c.save();c.translate(x,y);c.rotate(-angle);fn(c,0,0,...args);c.restore();};
   c.strokeStyle='#d9b28b';c.lineWidth=1;c.beginPath();c.moveTo(-88,-35);c.quadraticCurveTo(0,-5,88,-35);c.stroke();
   for(let j=0;j<7;j++){const x=-78+j*26,y=-32+12*(1-Math.abs(x)/88);c.fillStyle=j%2?'#b5a5ce':'#e7a466';c.beginPath();c.moveTo(x-5,y);c.lineTo(x+5,y);c.lineTo(x,y+10);c.closePath();c.fill();}
   upright(pumpkin,-69,-12,14,i);upright(pumpkin,76,-17,18,i+1);upright(pumpkin,52,-12,10,i);upright(spirit,-36,-42,13,phase+i);
   // A crescent-and-cat festival sign beside the quay, away from its mooring ring.
   oval(c,107,-42,18,21,'#473b58');c.strokeStyle='#bda1b3';c.lineWidth=1;c.stroke();oval(c,110,-47,9,9,'#f1cc8d');oval(c,114,-49,8,8,'#473b58');
   c.fillStyle='#d1bdde';c.beginPath();c.moveTo(97,-26);c.lineTo(98,-38);c.lineTo(103,-34);c.lineTo(109,-38);c.lineTo(114,-26);c.fill();oval(c,102,-29,1,1.5,'#513d5b');oval(c,109,-29,1,1.5,'#513d5b');c.restore();
  }c.restore();
 }
 function boat(c,phase,reduced){c.save();pumpkin(c,19,-8,5.5);pumpkin(c,19,8,5);c.strokeStyle='#bda2d2';c.lineWidth=.9;c.beginPath();c.moveTo(-20,-10);c.quadraticCurveTo(-8,-16,5,-9);c.stroke();for(let i=0;i<4;i++)oval(c,-18+i*6,-11-Math.sin(i)*2,1.4,1.4,i%2?'#ffc77c':'#d9bef6');
  c.fillStyle='#41334f';c.strokeStyle='#c19bba';c.lineWidth=.6;c.beginPath();c.moveTo(-9,-7);c.lineTo(-5,-20);c.quadraticCurveTo(-3,-25,3,-22);c.lineTo(1,-18);c.lineTo(5,-7);c.closePath();c.fill();c.stroke();oval(c,-2,-7,10,2.4,'#655174');c.strokeStyle='#e2ab73';c.lineWidth=2;c.beginPath();c.moveTo(-6,-12);c.lineTo(2,-12);c.stroke();spirit(c,-26,10,5,reduced?0:phase);c.restore();}
 function preview(c,w,h){c.save();c.scale(w/640,h/220);c.fillStyle='#282e42';c.fillRect(0,0,640,220);const g=c.createRadialGradient(460,70,0,460,70,180);g.addColorStop(0,'#a18abd44');g.addColorStop(1,'#44345600');oval(c,460,70,180,150,g);for(let i=0;i<12;i++)oval(c,35+i*51,45+(i*37)%105,1.3,1.3,'#c8bcdb');c.strokeStyle='#a491b655';c.lineWidth=2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(15,165+i*12);c.bezierCurveTo(190,140+i*12,390,199+i*5,625,157+i*12);c.stroke();}pumpkin(c,165,138,56);pumpkin(c,241,162,31,1);spirit(c,400,103,48);spirit(c,481,147,25,2);c.restore();}
 window.VoyageHalloween={KEY,load,save,pumpkin,spirit,water,harbours,boat,preview};
})();
