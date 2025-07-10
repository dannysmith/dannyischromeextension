# Danny is Chrome Extension - Development Plan

This document outlines the plan for building the Chrome extension to streamline creating notes for the user's Astro-based personal website.

## 1. Overview

The primary technical challenge is that Chrome extensions cannot directly write files to the user's local filesystem for security reasons. To solve this, we will use Chrome's **Native Messaging** feature.

This approach splits the project into two main components:
1.  **The Chrome Extension:** This is the user-facing part. It will handle the UI (sidebar), capture page information, and collect the user's notes.
2.  **A Native Host Application:** This is a small, separate application (a Node.js script in our case) that the Chrome extension communicates with. Its *only* job is to receive the note data from the extension and write it to the correct file on the local disk.

This architecture is secure, robust, and allows us to meet all requirements with minimal complexity.

## 2. Core Components

### A. The Chrome Extension (Frontend)

This is the part that runs inside Chrome. It will be built with standard HTML, CSS, and JavaScript.

*   **`manifest.json`**: The core configuration file for the extension. It will define:
    *   Permissions needed: `nativeMessaging` to talk to our host application, `activeTab` to get the current page's URL and title, and `scripting` to inject our code.
    *   The background service worker (`background.js`).
    *   The action to take when the user clicks the extension icon in the toolbar.

*   **Background Script (`background.js`)**: An invisible script that runs in the background.
    *   It will listen for the toolbar icon click.
    *   When clicked, it will inject the `content_script.js` into the current page.
    *   It will act as the central communication hub, relaying messages from the content script to the native host application.

*   **Content Script (`content_script.js`)**: A script injected directly into the web page the user is viewing.
    *   It will be responsible for creating and managing the sidebar UI (injecting HTML and CSS).
    *   It will automatically grab the page's `title` and `URL`.
    *   It will contain the logic for the "Add Highlight" button, which will get the selected text from the page.
    *   It will send the final note data (title, URL, markdown content) to the `background.js` script when the user clicks "Save".

*   **Sidebar UI (`sidebar.html`, `sidebar.css`)**: Simple HTML and CSS to create the sidebar.
    *   A `textarea` will serve as the markdown editor.
    *   Buttons for "Add Highlight" and "Save".
    *   An area to display the captured page title.

### B. The Native Host Application (Backend)

This is a simple Node.js script that runs locally on the user's machine. It is the bridge between the browser and the local filesystem.

*   **Native Host Manifest (`dannyis_native_host.json`)**: A JSON file that tells Chrome where to find our native application script and that our extension is allowed to talk to it. This file needs to be placed in a specific directory on the system so Chrome can find it.

*   **Node.js Script (`native-host.js`)**: The core of the backend.
    *   It will be a simple script that reads messages from standard input (`stdin`). Chrome sends native messages this way.
    *   When it receives a message containing the note data, it will perform the file-writing logic.
    *   It can reuse or adapt the logic from the user's existing `scripts/create-note.ts` to format the frontmatter and content correctly.
    *   It will construct the final file path (e.g., `/Users/danny/dev/dannyis-astro/src/content/notes/TIMESTAMP-title.md`) and write the file. The path to the Astro project will be hardcoded in this script.

## 3. Workflow (How it all connects)

1.  **User Action:** The user clicks the extension icon on a page they want to write a note about.
2.  **UI Injection:** The `background.js` script injects `content_script.js` into the page.
3.  **Sidebar Appears:** The `content_script.js` creates the sidebar UI, pre-filling the page title and URL.
4.  **User Writes Note:** The user types in the markdown editor and uses the "Add Highlight" button to quote text from the page.
5.  **Save Action:** The user clicks "Save".
6.  **Message Passing (Part 1):** The `content_script.js` packages the title, URL, and markdown content into a JSON message and sends it to `background.js`.
7.  **Message Passing (Part 2):** `background.js` receives the message and sends it to the native host application using the `chrome.runtime.sendNativeMessage` API.
8.  **File Creation:** The `native-host.js` script, which is listening for messages, receives the data. It formats the final markdown file with frontmatter and saves it to the local Astro project directory.

## 4. Setup and Installation

To make this work, a one-time setup will be required:

1.  **Install the Chrome Extension:** Load the extension into Chrome in developer mode.
2.  **Install the Native Host:**
    *   Place the `native-host.js` script somewhere on the machine.
    *   Place the `dannyis_native_host.json` manifest file in the correct location for Chrome to detect it (this location varies by OS).
    *   Run an installation script (a simple `.sh` or `.js` file) that sets the correct path to the `native-host.js` inside the manifest file.

This plan provides a clear path forward for building the extension simply and robustly, directly addressing the primary technical constraint.