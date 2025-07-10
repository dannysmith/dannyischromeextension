// content_script.js

// Listen for a message from the background script to get the selection
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ selection: selection });
  }
});
