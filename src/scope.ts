import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { logMessage } from './debug';
import { normalizeRemoteUrl } from './remote';

export interface NotesScope {
  /** Stable key identifying where notes are stored */
  key: string;
  /** Short human-readable label shown in the panel */
  label: string;
  /** Whether the notes may be synced across machines */
  syncable: boolean;
}

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex').slice(0, 32);

/** Run git in a directory; resolves to trimmed stdout or undefined on failure */
function git(cwd: string, args: string[]): Promise<string | undefined> {
  return new Promise((resolve) => {
    execFile(
      'git',
      args,
      { cwd, timeout: 5000, windowsHide: true },
      (error, stdout) => {
        const output = stdout?.toString().trim();
        resolve(error || !output ? undefined : output);
      },
    );
  });
}

/** Pick the remote to identify the repository: origin, else the first one */
async function getRemoteUrl(cwd: string): Promise<string | undefined> {
  const origin = await git(cwd, ['remote', 'get-url', 'origin']);
  if (origin) {
    return origin;
  }
  const remotes = await git(cwd, ['remote']);
  const first = remotes?.split(/\r?\n/)[0];
  return first ? git(cwd, ['remote', 'get-url', first]) : undefined;
}

/** Notes scope used when no folder is open, same as the original Notebox */
export const globalScope: NotesScope = {
  key: 'global',
  label: '',
  syncable: false,
};

/** Directory-based scope, keyed by absolute path */
export function directoryScope(folder: string): NotesScope {
  return {
    key: `dir:${hash(path.resolve(folder))}`,
    label: path.basename(folder),
    syncable: false,
  };
}

/**
 * Work out where notes for a folder live:
 *
 * - Git repo with a remote: keyed by Git user + normalized remote URL, so
 *   every clone/worktree of the repo shares notes for that user, and they
 *   can be synced across machines.
 * - Git repo without a remote: keyed by Git user + the shared .git
 *   directory, so worktrees of the same repo share notes.
 * - No Git: keyed by the directory path.
 *
 * Git is only queried in trusted workspaces, because a repository's config
 * can make git run arbitrary commands.
 */
export async function resolveScope(
  folder: string,
  trusted: boolean,
): Promise<NotesScope> {
  if (!trusted) {
    return directoryScope(folder);
  }

  const topLevel = await git(folder, ['rev-parse', '--show-toplevel']);
  if (!topLevel) {
    return directoryScope(folder);
  }

  const user =
    (await git(folder, ['config', 'user.email']))?.toLowerCase() ??
    (await git(folder, ['config', 'user.name'])) ??
    '';
  const remoteUrl = await getRemoteUrl(folder);

  if (remoteUrl) {
    const repo = normalizeRemoteUrl(remoteUrl);
    logMessage('Repository:', repo, 'user:', user);
    return {
      key: `repo:${hash(`${user}\n${repo}`)}`,
      label: repo.split('/').slice(-2).join('/'),
      syncable: true,
    };
  }

  const commonDir = await git(folder, [
    'rev-parse',
    '--path-format=absolute',
    '--git-common-dir',
  ]);
  logMessage('Local repository:', commonDir ?? topLevel, 'user:', user);
  return {
    key: `local:${hash(`${user}\n${path.resolve(commonDir ?? topLevel)}`)}`,
    label: path.basename(topLevel),
    syncable: false,
  };
}
