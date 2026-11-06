(function () {
  // Debounce delay for sending the textarea value back to the extension
  const SAVE_DELAY = 100;

  // eslint-disable-next-line no-undef
  const vscode = acquireVsCodeApi();
  const textarea = document.querySelector('#textarea');

  /** Scope key of the notes currently in the textarea */
  let currentKey = null;
  let timeoutId = null;

  const submitTextareaValue = () => {
    window.clearTimeout(timeoutId);
    timeoutId = null;
    if (currentKey === null) {
      return;
    }
    vscode.postMessage({
      type: 'webview->extension',
      key: currentKey,
      data: textarea.value,
    });
  };

  textarea.addEventListener('input', () => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(submitTextareaValue, SAVE_DELAY);
  });

  // Handle messages from the extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    switch (message.type) {
      // We receive the new value from the extension
      case 'extension->webview': {
        // Save pending edits to the scope they were made in before switching
        if (timeoutId !== null) {
          submitTextareaValue();
          // Same notes: local edits are newer than what the extension sent
          if (message.key === currentKey) {
            break;
          }
        }
        currentKey = message.key;
        textarea.disabled = false;
        // Avoid resetting the cursor when nothing changed
        if (textarea.value !== message.value) {
          textarea.value = message.value;
        }
        break;
      }
    }
  });

  // Ask the extension for the current notes
  vscode.postMessage({ type: 'ready' });
})();
