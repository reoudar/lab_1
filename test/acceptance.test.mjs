import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { SvgCodec } from '../dist/infrastructure/SvgCodec.js';
import { Editor } from '../dist/application/Editor.js';
import { CommandDispatcher } from '../dist/cli/CommandDispatcher.js';

test('real CLI replays the complete section 6 transcript and produces loadable SVG', () => {
  mkdirSync('.tmp', {recursive:true}); const directory = mkdtempSync('.tmp/session-');
  mkdirSync(join(directory,'examples')); copyFileSync('examples/other.svg',join(directory,'examples/other.svg'));
  const result = spawnSync(process.execPath,[resolve('dist/main.js')], {cwd:directory,input:readFileSync('examples/session.txt','utf8'),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr); assert.equal(result.stderr,'');
  const errors = result.stdout.match(/error:[^\r\n]*/g);
  assert.deepEqual(errors,['error: cannot group a container into its own descendant: markers','error: undo not allowed after io command']);
  assert.match(result.stdout,/warning: assigned id rect1 to unnamed <rect>/);
  assert.match(result.stdout,/read examples\/other.svg \(7 elements\)/);
  const [document] = new SvgCodec().decode(readFileSync(join(directory,'examples/demo.svg'),'utf8'));
  assert.equal(document.all().length,5);
  assert.equal(document.require('c1').attributes().get('cx'),'130');
  assert.equal(document.require('title').textContent,'My Diagram');
  assert.ok(result.stdout.includes('svg> '));
});
test('real CLI replays the nested flowchart example with Chinese labels', () => {
  mkdirSync('.tmp',{recursive:true}); const directory = mkdtempSync('.tmp/flowchart-'); mkdirSync(join(directory,'examples'));
  const result = spawnSync(process.execPath,[resolve('dist/main.js')], {cwd:directory,input:readFileSync('examples/flowchart.txt','utf8'),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr); assert.doesNotMatch(result.stdout,/error:/);
  assert.match(result.stdout,/saved to examples\/flowchart.svg \(8 elements\)/);
  const [document] = new SvgCodec().decode(readFileSync(join(directory,'examples/flowchart.svg'),'utf8'));
  assert.equal(document.parentLabel('process-label'),'g#node2');
  assert.equal(document.require('process').attributes().get('y'),'100');
  assert.equal(document.require('process-label').textContent,'处理数据 v2');
});
test('every editing command can be undone to the initial document and redone exactly', () => {
  const cli = new CommandDispatcher(new Editor()); cli.execute('init');
  const original = cli.execute('tree');
  const commands = ['create g scene','create rect r 1 2 3 4 in scene','create circle c 5 6 7 in scene','create text t 8 9 "hi"','group g c r','move g 2 -3','scale g 1.5','set g fill blue','addto scene t','front r','back c','ungroup g','delete c'];
  const states = [original];
  for (const command of commands) { assert.doesNotMatch(cli.execute(command)[0],/^error:/,command); states.push(cli.execute('tree')); }
  for (let index=commands.length-1;index>=0;index--) { cli.execute('undo'); assert.deepEqual(cli.execute('tree'),states[index]); }
  assert.deepEqual(cli.execute('undo'),['error: nothing to undo']);
  for (let index=1;index<states.length;index++) { cli.execute('redo'); assert.deepEqual(cli.execute('tree'),states[index]); }
  assert.deepEqual(cli.execute('redo'),['error: nothing to redo']);
});
test('create in works for all six types and IDs are case-sensitive across containers', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  cli.execute('init'); cli.execute('create g scene');
  for (const command of ['create g G in scene','create rect R 0 0 1 1 in scene','create circle C 0 0 1 in scene','create ellipse E 0 0 1 2 in scene','create line L 0 0 1 1 in scene','create text T 0 0 "" in scene']) assert.doesNotMatch(cli.execute(command)[0],/^error:/);
  assert.equal(editor.document.require('scene').children.length,6);
  cli.execute('create g r in G');
  assert.deepEqual(cli.execute('create g R in G'),['error: id already exists: R']);
  assert.ok(editor.document.find('r')); assert.ok(editor.document.find('R'));
});
test('document command failures and failed edits do not unlock the IO barrier', () => {
  const cli = new CommandDispatcher(new Editor()); cli.execute('init');
  for (const command of ['create g','create rect r 0 0 -1 2','set missing fill red','init 0','canvas 0','save']) assert.match(cli.execute(command)[0],/^error:/);
  assert.deepEqual(cli.execute('undo'),['error: undo not allowed after io command']);
  assert.deepEqual(cli.execute('redo'),['error: undo not allowed after io command']);
});
