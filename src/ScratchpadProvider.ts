import {
  type ExtensionContext,
  Uri,
  type Webview,
  type WebviewView,
  type WebviewViewProvider,
  window,
  workspace,
} from 'vscode';
import { logMessage } from './debug';
import {
  globalScope,
  type NotesScope,
  resolveScope,
} from './scope';

/** globalState key listing note keys registered for Settings Sync */
const SYNCED_KEYS = 'syncedNoteKeys';

const storageKey = (scopeKey: string) => `notes:${scopeKey}`;

export default class ScratchpadProvider implements WebviewViewProvider {
  public static readonly viewType = 'scratchpad.scratchpadView';

  private context: ExtensionContext;
  /** Scope of the notes currently shown */
  private scope: NotesScope = globalScope;
  /** Resolved scopes by folder path, to avoid running git on every switch */
  private scopeCache = new Map<string, Promise<NotesScope>>();
  /** Incremented on every refresh so stale resolutions are ignored */
  private refreshId = 0;
  /** WebviewView instance */
  private webviewView?: WebviewView;

  public constructor(context: ExtensionContext) {
    this.context = context;
    this.registerSyncKeys();
  }

  public resolveWebviewView(webviewView: WebviewView) {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);
    this.updateDescription();

    webviewView.webview.onDidReceiveMessage(
      (event: { type: string; key?: string; data?: string }) => {
        logMessage('Received event from WebView:', event.type, event.key);
        switch (event.type) {
          case 'ready': {
            this.sendNotes();
            break;
          }
          // Take the value from the WebView and save it to its scope
          case 'webview->extension': {
            if (event.key) {
              void this.saveNotes(event.key, event.data ?? '');
            }
            break;
          }
        }
      },
    );

    webviewView.onDidChangeVisibility(() => {
      // Set the textarea value when the panel gets focus
      if (webviewView.visible) {
        this.sendNotes();
      }
    });
  }

  /** Re-read the notes, e.g. after another window changed them */
  public reload() {
    if (this.webviewView?.visible) {
      this.sendNotes();
    }
  }

  /** Forget cached scopes, e.g. after workspace trust or Git config changes */
  public clearCache() {
    this.scopeCache.clear();
  }

  /** Work out which folder is active and switch notes if needed */
  public async refresh() {
    const id = ++this.refreshId;
    const folder = this.getActiveFolder();
    let scope = globalScope;
    if (folder) {
      let pending = this.scopeCache.get(folder);
      if (!pending) {
        pending = resolveScope(folder, workspace.isTrusted);
        this.scopeCache.set(folder, pending);
      }
      scope = await pending;
    }

    // A newer refresh started while we were waiting for git
    if (id !== this.refreshId || scope.key === this.scope.key) {
      return;
    }

    logMessage('Notes scope:', scope.key, scope.label);
    this.scope = scope;
    if (scope.syncable) {
      await this.addSyncKey(storageKey(scope.key));
    }
    this.updateDescription();
    this.sendNotes();
  }

  /** Re-register synced keys, e.g. after the sync setting changed */
  public registerSyncKeys() {
    const enabled = workspace
      .getConfiguration('scratchpad')
      .get<boolean>('syncRepositoryNotes', true);
    const keys = this.context.globalState.get<string[]>(SYNCED_KEYS, []);
    this.context.globalState.setKeysForSync(
      enabled ? [SYNCED_KEYS, ...keys] : [],
    );
  }

  private async addSyncKey(key: string) {
    const keys = this.context.globalState.get<string[]>(SYNCED_KEYS, []);
    if (!keys.includes(key)) {
      await this.context.globalState.update(SYNCED_KEYS, [...keys, key]);
      this.registerSyncKeys();
    }
  }

  /** Folder of the active editor, or the first workspace folder */
  private getActiveFolder(): string | undefined {
    const uri = window.activeTextEditor?.document.uri;
    const folder =
      (uri && workspace.getWorkspaceFolder(uri)) ??
      workspace.workspaceFolders?.[0];
    return folder?.uri.scheme === 'file' ? folder.uri.fsPath : undefined;
  }

  private updateDescription() {
    if (this.webviewView) {
      this.webviewView.description = this.scope.label || undefined;
    }
  }

  /** Send notes of the current scope to the WebView */
  private sendNotes() {
    const key = this.scope.key;
    const value = this.context.globalState.get<string>(storageKey(key), '');
    void this.webviewView?.webview.postMessage({
      type: 'extension->webview',
      key,
      value,
    });
  }

  private async saveNotes(scopeKey: string, value: string) {
    try {
      await this.context.globalState.update(
        storageKey(scopeKey),
        value === '' ? undefined : value,
      );
    } catch (error) {
      if (error instanceof Error) {
        void window.showErrorMessage(`Cannot save notes: ${error.message}`);
      }
    }
  }

  /** Generate HTML document for the WebView */
  private getHtml(webview: Webview) {
    const styleUri = webview.asWebviewUri(
      Uri.joinPath(this.context.extensionUri, 'resources', 'style.css'),
    );
    const scriptUri = webview.asWebviewUri(
      Uri.joinPath(this.context.extensionUri, 'resources', 'script.js'),
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource}; style-src ${webview.cspSource};">
  <link href="${styleUri.toString()}" rel="stylesheet">
</head>
<body>
  <textarea id="textarea" disabled="disabled" aria-label="Scratchpad">Loading…</textarea>
  <script src="${scriptUri.toString()}"></script>
</body>
</html>`;
  }
}
