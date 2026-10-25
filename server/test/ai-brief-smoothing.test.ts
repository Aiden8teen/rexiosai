import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextWordPrefix } from '../../src/utils/smoothWords';

test('word reveal preserves whitespace, punctuation and Arabic joining without partial trailing words', () => {
  assert.equal(nextWordPrefix('', 'Hello,  world!\nNext', 1), 'Hello,  ');
  assert.equal(nextWordPrefix('Hello,  ', 'Hello,  world!\nNext', 1), 'Hello,  world!\n');
  assert.equal(nextWordPrefix('', 'نحتاج إلى نظام بسيط', 2), 'نحتاج إلى ');
  assert.equal(nextWordPrefix('نحتاج إلى ', 'نحتاج إلى نظام بسيط', 1), 'نحتاج إلى نظام ');
  assert.equal(nextWordPrefix('', 'incomplet', 1), '');
});

test('word reveal handles replacement and bounded catch-up and exposes the complete final text', () => {
  assert.equal(nextWordPrefix('Old text', 'New text here ', 1), 'New ');
  assert.equal(nextWordPrefix('', 'one two three four five ', 3), 'one two three ');
  assert.equal(nextWordPrefix('one ', 'one two', Infinity, true), 'one two');
  assert.equal(nextWordPrefix('same text', 'same text', 1, true), 'same text');
});
