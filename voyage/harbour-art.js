/* Decorative Canvas artwork only. Navigation, prices and saves stay in their own modules. */
(function () {
  'use strict';
  const TAU = Math.PI * 2;
  let waterWorld, jellyfish = [], fish = [];

  function stroke(ctx, x1, y1, x2, y2, colour, width = 1) {
    ctx.strokeStyle = colour; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function box(ctx, x, y, w, h, radius, fill, edge) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill; ctx.fill();
    if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = .8; ctx.stroke(); }
  }
  function ellipse(ctx, x, y, rx, ry, colour) {
    ctx.fillStyle = colour; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill();
  }
  function visible(scene, x, y, margin = 35) {
    const {camera, width, height} = scene;
    return x + margin > camera.x && y + margin > camera.y &&
      x - margin < camera.x + width / camera.scale && y - margin < camera.y + height / camera.scale;
  }
  function prepareWater(W, N) {
    if (waterWorld === W) return;
    waterWorld = W; jellyfish = []; fish = [];
    let seed = 33409;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const centres = [[1490,435],[550,425],[1430,782],[530,955],[1120,1330],
      [1910,620],[1850,1480],[1300,1665],[2850,920],[2225,1565],[890,780]];
    for (const [cx, cy] of centres) {
      for (let i = 0; i < 5; i++) {
        const x = cx + (random() - .5) * 180, y = cy + (random() - .5) * 112;
        if (N.water(x, y, 26)) jellyfish.push({x, y, r: 3.5 + random() * 2.4, phase: random() * TAU, rose: random() > .78});
      }
    }
    for (let i = 0; i < 28; i++) {
      const x = 140 + random() * (W.width - 280), y = 130 + random() * (W.height - 260);
      if (N.water(x, y, 60)) fish.push({x, y, angle: random() * TAU, phase: random() * TAU});
    }
  }
  function water(ctx, scene) {
    const {W, N, camera, width, height, phase, weather, ghost} = scene;
    prepareWater(W, N);
    ctx.save();
    // Curved ripples are drawn only in the visible water; the land is painted afterwards.
    const left = Math.max(20, Math.floor(camera.x / 80) * 80), top = Math.max(45, Math.floor(camera.y / 47) * 47);
    const right = Math.min(W.width, camera.x + width / camera.scale + 80);
    const bottom = Math.min(W.height, camera.y + height / camera.scale + 47);
    for (let y = top; y < bottom; y += 47) for (let x = left; x < right; x += 80) {
      const offset = Math.sin(x * .013 + y * .02 + phase) * 4;
      const xx = x + Math.sin(y * .013) * 12, yy = y + offset;
      ctx.strokeStyle = ghost ? '#a9b4bf17' : '#95bdb522'; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.moveTo(xx, yy);
      ctx.bezierCurveTo(xx + 7, yy - 1.7, xx + 17, yy + 1.7, xx + 26, yy); ctx.stroke();
      if ((x / 80 + y / 47) % 3 < 1) stroke(ctx, xx + 8, yy + 5, xx + 17, yy + 5, '#accdc016', .7);
    }
    for (const j of jellyfish) {
      if (!visible(scene, j.x, j.y)) continue;
      const drift = Math.sin(phase * .65 + j.phase), x = j.x + drift * 6, y = j.y + Math.cos(phase * .5 + j.phase) * 4;
      const pulse = .95 + Math.sin(phase * 2 + j.phase) * .07, r = j.r * pulse;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 3.1);
      glow.addColorStop(0, j.rose ? '#d4add638' : '#a3e8d93a'); glow.addColorStop(1, 'transparent');
      ellipse(ctx, x, y, r * 3.1, r * 2.8, glow);
      ctx.fillStyle = j.rose ? '#c3a7cf60' : '#93d6cb66';
      ctx.strokeStyle = j.rose ? '#e1cad888' : '#b5f0df99'; ctx.lineWidth = .65;
      ctx.beginPath(); ctx.moveTo(x - r, y + 1);
      ctx.bezierCurveTo(x - r, y - r * 1.5, x + r, y - r * 1.5, x + r, y + 1);
      ctx.quadraticCurveTo(x, y + r * .6, x - r, y + 1); ctx.fill(); ctx.stroke();
      for (let i = -1; i <= 1; i++) {
        const sway = Math.sin(phase * 1.3 + j.phase + i) * 2;
        ctx.strokeStyle = j.rose ? '#d1b8d65c' : '#abdacf66';
        ctx.beginPath(); ctx.moveTo(x + i * r * .42, y + 1);
        ctx.bezierCurveTo(x + i * 2 - sway, y + r, x + i * 2 + sway, y + r * 1.5, x + i * 2 + sway, y + r * 2.5); ctx.stroke();
      }
      ellipse(ctx, x - r * .22, y - r * .45, r * .25, r * .16, '#e2f5df70');
    }
    for (const f of fish) {
      if (!visible(scene, f.x, f.y, 50)) continue;
      ctx.save(); ctx.translate(f.x + Math.sin(phase * .5 + f.phase) * 12, f.y + Math.cos(phase * .4 + f.phase) * 7); ctx.rotate(f.angle);
      for (let i = 0; i < 4; i++) {
        const x = -i * 7, y = i % 2 ? 4 : -2;
        ellipse(ctx, x, y, 2.7, .9, '#7caaa044');
        stroke(ctx, x - 3, y, x - 5, y - 1.5, '#8bb7aa3c', .7);
        stroke(ctx, x - 3, y, x - 5, y + 1.5, '#8bb7aa3c', .7);
      }
      ctx.restore();
    }
    // Small rain rings and a few petals near the locks, never new interaction markers.
    if (weather.rain > .1) for (let i = 0; i < 18; i++) {
      const x = 210 + (i * 257) % 2980, y = 110 + (i * 193) % 1560;
      if (!visible(scene, x, y) || !N.water(x, y, 10)) continue;
      const age = (phase * 1.3 + i * .31) % 1;
      ctx.strokeStyle = 'rgba(166,203,200,' + ((1 - age) * weather.rain * .12) + ')'; ctx.lineWidth = .7;
      ctx.beginPath(); ctx.ellipse(x, y, 2 + age * 9, 1 + age * 4, 0, 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const x = 1830 + (i * 41) % 85 + Math.sin(phase * .4 + i) * 3, y = 1300 + i * 32;
      if (visible(scene, x, y)) ellipse(ctx, x, y, 1.8, 1, '#d5b3b16b');
    }
    ctx.restore();
  }
  function pot(ctx, x, y, colour = '#82a17b') {
    box(ctx, x - 3, y, 7, 6, 1, '#ad7c5b', '#d5aa7b80');
    ellipse(ctx, x, y - 2, 4, 3, colour); ellipse(ctx, x - 2, y - 3, 2, 2, '#a2b78d');
  }
  function quays(ctx, scene) {
    const {W, phase, ghost} = scene;
    ctx.save();
    for (const p of W.ports) {
      if (!visible(scene, p.shore.x, p.shore.y, 150)) continue;
      const vertical = p.shore.x === p.x;
      ctx.save(); ctx.translate(p.shore.x, p.shore.y);
      if (!vertical) ctx.rotate(Math.PI / 2);
      if (vertical && p.shore.y > p.y) ctx.rotate(Math.PI);
      // Stone courses, salt marks, moss and a gentle reflection below the quay face.
      box(ctx, -109, -5, 218, 6, 1, '#71887c', '#b1bb9a66');
      box(ctx, -109, 1, 218, 5, 1, '#293f42');
      for (let i = -100; i < 100; i += 17) {
        stroke(ctx, i, -4, i + 1, 1, '#3e545077', .7);
        if (i % 3) stroke(ctx, i, 3, i + 7, 3, '#6e9c7555', 1.4);
      }
      for (const x of [-92, 92]) {
        box(ctx, x - 4, -12, 8, 8, 1, '#314348', '#9aa48b');
        ellipse(ctx, x, -10, 2.6, 1.6, '#aab199');
        stroke(ctx, x + 7, -15, x + 20, -15, '#c4b69377');
        for (let i = 0; i < 8; i++) {
          const yy = 11 + i * 5.5, sway = Math.sin(phase * .75 + i + p.x) * 2;
          stroke(ctx, x - 5 + sway, yy, x + 5 - sway + Math.sin(i) * 3, yy, ghost ? '#e9a967' + ['38','31','29','23','1a','13','0d','07'][i] : p.color + ['38','31','29','23','1a','13','0d','07'][i], 1.8);
        }
      }
      // A small quay lamp has a shade and base rather than a floating luminous dot.
      box(ctx, -104, -27, 3, 16, 1, '#455552'); box(ctx, -108, -31, 11, 6, 1, '#6c7867', '#c1b68b88');
      box(ctx, -106, -28, 7, 3, .7, ghost ? '#efb775' : '#e5ca98');
      ctx.restore();
    }
    // A restrained layer of practical details gives every working quay its own materials.
    for (const a of W.land) {
      if (a.w < 100 || a.h < 80 || !visible(scene, a.x + a.w / 2, a.y + a.h / 2, Math.max(a.w, a.h))) continue;
      for (let i = 0; i < 14; i++) {
        const x = a.x + 14 + (i * 47) % (a.w - 28), y = a.y + 12 + (i * 61) % (a.h - 24);
        stroke(ctx, x, y, x + 4, y - 1, '#a1a58a17', .8);
      }
    }
    [ [1218,299],[1422,305],[468,298],[1602,1021],[2308,1369],[2142,1494],[2965,841] ].forEach(([x,y]) => {
      if (visible(scene,x,y)) pot(ctx,x,y);
    });
    // Kurage's dry lane: a tiny sleeping cat, stacked ceramics and a towel.
    ellipse(ctx, 1450,287,8,4,'#081e2866'); ellipse(ctx,1449,284,7,3.4,'#c5966b');
    ellipse(ctx,1454,282,3,2.6,'#d2ac7c');
    stroke(ctx,1453,280,1452,278,'#d2ac7c',1.8); stroke(ctx,1456,280,1457,278,'#d2ac7c',1.8);
    stroke(ctx,1443,285,1441,282,'#d9b989',2);
    for(let i=0;i<3;i++) ellipse(ctx,1403,291-i*2,4,1.7,'#c7d1b9');
    box(ctx,1240,289,12,5,1,'#d0c8ab'); stroke(ctx,1243,290,1243,293,'#879e91',1);
    // Reused timber and workshop metal, with a perched gull over the yard.
    for(let i=0;i<5;i++) { box(ctx,1061+i*4,1547,3,26,1,'#a1916f'); stroke(ctx,1062+i*4,1551,1062+i*4,1566,'#d1c2a05c',.6); }
    box(ctx,804,1507,16,9,1,'#879a91','#b6c5ac'); stroke(ctx,807,1510,817,1510,'#536a67',1);
    ellipse(ctx,1134,1425,4,2.3,'#d1d5bd'); ellipse(ctx,1138,1423,1.8,1.8,'#e2dfc7'); stroke(ctx,1139,1424,1142,1424,'#c6a16e',1);
    // The canal's wind chime, folded tablecloth and little tea ceramics.
    stroke(ctx,2107,1296,2107,1315,'#bfa77b',.8); ellipse(ctx,2107,1307,3,3,'#aac3b5');
    const swing=Math.sin(phase*.8)*1.5; stroke(ctx,2107,1310,2107+swing,1317,'#bdc9b4',.7); box(ctx,2105+swing,1317,4,7,.5,'#d4bb97');
    box(ctx,2322,1503,15,6,1,'#c6a2a0'); stroke(ctx,2325,1504,2325,1508,'#e2cdc0',.8);
    for(let i=0;i<3;i++) ellipse(ctx,2090+i*8,1485,2.1,1.6,'#ddc8a0');
    // Frostline's insulated door seam and workshop gauges.
    box(ctx,2418,361,10,13,2,'#324d57','#93b2ad'); ellipse(ctx,2423,367,3,3,'#bbc6af'); stroke(ctx,2423,367,2425,365,'#53695f',.7);
    // A small compass/star tile near the observatory's chart table.
    ellipse(ctx,3070,882,10,10,'#c5c7a120');
    for(let i=0;i<8;i++){const angle=i*Math.PI/4;stroke(ctx,3070,882,3070+Math.cos(angle)*(i%2?6:9),882+Math.sin(angle)*(i%2?6:9),'#c8cfac77',.8);}
    ctx.restore();
  }
  function figure(ctx, id, x, y, phase, c, reduced) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(reduced ? 0 : Math.sin(phase + x) * .014);
    ellipse(ctx,3,11,8.8,4.8,'#071d2870');
    box(ctx,-4,10,3.2,7,1,'#23323c'); box(ctx,1,10,3.2,7,1,'#273842');
    box(ctx,-5,16,4.7,2,1,'#142831'); box(ctx,1,16,4.7,2,1,'#142831');
    const cloth=ctx.createLinearGradient(-7,0,7,9);cloth.addColorStop(0,c.coat);cloth.addColorStop(1,'#20343acc');
    ctx.fillStyle=cloth;ctx.beginPath();ctx.moveTo(-3,-2);ctx.quadraticCurveTo(-6,-2,-7,1);ctx.lineTo(-5,12);ctx.quadraticCurveTo(0,14,5,12);ctx.lineTo(7,1);ctx.quadraticCurveTo(6,-2,3,-2);ctx.closePath();ctx.fill();
    stroke(ctx,-6,1,-8,8,c.coat,3.1);stroke(ctx,6,1,8,8,c.coat,3.1);
    ellipse(ctx,-8,9,1.4,1.8,'#c7a88e');ellipse(ctx,8,9,1.4,1.8,'#d7b89b');
    stroke(ctx,-4,2,-3,10,'#c2c4a82a',.7);stroke(ctx,4,3,3,10,'#0a26344c',.7);
    if(c.apron){box(ctx,-4,1,8,11,1,c.apron);stroke(ctx,-3,-1,-2,3,'#e4ccac77',.7);stroke(ctx,3,-1,2,3,'#e4ccac77',.7);box(ctx,-2,6,4,3,.5,'#ead6b326');}
    else{stroke(ctx,0,1,0,11,'#d6ceb047',.6);for(let yy=3;yy<10;yy+=3)ellipse(ctx,1,yy,.45,.45,'#c4ba967d');}
    if(c.office){ctx.fillStyle='#e6e1cc';ctx.beginPath();ctx.moveTo(-3,-1);ctx.lineTo(0,3);ctx.lineTo(3,-1);ctx.closePath();ctx.fill();stroke(ctx,-2,0,0,7,'#7b9fad',.7);box(ctx,-1,6,3,3,.4,'#c9d4c6');}
    ellipse(ctx,0,-4.6,3.7,5.2,'#c8a78d');ellipse(ctx,-1,-5.2,2.9,4.5,'#dfbea0');
    ellipse(ctx,-3.6,-4.4,.8,1.3,'#cea98e');ellipse(ctx,3.6,-4.4,.8,1.3,'#cea98e');
    ctx.fillStyle=c.hair;ctx.beginPath();ctx.moveTo(-4,-6);ctx.bezierCurveTo(-6,-13,4,-15,5,-8);ctx.lineTo(4,-5);ctx.quadraticCurveTo(2,-10,-1,-8);ctx.quadraticCurveTo(-3,-7,-4,-6);ctx.fill();
    if(c.bob){box(ctx,-5,-8,1.7,9,1,c.hair);box(ctx,3.4,-8,1.7,8,1,c.hair);}
    if(c.tie)ellipse(ctx,5,-9,2.6,4.5,c.hair);
    for(let i=0;i<3;i++)stroke(ctx,-3+i*2,-10,-2+i*2,-8,'#d4c5a32d',.55);
    if(c.silver)stroke(ctx,3,-10,4,-5,'#c2c9be',1.1);
    const blink=!reduced&&((phase*5+x*.03)%6.8)<.16;if(blink){stroke(ctx,-2.5,-5.4,-1,-5.4,'#514847',.6);stroke(ctx,1,-5.4,2.5,-5.4,'#514847',.6);}else{ellipse(ctx,-1.8,-5.4,.55,.75,'#514847');ellipse(ctx,1.8,-5.4,.55,.75,'#514847');}stroke(ctx,-.8,-2.1,.8,-2.1,'#9b7669',.55);
    if(['lam','matte','kenji'].includes(id)){stroke(ctx,-2,-1.7,2,-1.7,'#78716a',.55);stroke(ctx,-3,-4.1,-2,-3.9,'#b09079',.5);}
    if(c.glasses){ctx.strokeStyle='#c3b890';ctx.lineWidth=.6;ctx.strokeRect(-3.5,-6.4,2.6,2.2);ctx.strokeRect(.9,-6.4,2.6,2.2);stroke(ctx,-.9,-5.5,.9,-5.5,'#c3b890',.6);}
    if(c.cap){box(ctx,-5,-12,10,3,1,c.coat);stroke(ctx,-5,-9,5,-9,'#b5ad8c',.8);}
    if(c.scarf){const colour=id==='mako'?'#ad785a':'#ded6c0';stroke(ctx,-3,-1,3,-1,colour,2.2);stroke(ctx,2,0,3,5,colour,1.8);}
    if(['nao','jun','lam','aki'].includes(id)){box(ctx,6,5,4,3.7,1,'#ccd4b8','#9aa68b');stroke(ctx,9.5,6,11,6,'#cbd0b6',.8);}
    if(id==='priya'){box(ctx,5,4,5,7,.6,'#738d92','#b8c3a4');stroke(ctx,6,6,9,6,'#dae0c7',.5);}
    if(id==='mei'){stroke(ctx,7,3,10,10,'#b7a078',1.2);ellipse(ctx,10,10,1.8,1.4,'#cdb390');}
    if(['rin','kenji'].includes(id)){stroke(ctx,7,5,10,11,'#abb5a8',1.2);stroke(ctx,6,4,8,3,'#bfc5ac',.9);}
    if(id==='yumi'){stroke(ctx,-5,0,5,10,'#b8aa8c',.8);box(ctx,3,8,6,6,1,'#bfb195','#ded1a8');}
    if(['hana','mio'].includes(id)){box(ctx,4,4,6,6,.5,id==='mio'?'#d5cfad':'#d9bdba');stroke(ctx,5,5,8,5,'#7b9580',.55);}
    if(id==='mio'){
      stroke(ctx,-5,2,-3,7,'#a5b5c06b',.6);stroke(ctx,3,2,5,7,'#a5b5c06b',.6);
      box(ctx,-4,6,3,3,.4,'#355875','#819eac');ellipse(ctx,3.5,2.3,1.2,1.2,'#d4bc7e');
      for(const [px,py]of [[3,1.7],[4,2],[3.8,3],[2.9,2.7]])ellipse(ctx,px,py,.24,.24,'#fff0b8');
      stroke(ctx,5,6,8,6,'#527088',.45);stroke(ctx,5,7.4,8.8,7.4,'#527088',.45);
    }
    ctx.restore();
  }
  function shade(colour, amount) {
    return '#' + [1,3,5].map(i => Math.round(parseInt(colour.slice(i,i+2),16) * amount).toString(16).padStart(2,'0')).join('');
  }
  function roof(ctx, x, y, w, h, colour) {
    ctx.save();
    box(ctx,x+6,y+9,w+2,h+3,3,'#06182080');
    const paint=ctx.createLinearGradient(x,y,x+w*.65,y+h);
    paint.addColorStop(0,colour);paint.addColorStop(.55,shade(colour,.96));paint.addColorStop(1,shade(colour,.78));
    box(ctx,x,y,w,h,3,paint,'#a2b2a075');
    const tiled=parseInt(colour.slice(1,3),16)>parseInt(colour.slice(3,5),16)+7;
    for(let yy=9;yy<h-3;yy+=tiled?11:17){
      stroke(ctx,x+2,y+yy,x+w-2,y+yy,'#20383d37',.65);
      stroke(ctx,x+3,y+yy+1,x+w-3,y+yy+1,'#d3ccaf1d',.55);
      if(tiled)for(let xx=yy%2?12:22;xx<w-3;xx+=24)stroke(ctx,x+xx,y+yy-8,x+xx,y+yy,'#283a3b30',.55);
    }
    if(!tiled)for(let xx=17;xx<w-2;xx+=24){stroke(ctx,x+xx,y+2,x+xx,y+h-3,'#b5c3b138',.65);stroke(ctx,x+xx+1,y+2,x+xx+1,y+h-3,'#233a4240',.6);}
    stroke(ctx,x+w/2,y+2,x+w/2,y+h-2,'#d0c2a56e',2.4);
    stroke(ctx,x+2,y+1,x+w-2,y+1,'#d7cdb36b',1);
    box(ctx,x,y+h-1,w,8,1,shade(colour,.58));
    stroke(ctx,x,y+h+7,x+w,y+h+7,'#081e2b80',1.3);
    stroke(ctx,x+w-1,y+3,x+w-1,y+h+5,'#b6baa082',1.2);
    for(let xx=12;xx<w-7;xx+=25){box(ctx,x+xx,y+h+1,8,3.5,.7,'#dfc08a');stroke(ctx,x+xx+4,y+h+1,x+xx+4,y+h+4,'#978569',.6);}
    for(let i=0;i<4;i++){const xx=x+7+(i*43)%(w-15),yy=y+5+(i*19)%(h-12);stroke(ctx,xx,yy,xx+3,yy+4,'#cee1bd14',.6);}
    if(w>100){
      box(ctx,x+14,y+14,21,28,2,'#253e4b','#94b4b0');
      const glass=ctx.createLinearGradient(x+15,y+15,x+33,y+39);glass.addColorStop(0,'#789d9b');glass.addColorStop(1,'#3c6471');
      box(ctx,x+16,y+16,17,24,1,glass);stroke(ctx,x+19,y+17,x+29,y+33,'#d2e4d455',1);
      box(ctx,x+w-31,y+15,15,20,2,'#53665d','#a3b3a18c');
      box(ctx,x+w-28,y+18,9,12,1,'#293e42');for(let i=0;i<3;i++)stroke(ctx,x+w-27,y+21+i*3,x+w-20,y+21+i*3,'#a1b39b5c',.6);
    }
    ctx.restore();
  }
  function deck(ctx,x,y,w,h,vertical) {
    ctx.save();box(ctx,x+3,y+4,w,h,2,'#071e2866');
    const grain=ctx.createLinearGradient(x,y,x+w,y+h);grain.addColorStop(0,'#8f8d71');grain.addColorStop(1,'#55675f');
    box(ctx,x,y,w,h,2,grain,'#b0aa89');
    const length=vertical?h:w;
    for(let offset=5;offset<length-2;offset+=11){
      if(vertical){
        stroke(ctx,x+2,y+offset,x+w-2,y+offset,'#314849',1);
        stroke(ctx,x+7,y+offset+3,x+w-10,y+offset+3,'#c4b69033',.65);
        for(const xx of [x+4,x+w-4])ellipse(ctx,xx,y+offset+3,.75,.75,'#334748');
      }else{
        stroke(ctx,x+offset,y+2,x+offset,y+h-2,'#314849',1);
        stroke(ctx,x+offset+3,y+7,x+offset+3,y+h-10,'#c4b69033',.65);
        for(const yy of [y+4,y+h-4])ellipse(ctx,x+offset+3,yy,.75,.75,'#334748');
      }
    }
    stroke(ctx,x+1,y+1,x+w-1,y+1,'#cec29a77',1);stroke(ctx,x+1,y+1,x+1,y+h-1,'#bfbea066',1);
    ctx.restore();
  }
  window.VoyageHarbourArt = {water, quays, figure, roof, deck};
})();
