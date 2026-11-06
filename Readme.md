<p align="center">
  <img src="images/logo.png" alt="Repo Scratchpad logo: a smiling Git logo waving from a sticky note" width="180">
</p>

<h1 align="center">Repo Scratchpad</h1>

<p align="center">
  Take quick notes in VS Code’s bottom panel, scoped to the project you’re working on.
</p>

<p align="center">
  <strong><a href="https://marketplace.visualstudio.com/items?itemName=soluml.repo-scratchpad">Install from the Visual Studio Marketplace</a></strong>
</p>

A fork of [Notebox](https://github.com/sapegin/vscode-notebox) by Artem Sapegin, with the same look, but notes are stored per repository instead of globally.

## Install

- From the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=soluml.repo-scratchpad)
- In VS Code, open the Extensions view, search for **Repo Scratchpad** and select **Install**
- From a terminal: `code --install-extension soluml.repo-scratchpad`

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

MIT, see [License.md](License.md).

Icon based on the [Git logo](https://git-scm.com/downloads/logos) by [Jason Long](https://twitter.com/jasonlong), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Not affiliated with or endorsed by the Git project.
