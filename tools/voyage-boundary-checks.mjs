/* Decorative boundary and portrait contracts; optional native pixel verification. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const context = vm.createContext({window: {}});
for (const file of ['trade.js','market.js','voyage/world-map.js','voyage/regions.js','voyage/navigation.js','voyage/ports.js','voyage/model.js','voyage/sea-boundary.js']) {
  vm.runInContext(read(file), context, {filename: file});
}
const {VoyageSeaBoundary:F,VoyageWorld:W,VoyageModel:M,VoyageNavigation:N,VoyagePorts:P}=context.window;
const state=M.create('boundary-check'), geometry=JSON.stringify(W.land), original=JSON.stringify(state);
assert.equal(F.bounds(W,state).right,3350);
state.breakwater={chapter:1};assert.equal(F.bounds(W,state).right,3350);
state.breakwater.chapter=2;assert.equal(F.bounds(W,state).right,5065);
state.breakwater.chapter=3;assert.equal(F.bounds(W,state).right,5065);
delete state.breakwater;
assert.equal(W.land.filter(a=>F.isPerimeter(a,W)).length,4);
for(const id of ['landing','bar','market','metro','yard','pier','canal','island','observatory']) {
  const p=W.ports.find(p=>p.id===id),b=F.bounds(W,state);
  assert(p.x>b.left+155&&p.x<b.right-155&&p.y>b.top+155&&p.y<b.bottom-155,'Quay must remain outside the veil: '+id);
}

function recorder() {
  const stack=[],operations=[];
  const ctx={globalAlpha:.4,globalCompositeOperation:'screen',fillStyle:'#abcdef',operations,
    save(){stack.push([this.globalAlpha,this.globalCompositeOperation,this.fillStyle]);},
    restore(){[this.globalAlpha,this.globalCompositeOperation,this.fillStyle]=stack.pop();},
    fillRect(x,y,w,h){operations.push({kind:'rect',x,y,w,h,colour:this.fillStyle,alpha:this.globalAlpha});},
    createLinearGradient(){operations.push({kind:'linear'});return {addColorStop(){}};},
    createRadialGradient(){operations.push({kind:'radial'});return {addColorStop(){}};},
    translate(){},scale(){},beginPath(){},arc(){},closePath(){},fill(){},lineTo(){},moveTo(){},
    quadraticCurveTo(...points){operations.push({kind:'curve',points});}
  };
  return ctx;
}
const scene={W,state,camera:{x:3100,y:400,scale:1},width:600,height:600};
const a=recorder();F.draw(a,scene);
assert(a.operations.some(r=>r.kind==='rect'&&r.x<=3350&&r.x+r.w>3350&&r.alpha===1),'Locked region requires opaque coverage');
assert(a.operations.some(r=>r.kind==='radial')&&a.operations.some(r=>r.kind==='curve'),'Boundary requires soft clouds and curved contours');
assert.equal(a.globalAlpha,.4);assert.equal(a.globalCompositeOperation,'screen');assert.equal(a.fillStyle,'#abcdef');
const b=recorder();F.draw(b,scene);assert.equal(JSON.stringify(a.operations),JSON.stringify(b.operations),'Boundary is deterministic and independent of animation time');
const centre=recorder();F.draw(centre,{...scene,camera:{x:1600,y:700,scale:1},width:350,height:250});
assert.equal(centre.operations.length,0,'Interior views must skip offscreen fog work');
F.draw(recorder(),{...scene,palette:'chart'});
assert.equal(JSON.stringify(state),original,'Boundary must not mutate voyage state');
assert.equal(JSON.stringify(W.land),geometry,'Boundary must not mutate collision geometry');
assert(N.water(3300,850)&&!N.water(5100,850),'Navigation retains its actual limits');
for(const mood of ['relaxed','thoughtful','pleased']) {
  const portrait=P.portrait('mio',mood);
  assert.equal(portrait,'../assets/portraits/mio-'+mood+'-observatory.webp');
  assert(fs.existsSync(new URL(portrait.replace('../',''),root)));
}
assert.equal(P.characters.mio.portrait,P.portrait('mio','relaxed'),'Default portrait and expression selector agree');

let canvas;
try {canvas=createRequire(import.meta.url)('@napi-rs/canvas');}
catch(error) {if(error.code!=='MODULE_NOT_FOUND')throw error;}
if(canvas) {
  const image=canvas.createCanvas(600,600),c=image.getContext('2d');
  const paint=()=>{c.fillStyle='#6a9dad';c.fillRect(0,0,600,600);c.save();c.translate(-3050,-500);F.draw(c,{W,state,camera:{x:3050,y:500,scale:1},width:600,height:600});c.restore();};
  const pixel=(x,y)=>Array.from(c.getImageData(x,y,1,1).data);
  paint();
  assert(pixel(460,250)[0]<15&&pixel(460,250)[1]<35,'Forbidden coast must be covered');
  assert.deepEqual(pixel(40,250),[106,157,173,255],'Interior water remains unchanged');
  const samples=Array.from({length:10},(_,i)=>pixel(250,40+i*50)[0]);
  assert(Math.max(...samples)-Math.min(...samples)>5,'Fog contour must vary along the limit');
  assert(pixel(220,250)[0]>pixel(285,250)[0],'Veil must feather toward allowed water');
  state.breakwater={chapter:2};paint();
  assert.deepEqual(pixel(460,250),[106,157,173,255],'Unlock must immediately reveal the coast');
  delete state.breakwater;
  console.log('Native boundary pixels verified: opaque limit, irregular feathering and coast unlock.');
} else console.log('Native pixel review requires the optional @napi-rs/canvas development dependency.');
console.log('Boundary and Mio portrait contracts passed; simulation, geometry and drawing state are preserved.');
