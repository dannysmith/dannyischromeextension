(async () => {
  // Avoid re-injecting the script
  if (window.dannyisSidebar) {
    return;
  }
  window.dannyisSidebar = true;

  const pageUrl = window.location.href;
  const pageTitle = document.title;

  // 1. Create and inject the sidebar iframe
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('sidebar.html');
  iframe.style.cssText = `
    position: fixed;
    top: 0;
    right: 0;
    width: 380px;
    height: 100%;
    border: none;
    z-index: 2147483647;
    box-shadow: -2px 0 15px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(iframe);

  // 2. Wait for the iframe to load and then initialize the sidebar
  iframe.onload = () => {
    const sidebarDoc = iframe.contentWindow.document;
    const titleEl = sidebarDoc.getElementById('page-title');
    const closeBtn = sidebarDoc.getElementById('close-sidebar-btn');
    const addHighlightBtn = sidebarDoc.getElementById('add-highlight-btn');
    const saveBtn = sidebarDoc.getElementById('save-note-btn');
    const editorTextarea = sidebarDoc.getElementById('markdown-editor');

    titleEl.textContent = pageTitle;

    // Initialize EasyMDE
    const easyMDE = new iframe.contentWindow.EasyMDE({
      element: editorTextarea,
      autofocus: true,
      spellChecker: false,
      toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen", "|", "guide"],
      minHeight: "150px"
    });

    // 3. Load draft from storage
    const storageKey = `dannyis-draft-${pageUrl}`;
    chrome.storage.local.get(storageKey, (result) => {
      if (result[storageKey]) {
        easyMDE.value(result[storageKey]);
      }
    });

    // 4. Auto-save draft to storage
    easyMDE.codemirror.on('change', () => {
      chrome.storage.local.set({ [storageKey]: easyMDE.value() });
    });

    // 5. Handle button clicks
    closeBtn.onclick = () => {
      iframe.remove();
      window.dannyisSidebar = false; // Allow re-injection
    };

    addHighlightBtn.onclick = () => {
      const selection = window.getSelection().toString();
      if (selection) {
        const currentContent = easyMDE.value();
        const blockquote = `> ${selection.replace(/\n/g, '\n> ')}\n\n`;
        easyMDE.value(currentContent + blockquote);
      }
    };

    saveBtn.onclick = () => {
      const noteContent = easyMDE.value();
      const noteData = {
        title: pageTitle,
        sourceUrl: pageUrl,
        markdownContent: noteContent
      };

      chrome.runtime.sendMessage({ action: 'saveNote', data: noteData }, (response) => {
        if (response && response.status === 'success') {
          alert('Note saved successfully!');
          chrome.storage.local.remove(storageKey);
          iframe.remove();
          window.dannyisSidebar = false;
        } else {
          alert('Error saving note: ' + (response ? response.message : 'Unknown error'));
        }
      });
    };
  };
})();