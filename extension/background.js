// Listen for the extension's icon to be clicked
chrome.action.onClicked.addListener((tab) => {
  // Execute the content script in the current tab
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content_script.js']
  });
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    // Return true to indicate that we will send a response asynchronously
    return true;
  }
});
