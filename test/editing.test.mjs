import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../dist/application/Editor.js';
import { CommandDispatcher } from '../dist/cli/CommandDispatcher.js';

test('create, move, scale, set, delete each form one reversible command', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  cli.execute('init'); cli.execute('create circle c1 100 100 20 red');
  assert.equal(cli.execute('move c1 30 0')[0], 'circle#c1 moved to (130,100)');
  cli.execute('undo'); assert.equal(editor.document.require('c1').attributes().get('cx'), '100');
  cli.execute('redo'); assert.equal(editor.document.require('c1').attributes().get('cx'), '130');
  cli.execute('scale c1 2'); assert.equal(editor.document.require('c1').attributes().get('r'), '40');
  cli.execute('set c1 fill blue'); cli.execute('undo'); assert.equal(editor.document.require('c1').attributes().get('fill'), 'red');
  cli.execute('delete c1'); assert.equal(editor.document.find('c1'), undefined);
  cli.execute('undo'); assert.equal(editor.document.require('c1').attributes().get('r'), '40');
});
test('failures preserve document and redo; successful new edits discard redo', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  cli.execute('init'); cli.execute('create rect r 1 2 3 4'); cli.execute('move r 10 20'); cli.execute('undo');
  for (const input of ['scale r 0', 'set r id x', 'create rect r 1 2 3 4', 'move missing 1 2', 'set r x NaN', 'move r 1', 'create box b 1 2 3 4 x']) {
    assert.match(cli.execute(input)[0], /^error:/);
    assert.equal(editor.document.require('r').attributes().get('x'), '1');
  }
  cli.execute('help'); cli.execute('canvas'); cli.execute('redo');
  assert.equal(editor.document.require('r').attributes().get('x'), '11');
  cli.execute('undo'); cli.execute('set r fill red');
  assert.deepEqual(cli.execute('redo'), ['error: nothing to redo']);
});
test('init and canvas modification are barriers; failed or display operations are not', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  assert.deepEqual(cli.execute('undo'), ["error: no document. use 'init' or 'read' first"]);
  cli.execute('init 400'); assert.equal(editor.document.height,600);
  assert.deepEqual(cli.execute('redo'), ['error: undo not allowed after io command']);
  cli.execute('create g g1'); cli.execute('canvas 900 700'); cli.execute('create g g2'); cli.execute('undo');
  assert.equal(editor.document.width,900);
  assert.deepEqual(cli.execute('undo'), ['error: nothing to undo']);
  cli.execute('canvas -1'); cli.execute('init NaN'); cli.execute('redo');
  assert.ok(editor.document.find('g2'));
});
test('in suffix respects quoted text; subtree delete and numeric overflow roll back atomically', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  cli.execute('init'); cli.execute('create g g');
  cli.execute('create text t 1 2 "in" in g'); cli.execute('create circle c 1e308 2 3 in g');
  assert.equal(editor.document.require('t').textContent,'in');
  assert.match(cli.execute('scale g 100')[0], /^error:/);
  assert.equal(editor.document.require('t').attributes().get('x'),'1');
  cli.execute('delete g'); assert.equal(editor.document.all().length,0);
  cli.execute('undo'); assert.equal(editor.document.all().length,3);
  assert.deepEqual(cli.execute('create g x in t'), ['error: not a container: t']);
  assert.deepEqual(cli.execute('create g x in missing'), ['error: no such container: missing']);
});
