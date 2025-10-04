// sidebar.js

document.addEventListener('DOMContentLoaded', () => {
  const titleEl = document.getElementById('page-title');
  const addHighlightBtn = document.getElementById('add-highlight-btn');
  const saveBtn = document.getElementById('save-note-btn');
  const editorTextarea = document.getElementById('markdown-editor');

  let pageUrl = '';
  let pageTitle = '';

  // Initialize EasyMDE
  const easyMDE = new EasyMDE({
    element: editorTextarea,
    autofocus: true,
    spellChecker: false,
    toolbar: false, // Remove the toolbar
    minHeight: "200px",
    placeholder: "Type your notes here...",
  });

  // 1. Get Tab Info and Load Draft
  chrome.runtime.sendMessage({ action: 'getTabInfo' }, (response) => {
    if (response && !response.error) {
      pageTitle = response.title;
      pageUrl = response.url;
      titleEl.value = pageTitle;

      // Load draft from storage
      const storageKey = `dannyis-draft-${pageUrl}`;
      chrome.storage.local.get(storageKey, (result) => {
        if (result[storageKey]) {
          easyMDE.value(result[storageKey]);
        }
      });

      // Auto-save draft to storage
      easyMDE.codemirror.on('change', () => {
        chrome.storage.local.set({ [storageKey]: easyMDE.value() });
      });
    } else {
      titleEl.value = "Error loading page info.";
      console.error(response.error);
    }
  });

  // 2. Handle "Add Highlight" button
  addHighlightBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getSelection' }, (response) => {
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
