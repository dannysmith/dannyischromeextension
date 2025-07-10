// background.js

// Allow the side panel to open when the toolbar icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for messages from the sidebar or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 1. Message from the sidebar asking for the current tab's info
  if (message.action === 'getTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        sendResponse({
          title: tabs[0].title,
          url: tabs[0].url
        });
      } else {
        sendResponse({ error: "Could not find active tab." });
      }
    });
    return true; // Indicates we will send a response asynchronously
  }

  // 2. Message from the sidebar asking for the highlighted text
  if (message.action === 'getSelection') {
    // Forward the message to the content script of the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelection' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      }
    });
    return true; // Indicates we will send a response asynchronously
  }

  // 3. Message from the sidebar to save the note
  if (message.action === 'saveNote') {
    // Send the note data to the native host application
    chrome.runtime.sendNativeMessage(
      'com.dannyis.native_host',
      message.data,
      (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message to native host:', chrome.runtime.lastError.message);
          sendResponse({ status: 'error', message: chrome.runtime.lastError.message });
        } else {
          console.log('Received response from native host:', response);
          sendResponse({ status: 'success', response: response });
        }
      }
    );
    return true; // Indicates we will send a response asynchronously
  }
});