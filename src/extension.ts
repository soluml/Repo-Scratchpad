import { type ExtensionContext, window, workspace } from 'vscode';
import { logMessage } from './debug';
import ScratchpadProvider from './ScratchpadProvider';

export function activate(context: ExtensionContext) {
  logMessage('📝 Scratchpad starting...');

  const provider = new ScratchpadProvider(context);
  const refresh = () => void provider.refresh();

  context.subscriptions.push(
    window.registerWebviewViewProvider(ScratchpadProvider.viewType, provider),
    window.onDidChangeActiveTextEditor(refresh),
    workspace.onDidChangeWorkspaceFolders(() => {
      provider.clearCache();
      refresh();
    }),
    workspace.onDidGrantWorkspaceTrust(() => {
      provider.clearCache();
      refresh();
    }),
    workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('scratchpad.syncRepositoryNotes')) {
        provider.registerSyncKeys();
      }
    }),
    window.onDidChangeWindowState((state) => {
      if (state.focused) {
        // Pick up remote changes (e.g. `git remote set-url`) and notes
        // edited in another window
        provider.clearCache();
        refresh();
        provider.reload();
      }
    }),
  );

  refresh();
}
