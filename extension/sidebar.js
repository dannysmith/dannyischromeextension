// sidebar.js

document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('page-title');
  const addHighlightBtn = document.getElementById('add-highlight-btn');
  const saveBtn = document.getElementById('save-note-btn');
  const editorTextarea = document.getElementById('markdown-editor');

  let pageUrl = '';
  let pageTitle = '';
  let currentStorageKey = '';

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
        alert('Cannot get selection: ' + chrome.runtime.lastError.message);
        return;
      }

      if (response && response.error) {
        alert('Cannot get selection from this page. Content scripts may not run on chrome:// or extension pages.');
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
      markdownContent: noteContent
    };

    chrome.runtime.sendMessage({ action: 'saveNote', data: noteData }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Error saving note: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.status === 'success') {
        alert('Note saved successfully!');
        const storageKey = `dannyis-draft-${pageUrl}`;
        chrome.storage.local.remove(storageKey);
        easyMDE.value(''); // Clear the editor
        // The side panel remains open, ready for the next note.
      } else {
        alert('Error saving note: ' + (response ? response.message : 'Unknown error'));
      }
    });
  });
});
