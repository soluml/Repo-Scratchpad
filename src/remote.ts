/**
 * Normalize a Git remote URL so that different spellings of the same
 * repository map to one identity, e.g. all of these become
 * `github.com/owner/repo`:
 *
 *   git@github.com:Owner/repo.git
 *   https://github.com/owner/repo
 *   ssh://git@github.com:22/owner/repo.git
 *   https://user:token@github.com/owner/repo.git/
 */
export function normalizeRemoteUrl(url: string): string {
  let value = url.trim();

  // scp-like syntax: [user@]host:path (no scheme, colon before first slash)
  const scpLike = /^(?:[^@/]+@)?([^:/]+):(?!\/)(.+)$/.exec(value);
  if (scpLike && !/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    value = `${scpLike[1]}/${scpLike[2]}`;
  } else {
    // scheme://[user[:pass]@]host[:port]/path
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/]*@)?([^/:]+)(?::\d+)?\/?(.*)$/i.exec(
      value,
    );
    if (withScheme) {
      value = `${withScheme[1]}/${withScheme[2]}`;
    }
  }

  return value
    .replace(/\/+$/, '')
    .replace(/\.git$/i, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}
