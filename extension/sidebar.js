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
      titleEl.textContent = pageTitle;

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
      titleEl.textContent = "Error loading page info.";
      console.error(response.error);
    }
  });

  // 2. Handle "Add Highlight" button
  addHighlightBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'getSelection' }, (response) => {
      if (response && response.selection) {
        const currentContent = easyMDE.value();
        const blockquote = `> ${response.selection.replace(/\n/g, '\n> ')}\n\n`;
        easyMDE.value(currentContent + blockquote);
        easyMDE.codemirror.focus();
      }
    });
  });

  // 3. Handle "Save Note" button
  saveBtn.addEventListener('click', () => {
    const noteContent = easyMDE.value();
    const noteData = {
      title: pageTitle,
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
