import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SvgCodec } from '../dist/infrastructure/SvgCodec.js';
import { FileDocumentStore } from '../dist/infrastructure/FileDocumentStore.js';
import { Editor } from '../dist/application/Editor.js';
import { CommandDispatcher } from '../dist/cli/CommandDispatcher.js';
import { TreeFormatter } from '../dist/application/TreeFormatter.js';

const codec = new SvgCodec();
test('missing IDs are assigned deterministically after reserving all explicit IDs', () => {
  const [document,warnings] = codec.decode('<svg width="400" height="300"><rect/><g><rect id="rect1"/><text>开始 &amp; End</text></g><circle/></svg>');
  assert.deepEqual(document.all().map(s=>s.id),['rect2','g1','rect1','text1','circle1']);
  assert.equal(warnings[0],'warning: assigned id rect2 to unnamed <rect>');
  assert.equal(warnings.length,4);
  assert.equal(document.require('text1').textContent,'开始 & End');
});
test('all supported shapes, omitted styles, nesting and Unicode survive SVG round trip', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  for (const command of ['init 400 300','create g scene','create rect r 1.5 -2 3 4 in scene','create circle c 5 6 7 red in scene','create ellipse e 8 9 10 11','create line l 1 2 3 4 black','create text t 20 30 "中文 & <tag> \\"quoted\\""','set r stroke-width 1.5']) {
    assert.doesNotMatch(cli.execute(command)[0],/^error:/);
  }
  const xml = codec.encode(editor.document);
  assert.match(xml,/xmlns="http:\/\/www.w3.org\/2000\/svg"/);
  assert.match(xml,/&amp;/); assert.match(xml,/&lt;tag/);
  const [restored,warnings] = codec.decode(xml);
  assert.deepEqual(warnings,[]);
  assert.deepEqual(new TreeFormatter().tree(restored),cli.execute('tree'));
  assert.equal(restored.require('r').attributes().has('fill'),false);
  assert.equal(codec.encode(restored),xml);
});
test('invalid XML, duplicates, unknown elements, attributes and namespaces fail explicitly', () => {
  const cases = [
    '<svg><g></svg>', '<svg><rect id="same"/><g id="same"/></svg>',
    '<svg><path id="p" d="M0 0"/></svg>', '<svg><rect style="fill:red"/></svg>',
    '<svg><text><tspan>x</tspan></text></svg>', '<svg><circle r="-1"/></svg>',
    '<svg xmlns="urn:wrong"/>', '<svg width="20%"/>', '<svg viewBox="0 0 0 2"/>',
    '<!DOCTYPE svg [<!ENTITY x "bad">]><svg/>', '<svg>&unknown;</svg>',
    '<svg><rect transform="rotate(45)"/></svg>', '<svg><g transform="scale(2,3)"/></svg>',
  ];
  for (const xml of cases) assert.throws(()=>codec.decode(xml),undefined,xml);
});
test('namespace prefixes, root viewBox and data-kind are preserved; box remains an ordinary g', () => {
  const [document] = codec.decode('<s:svg xmlns:s="http://www.w3.org/2000/svg" id="canvas" viewBox="10 20 400 300"><s:g id="g" data-kind="box"><s:text x="1" y="2" font-size="18" text-anchor="middle">Hi</s:text></s:g></s:svg>');
  assert.equal(document.width,400); assert.equal(document.height,300);
  assert.equal(document.require('g').tag,'g');
  assert.equal(document.require('g').attributes().get('data-kind'),'box');
  assert.equal(document.attributes().get('viewBox'),'10 20 400 300');
  const cli = new CommandDispatcher(new Editor()); cli.execute('init');
  assert.match(cli.execute('create box b 0 0 1 1 "x"')[0],/unknown shape type: box/);
  assert.equal(codec.encode(codec.decode(codec.encode(document))[0]),codec.encode(document));
});
test('background example translate/scale is flattened with correct geometry and text/stroke size', () => {
  const [document] = codec.decode('<svg width="400" height="200"><g id="diagram" transform="translate(60,40)"><g id="nodeB" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/><text id="t" x="60" y="38" font-size="16">End</text></g></g></svg>');
  assert.equal(document.require('r').attributes().get('x'),'260');
  assert.equal(document.require('r').attributes().get('y'),'40');
  assert.equal(document.require('r').attributes().get('width'),'96');
  assert.equal(document.require('t').attributes().get('x'),'308');
  assert.equal(document.require('t').attributes().get('font-size'),'12.8');
  document.require('nodeB').move(0,100);
  assert.equal(document.require('r').attributes().get('y'),'140');
  assert.equal(codec.encode(document).includes('transform='),false);
});
test('successful IO creates barriers and remembers paths; failed IO preserves document, path and redo', () => {
  mkdirSync('.tmp',{recursive:true}); const directory = mkdtempSync('.tmp/svg-io-');
  const path = join(directory,'test file.svg');
  const editor = new Editor(new FileDocumentStore()), cli = new CommandDispatcher(editor);
  cli.execute('init'); cli.execute('create circle c 1 2 3');
  assert.match(cli.execute('save')[0],/^error: no file path/);
  assert.match(cli.execute(`save "${path}"`)[0],/^saved to/);
  assert.deepEqual(cli.execute('undo'),['error: undo not allowed after io command']);
  const original = readFileSync(path,'utf8');
  cli.execute('move c 4 5'); cli.execute('undo');
  assert.deepEqual(cli.execute(`read "${directory}/missing.svg"`),[`error: cannot read file: ${directory}/missing.svg`]);
  assert.deepEqual(cli.execute(`save "${directory}/missing/out.svg"`),[`error: cannot write file: ${directory}/missing/out.svg`]);
  const bad = join(directory,'bad.svg'); writeFileSync(bad,'<svg><g></svg>');
  assert.match(cli.execute(`read "${bad}"`)[0],/^error: invalid SVG/);
  cli.execute('redo'); assert.equal(editor.document.require('c').attributes().get('cx'),'5');
  assert.equal(readFileSync(path,'utf8'),original);
  cli.execute('save'); assert.notEqual(readFileSync(path,'utf8'),original);
  cli.execute('init'); cli.execute(`read "${path}"`); cli.execute('set c r 9'); cli.execute('save');
  assert.equal(codec.decode(readFileSync(path,'utf8'))[0].require('c').attributes().get('r'),'9');
  assert.equal(readdirSync(directory).some(name=>name.endsWith('.tmp')),false);
});
test('an unwritable destination cannot truncate an existing SVG or destroy redo', () => {
  mkdirSync('.tmp',{recursive:true}); const directory = mkdtempSync('.tmp/svg-blocked-');
  const target = join(directory,'occupied'); mkdirSync(target);
  const cli = new CommandDispatcher(new Editor(new FileDocumentStore()));
  cli.execute('init'); cli.execute('create g g'); cli.execute('undo');
  assert.match(cli.execute(`save "${target}"`)[0],/^error: cannot write file:/);
  assert.match(cli.execute('redo')[0],/^g#g created/);
  assert.deepEqual(readdirSync(directory),['occupied']);
});
test('invalid XML characters are rejected by editing commands', () => {
  const cli = new CommandDispatcher(new Editor()); cli.execute('init'); cli.execute('create text t 1 2 "valid"');
  assert.match(cli.execute('set t text "\u0000"')[0],/^error:/);
  assert.match(cli.execute('show t').at(-1),/valid/);
});
