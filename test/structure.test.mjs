import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../dist/application/Editor.js';
import { CommandDispatcher } from '../dist/cli/CommandDispatcher.js';

test('group keeps original order rather than argument order; undo restores parent and position', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  for (const command of ['init','create g outer','create circle a 1 2 3 in outer','create circle b 4 5 6 in outer','create circle c 7 8 9 in outer']) cli.execute(command);
  const original = cli.execute('tree');
  cli.execute('group inner c a');
  assert.deepEqual(editor.document.require('inner').children.map(s => s.id), ['a','c']);
  assert.deepEqual(editor.document.require('outer').children.map(s => s.id), ['inner','b']);
  cli.execute('undo'); assert.deepEqual(cli.execute('tree'),original);
  cli.execute('redo'); cli.execute('set inner fill red'); cli.execute('ungroup inner');
  assert.deepEqual(editor.document.require('outer').children.map(s => s.id),['a','c','b']);
  assert.equal(editor.document.require('a').attributes().get('fill'),'red');
  cli.execute('undo'); assert.ok(editor.document.find('inner'));
});
test('mixed-parent grouping, addto, front and back retain stable sibling order', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  for (const command of ['init','create g g1','create g g2','create circle a 1 2 3 in g1','create circle b 4 5 6 in g2']) cli.execute(command);
  cli.execute('group mixed b a'); assert.deepEqual(editor.document.require('mixed').children.map(s => s.id),['a','b']);
  assert.equal(editor.document.parentLabel('mixed'),'svg');
  cli.execute('addto g1 mixed'); cli.execute('addto mixed g2');
  const before = cli.execute('tree');
  cli.execute('front a'); assert.deepEqual(editor.document.require('mixed').children.map(s => s.id),['b','g2','a']);
  cli.execute('back a'); assert.deepEqual(editor.document.require('mixed').children.map(s => s.id),['a','b','g2']);
  cli.execute('undo'); cli.execute('undo'); assert.deepEqual(cli.execute('tree'),before);
});
test('ancestor groups, cycles, repeated IDs and top-level ungroup fail without changing state', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  for (const command of ['init','create g scene','create g child in scene','create circle c 1 2 3 in child']) cli.execute(command);
  const before = cli.execute('tree');
  assert.deepEqual(cli.execute('group bad c scene'),['error: cannot group a container into its own descendant: scene']);
  assert.deepEqual(cli.execute('ungroup scene'),['error: cannot ungroup top-level container: scene']);
  for (const command of ['addto child scene','addto scene scene','group x c c','group scene c','ungroup c','group bad child missing']) assert.match(cli.execute(command)[0],/^error:/);
  assert.deepEqual(cli.execute('tree'),before);
  cli.execute('undo'); assert.equal(editor.document.find('c'),undefined);
});
test('tree and show include geometry, hierarchy, text and styles without altering history', () => {
  const editor = new Editor(), cli = new CommandDispatcher(editor);
  for (const command of ['init','create g g','create text t 20 40 "My Diagram" in g']) cli.execute(command);
  assert.deepEqual(cli.execute('tree'),['svg (800x600)','└── g#g','    └── text#t  (20,40) "My Diagram"']);
  assert.match(cli.execute('tree t')[0],/^text#t/);
  assert.deepEqual(cli.execute('show t'),['text#t  parent=g#g','  x=20','  y=40','  text="My Diagram"']);
  cli.execute('undo'); assert.equal(editor.document.find('t'),undefined);
});
