/* Decorative contours remain inside the existing collision clearance. */
(function(){
  'use strict';
  function contour(a,seed){const out=[],sample=(x,y,nx,ny,t)=>{const d=Math.sin(t*2.1+seed)*4+Math.sin(t*4.7+seed*.3)*2;out.push({x:x+nx*d,y:y+ny*d});};const nx=Math.max(3,Math.ceil(a.w/48)),ny=Math.max(3,Math.ceil(a.h/48));for(let i=0;i<=nx;i++)sample(a.x+a.w*i/nx,a.y,0,-1,i);for(let i=1;i<=ny;i++)sample(a.x+a.w,a.y+a.h*i/ny,1,0,i+nx);for(let i=1;i<=nx;i++)sample(a.x+a.w-a.w*i/nx,a.y+a.h,0,1,i+nx+ny);for(let i=1;i<ny;i++)sample(a.x,a.y+a.h-a.h*i/ny,-1,0,i+2*nx+ny);return out;}
  function path(c,points){c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();}
  function draw(c,scene){const {W,camera,width,height}=scene;c.save();for(const [i,a]of W.land.entries()){
    if(window.VoyageSeaBoundary.isPerimeter(a,W))continue;
    if(camera&&(a.x+a.w+40<camera.x||a.y+a.h+40<camera.y||a.x-40>camera.x+width/camera.scale||a.y-40>camera.y+height/camera.scale))continue;
    const natural=a.x>=3400||a.x===1350||a.x===2930,points=contour(a,i+1);
    c.fillStyle='#85b2a510';c.beginPath();c.roundRect(a.x-24,a.y-24,a.w+48,a.h+48,32);c.fill();
    if(natural){path(c,points);c.lineJoin='round';c.strokeStyle='#87b6a71b';c.lineWidth=27;c.stroke();c.strokeStyle='#a7b3a238';c.lineWidth=12;c.stroke();c.fillStyle='#536a60';c.fill();c.strokeStyle='#7e9380';c.lineWidth=2;c.stroke();
      c.save();path(c,points);c.clip();const g=c.createLinearGradient(a.x,a.y,a.x+a.w,a.y+a.h);g.addColorStop(0,'#647a65');g.addColorStop(1,'#344f4c');c.fillStyle=g;c.fillRect(a.x+7,a.y+7,a.w-14,a.h-14);for(let j=0;j<12;j++){const x=a.x+18+(j*73%(Math.max(1,a.w-36))),y=a.y+18+(j*41%(Math.max(1,a.h-36)));c.fillStyle=j%2?'#91a18033':'#263e3b33';c.beginPath();c.ellipse(x,y,11,5,j*.6,0,Math.PI*2);c.fill();}c.restore();
      for(let j=1;j<points.length;j+=4){const p=points[j];c.fillStyle='#7c8980';c.beginPath();c.ellipse(p.x,p.y,4+j%3,2+j%2,j*.5,0,Math.PI*2);c.fill();c.strokeStyle='#b4baa033';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,8,0,Math.PI);c.stroke();}
    }else{c.fillStyle='#536861';c.beginPath();c.roundRect(a.x,a.y,a.w,a.h,12);c.fill();c.strokeStyle='#799081';c.lineWidth=2;c.stroke();c.fillStyle='#394f4b';c.beginPath();c.roundRect(a.x+8,a.y+8,Math.max(1,a.w-16),Math.max(1,a.h-16),7);c.fill();}
  }c.restore();}
  function moments(c,s,phase,reduced){
    c.save();const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    if(s.crateMystery?.stage==='done'){const metro=s.crateMystery.ending==='platform',x=metro?265:1442,y=metro?1097:1010;rect(x,y,67,19,'#98785e');for(let i=0;i<3;i++){c.fillStyle='#dfd0aa';c.beginPath();c.ellipse(x+12+i*20,y+5,6,2.5,0,0,Math.PI*2);c.fill();}window.VoyageHarbourArt.figure(c,'visitor',x+9,y+31,phase,{coat:'#759ba0',hair:'#c2bcaa'},reduced);if(!reduced){c.strokeStyle='#eadaba77';c.lineWidth=1;c.beginPath();c.moveTo(x+30,y);c.bezierCurveTo(x+34+Math.sin(phase)*3,y-9,x+25,y-15,x+31,y-24);c.stroke();}}
    for(const [i,g]of (s.supper?.served||[]).entries()){const p=window.VoyageWorld.ports.find(p=>p.id===g.id);if(!p)continue;const vertical=p.shore.x===p.x,x=p.shore.x+(vertical?i*5-25:28),y=p.shore.y+(vertical?(p.shore.y<p.y?-29:25):i*5-25);rect(x,y,34,12,'#a18867');for(let j=0;j<2;j++){c.fillStyle='#e4d8b4';c.beginPath();c.ellipse(x+9+j*16,y+4,5,2,0,0,Math.PI*2);c.fill();}rect(x+11,y-9,12,7,'#d5bd87');}
    c.restore();
  }
  window.VoyageShorelineArt={contour,draw,moments};
})();
