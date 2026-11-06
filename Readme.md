# Scratchpad 📝

Take quick notes in VS Code's bottom panel, scoped to the project you're working on.

A fork of [Notebox](https://github.com/sapegin/vscode-notebox) by Artem Sapegin, with the same look, but notes are stored per repository instead of globally.

## How it works

Open the bottom panel and select **Scratchpad**. The panel header shows which notes you're editing.

Notes are scoped to the folder of the active editor (or the first workspace folder):

| Folder                     | Notes are shared by                                                         | Synced across machines |
| -------------------------- | --------------------------------------------------------------------------- | ---------------------- |
| Git repo with a remote     | every clone and worktree of that remote, for your Git user (`user.email`)   | Yes, via Settings Sync |
| Git repo without a remote  | worktrees of that repo, for your Git user                                   | No                     |
| Not a Git repo             | that directory path                                                         | No                     |
| No folder open             | all windows with no folder (like the original Notebox)                      | No                     |

Remotes are matched on `origin` (or the first remote), normalized so `git@github.com:owner/repo.git` and `https://github.com/owner/repo` count as the same repository.

In untrusted workspaces Git is not run, so notes fall back to the directory scope.

### Settings

- `scratchpad.syncRepositoryNotes` (default `true`): sync repository notes with VS Code Settings Sync. This requires Settings Sync to be on with **Extensions** selected (extension state syncs as part of that category).

## Development

```sh
npm install
npm test        # build, type-check, unit tests
npm run package # build scratchpad-<version>.vsix
```

Press F5 in VS Code to launch an Extension Development Host.

## License

MIT, see License.md.
