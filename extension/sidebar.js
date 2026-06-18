// sidebar.js

document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('page-title');
  const addHighlightBtn = document.getElementById('add-highlight-btn');
  const saveBtn = document.getElementById('save-note-btn');
  const editorTextarea = document.getElementById('markdown-editor');
  const notesDirSelect = document.getElementById('notes-dir');
  const saveStatus = document.getElementById('save-status');
  const saveStatusText = document.getElementById('save-status-text');
  const copyPathBtn = document.getElementById('copy-path-btn');
  const openEditorBtn = document.getElementById('open-editor-btn');

  let pageUrl = '';
  let pageTitle = '';
  let currentStorageKey = '';
  let lastFilePath = '';

  const NOTES_DIR_KEY = 'dannyis-notes-dir';

  // Show an inline status message (replaces blocking alerts)
  function showStatus(text, { isError = false, filePath = null } = {}) {
    saveStatusText.textContent = text;
    saveStatus.classList.toggle('error', isError);
    saveStatus.hidden = false;
    lastFilePath = filePath || '';
    copyPathBtn.hidden = !filePath;
    copyPathBtn.textContent = 'Copy path';
    openEditorBtn.hidden = !filePath;
  }

  // Restore the saved target directory and persist any change
  chrome.storage.local.get(NOTES_DIR_KEY, (result) => {
    if (result[NOTES_DIR_KEY]) {
      notesDirSelect.value = result[NOTES_DIR_KEY];
    }
  });
  notesDirSelect.addEventListener('change', () => {
    chrome.storage.local.set({ [NOTES_DIR_KEY]: notesDirSelect.value });
  });

  // Open the saved note in Astro Editor via its custom URL scheme.
  // Clicking a transient anchor for an external protocol hands off to the OS
  // handler without navigating the side panel away.
  // Open the saved note in Astro Editor via its custom URL scheme. The side
  // panel runs at a chrome-extension:// origin, which Chrome forbids from
  // launching external protocols directly. Opening the scheme in a real tab
  // lets the browser hand off to the OS handler; we then close the blank tab
  // left behind.
  openEditorBtn.addEventListener('click', () => {
    if (!lastFilePath) return;
    const url = `astro-editor://open?path=${lastFilePath}`;
    chrome.tabs.create({ url, active: true }, (tab) => {
      if (tab && tab.id != null) {
        setTimeout(() => {
          // The tab may already be gone (Chrome closes it after the protocol
          // hand-off), so ignore the resulting "No tab with id" error.
          chrome.tabs.remove(tab.id, () => void chrome.runtime.lastError);
        }, 2000);
      }
    });
  });

  // Copy the saved file's full path to the clipboard
  copyPathBtn.addEventListener('click', () => {
    if (!lastFilePath) return;
    navigator.clipboard.writeText(lastFilePath).then(() => {
      copyPathBtn.textContent = 'Copied!';
      setTimeout(() => { copyPathBtn.textContent = 'Copy path'; }, 1500);
    });
  });

  // Initialize EasyMDE
  const easyMDE = new EasyMDE({
    element: editorTextarea,
    autofocus: true,
    spellChecker: false,
    toolbar: false, // Remove the toolbar
    minHeight: "200px",
    placeholder: "Type your notes here...",
  });

  // Function to update tab info and load draft
  function updateTabInfo() {
    chrome.runtime.sendMessage({ action: 'getTabInfo' }, (response) => {
      if (response && !response.error) {
        pageTitle = response.title;
        pageUrl = response.url;
        titleEl.value = pageTitle;

        // Load draft from storage
        currentStorageKey = `dannyis-draft-${pageUrl}`;
        chrome.storage.local.get(currentStorageKey, (result) => {
          if (result[currentStorageKey]) {
            easyMDE.value(result[currentStorageKey]);
          } else {
            easyMDE.value('');
          }
        });
      } else {
        titleEl.value = "Error loading page info.";
        console.error(response.error);
      }
    });
  }

  // Auto-save draft to storage on change
  easyMDE.codemirror.on('change', () => {
    if (currentStorageKey) {
      chrome.storage.local.set({ [currentStorageKey]: easyMDE.value() });
    }
  });

  // Listen for tab changes
  chrome.tabs.onActivated.addListener(() => {
    updateTabInfo();
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].id === tabId) {
          updateTabInfo();
        }
      });
    }
  });

  // Initial load
  updateTabInfo();

  // 2. Handle "Add Highlight" button
  addHighlightBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getSelection' }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Cannot get selection: ' + chrome.runtime.lastError.message, { isError: true });
        return;
      }

      if (response && response.error) {
        showStatus('Cannot get selection from this page (e.g. chrome:// or extension pages).', { isError: true });
        return;
      }

      if (response && response.selection) {
        const cm = easyMDE.codemirror;
        const doc = cm.getDoc();
        const cursor = doc.getCursor();

        const blockquote = `> ${response.selection.replace(/\n/g, '\n> ')}\n\n`;
        doc.replaceRange(blockquote, cursor);

        // Move cursor to end of inserted content and focus
        const lines = blockquote.split('\n');
        const newLine = cursor.line + lines.length - 1;
        doc.setCursor({ line: newLine, ch: 0 });
        cm.focus();
      }
    });
  });

  // Handle paste to create markdown links
  easyMDE.codemirror.on('paste', (cm, event) => {
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text');

    // Check if pasted text is a URL
    const urlPattern = /^https?:\/\/.+/;
    if (urlPattern.test(pastedText)) {
      const doc = cm.getDoc();
      const selection = doc.getSelection();

      // If there's selected text, create a markdown link
      if (selection && selection.trim()) {
        event.preventDefault();
        const markdownLink = `[${selection}](${pastedText})`;
        doc.replaceSelection(markdownLink);
      }
    }
  });

  // 3. Handle "Save Note" button
  saveBtn.addEventListener('click', () => {
    const noteContent = easyMDE.value();
    const noteData = {
      title: titleEl.value,
      sourceUrl: pageUrl,
      markdownContent: noteContent,
      notesDir: notesDirSelect.value
    };

    chrome.runtime.sendMessage({ action: 'saveNote', data: noteData }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving note: ' + chrome.runtime.lastError.message, { isError: true });
        return;
      }

      if (response && response.status === 'success') {
        const filePath = response.response && response.response.filePath;
        const filename = filePath ? filePath.split('/').pop() : '';
        showStatus(`✓ Saved ${filename}`, { filePath });
        chrome.storage.local.remove(currentStorageKey);
        easyMDE.value(''); // Clear the editor
        // The side panel remains open, ready for the next note.
      } else {
        showStatus('Error saving note: ' + (response ? response.message : 'Unknown error'), { isError: true });
      }
    });
  });
});
