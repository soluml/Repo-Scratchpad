import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeRemoteUrl } from '../src/remote.ts';

test('different spellings of the same remote normalize identically', () => {
  for (const url of [
    'git@github.com:Owner/Repo.git',
    'github.com:owner/repo',
    'https://github.com/owner/repo',
    'https://github.com/owner/repo.git/',
    'https://user:token@github.com/owner/repo.git',
    'ssh://git@github.com/owner/repo.git',
    'ssh://git@github.com:22/owner/repo',
    'git://github.com/owner/repo.git',
  ]) {
    assert.equal(normalizeRemoteUrl(url), 'github.com/owner/repo', url);
  }
});

test('nested group paths are kept', () => {
  assert.equal(
    normalizeRemoteUrl('git@gitlab.com:group/sub/project.git'),
    'gitlab.com/group/sub/project',
  );
});

test('different repos stay distinct', () => {
  assert.notEqual(
    normalizeRemoteUrl('git@github.com:owner/a.git'),
    normalizeRemoteUrl('git@github.com:owner/b.git'),
  );
});
