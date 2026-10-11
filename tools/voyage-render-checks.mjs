/* Optional native Canvas art inspection; this renders no CSS and launches no browser. */
import {createRequire} from 'node:module';
const {createCanvas} = createRequire(import.meta.url)('@napi-rs/canvas');
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {boot} from './voyage-ui-checks.mjs';
const out = process.argv[2];
if (!out) throw Error('Usage: node tools/voyage-render-checks.mjs <output-directory>');
fs.mkdirSync(out, {recursive: true});
for (const [id, port] of [['market-lights','market'],['canal-lanterns','canal'],['lighthouse-beam','island']]) {
  const r = boot(({state, moor, L}) => {
    moor('metro'); L.acceptPhotos(state, 'yumi'); moor('observatory'); L.acceptPhotos(state, 'mio');
    moor(port); state.docked = null; state.ship.x -= 30;
  }, {canvasFactory: createCanvas});
  r.frame(1000); r.click(r.nodes.get('photo-button'));
  r.click(r.find('panel-content','Take photograph'));
  const image = JSON.parse(r.saved.get('neon-tides:voyage:profile:v1')).album[0];
  assert.equal(image.id, id); assert.ok(image.image.length <= 250000);
  const bytes = Buffer.from(image.image.split(',')[1], 'base64');
  const extension = image.image.startsWith('data:image/webp') ? '.webp' : '.png';
  fs.writeFileSync(out + '/' + id + extension, bytes);
  console.log(id + ': ' + bytes.length + ' bytes; actual game scenery rendered.');
}
for (const charm of ['fish','cup','pennant','star']) {
  const r = boot(({saved,Pr}) => { const p=Pr.create();Pr.hydrate(p);p.charms=[charm];p.look.charm=charm;saved.set('neon-tides:voyage:profile:v1',JSON.stringify(p)); }, {canvasFactory: createCanvas, reduced: true});
  r.frame(1000); fs.writeFileSync(out + '/tern-' + charm + '.png', r.nodes.get('sea').native.toBuffer('image/png'));
}
console.log('Native Canvas photograph and decoration renders complete; browser layout remains untested.');
