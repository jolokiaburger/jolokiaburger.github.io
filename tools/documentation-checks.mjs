/* Validate maintained documentation and the production asset inventory. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const list = dir => fs.readdirSync(path.join(root, dir), {withFileTypes: true})
  .flatMap(entry => entry.isDirectory() ? list(path.posix.join(dir, entry.name)) : [path.posix.join(dir, entry.name)])
  .sort();
const sourceFiles = [
  ...fs.readdirSync(root).filter(file => /\.(js|html|css|webmanifest)$/.test(file)),
  ...list('voyage').filter(file => /\.(js|html|css)$/.test(file))
].sort();
const sources = new Map(sourceFiles.map(file => [file, read(file)]));
const dynamic = new Map();
function selected(file, source) {
  assert(fs.existsSync(path.join(root, file)), 'Missing selected asset: ' + file);
  dynamic.set(file, [...new Set([...(dynamic.get(file) || []), source])].sort());
}

// Resolve portrait filenames through the actual selector rather than guessing suffixes.
const context = vm.createContext({window: {}});
for (const file of ['trade.js', 'market.js', 'voyage/world-map.js', 'voyage/regions.js', 'voyage/navigation.js', 'voyage/ports.js']) {
  vm.runInContext(read(file), context, {filename: file});
}
const ports = context.window.VoyagePorts;
for (const id of Object.keys(ports.characters)) {
  for (const mood of ['relaxed', 'thoughtful', 'pleased']) {
    selected(path.posix.normalize(path.posix.join('voyage', ports.portrait(id, mood))), 'voyage/ports.js');
  }
}
for (const [, file] of sources.get('voyage/leisure-ui.js').matchAll(/file:\s*'([a-z-]+)'/g)) {
  selected('assets/scenes/' + file + '-dockside.webp', 'voyage/leisure-ui.js');
}
for (const [, file] of sources.get('voyage/breakwater-ui.js').matchAll(/'([a-z-]+-dockside)'/g)) {
  selected('assets/scenes/' + file + '.webp', 'voyage/breakwater-ui.js');
}

function dimensions(buffer, format) {
  if (format === 'svg') {
    const box = buffer.toString('utf8').match(/viewBox="([^"]+)"/);
    assert(box, 'SVG requires viewBox');
    const [, , width, height] = box[1].trim().split(/\s+/).map(Number);
    assert(width > 0 && height > 0, 'Invalid SVG viewBox');
    return {width, height, unit: 'viewBox'};
  }
  if (format === 'png') {
    assert.equal(buffer.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    return {width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), unit: 'px'};
  }
  assert.equal(format, 'webp', 'Unsupported asset format');
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  for (let offset = 12; offset + 8 <= buffer.length;) {
    const tag = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4), data = offset + 8;
    if (tag === 'VP8X') return {width: buffer.readUIntLE(data + 4, 3) + 1, height: buffer.readUIntLE(data + 7, 3) + 1, unit: 'px'};
    if (tag === 'VP8 ') return {width: buffer.readUInt16LE(data + 6) & 0x3fff, height: buffer.readUInt16LE(data + 8) & 0x3fff, unit: 'px'};
    if (tag === 'VP8L') {
      const bits = buffer.readUInt32LE(data + 1);
      return {width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, unit: 'px'};
    }
    offset = data + size + (size % 2);
  }
  throw Error('Missing WebP image dimensions');
}

const inventory = list('assets').map(file => {
  const buffer = fs.readFileSync(path.join(root, file));
  const format = path.extname(file).slice(1);
  const references = [...new Set([
    ...sourceFiles.filter(source => sources.get(source).includes(file)),
    ...(dynamic.get(file) || [])
  ])].sort();
  return {
    path: file,
    category: file.startsWith('assets/portraits/') ? 'portrait' : file.startsWith('assets/scenes/') ? 'scene' : file.startsWith('assets/sprites/') ? 'sprite' : 'icon',
    format,
    dimensions: dimensions(buffer, format),
    bytes: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    reference_status: references.length ? 'source-referenced' : 'retained',
    references
  };
});
const manifest = {schema_version: 1, artwork_license: 'CC-BY-4.0', assets: inventory};
const manifestFile = path.join(root, 'tools/asset-manifest.json');
if (process.argv.includes('--update-assets')) {
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
}
assert.deepEqual(JSON.parse(fs.readFileSync(manifestFile, 'utf8')), manifest,
  'Asset metadata differs; review changes and run node tools/documentation-checks.mjs --update-assets');

const docs = fs.readdirSync(root).filter(file => file.endsWith('.md')).sort();
function anchorSet(text) {
  const anchors = new Set(), counts = new Map();
  for (const [, title] of text.matchAll(/^#{1,6}\s+(.+)$/gm)) {
    const slug = title.toLowerCase().replace(/[`*_]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
    const count = counts.get(slug) || 0;
    anchors.add(slug + (count ? '-' + count : ''));
    counts.set(slug, count + 1);
  }
  return anchors;
}
let links = 0, references = 0;
for (const file of docs) {
  const text = read(file);
  assert(!/\b(?:ai|openai|prompts?|assistant)\b/i.test(text), 'Non-production wording in ' + file);
  for (const [, target] of text.matchAll(/\[[^\]\n]+\]\(([^\s)]+)\)/g)) {
    if (/^[a-z][a-z\d+.-]*:/i.test(target)) continue;
    const [resource, fragment] = target.split('#');
    const local = path.resolve(root, path.dirname(file), resource || file);
    assert(local === root || local.startsWith(root + path.sep), 'Link outside repository in ' + file);
    assert(fs.existsSync(local), file + ': missing link ' + target);
    if (fragment && path.extname(local) === '.md') assert(anchorSet(fs.readFileSync(local, 'utf8')).has(decodeURIComponent(fragment)), file + ': missing anchor ' + target);
    links++;
  }
  for (const [, reference] of text.matchAll(/`([^`\n]+)`/g)) {
    if (!/^(?:[\w.-]+\/)*[\w.-]+\.(?:md|js|mjs|css|html|json|webmanifest|webp|png|svg)$/.test(reference)) continue;
    assert(fs.existsSync(path.join(root, reference)), file + ': missing source reference ' + reference);
    references++;
  }
}
for (const file of ['classic.html', 'voyage/index.html', 'index.html']) {
  const html = read(file), ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, file + ': duplicate HTML IDs');
  for (const [, target] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(target)) continue;
    const resource = target.split(/[?#]/)[0];
    assert(fs.existsSync(path.resolve(root, path.dirname(file), resource)), file + ': missing resource ' + target);
  }
}
console.log('Documentation checks passed: ' + docs.length + ' guides, ' + links + ' local links, ' + references + ' code references, ' + inventory.length + ' verified assets and three entry pages.');
