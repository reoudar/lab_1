import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Tokenizer } from '../dist/cli/Tokenizer.js';
import { CommandDispatcher } from '../dist/cli/CommandDispatcher.js';

test('tokenizer preserves Unicode, empty text, colors and Windows paths', () => {
  const tokens = new Tokenizer().tokenize('create text t 1 2 "开始 in here" #eee "" "C:\\my files\\a.svg"');
  assert.deepEqual(tokens.map(t => t.text), ['create', 'text', 't', '1', '2', '开始 in here', '#eee', '', 'C:\\my files\\a.svg']);
  assert.equal(tokens[5].isQuoted, true);
});
test('only whole comment lines are ignored; quotes and backslashes can be escaped', () => {
  assert.deepEqual(new Tokenizer().tokenize('  # comment'), []);
  assert.equal(new Tokenizer().tokenize('"say \\"hi\\""')[0].text, 'say "hi"');
  assert.throws(() => new Tokenizer().tokenize('"unterminated'), /unterminated/);
  assert.throws(() => new Tokenizer().tokenize('"hi"there'), /whitespace/);
});
test('bad commands produce one error and do not prevent the next command', () => {
  const cli = new CommandDispatcher();
  assert.match(cli.execute('oops')[0], /^error:/);
  assert.match(cli.execute('help')[0], /help/);
  assert.deepEqual(cli.execute(''), []);
});
