import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relativeTime } from '../src/common/relative-time';

test('new content has accurate relative timestamps in both languages', () => {
  const now = new Date('2026-10-20T20:00:00Z');
  assert.equal(relativeTime(new Date(now.getTime() - 2000), 'en', now), 'now');
  assert.equal(relativeTime(new Date(now.getTime() - 2000), 'ar', now), 'الآن');
  assert.equal(relativeTime(new Date(now.getTime() - 7200000), 'en', now), '2 hours ago');
});
