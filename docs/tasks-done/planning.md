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

This is the part that runs inside Chrome. It will be built with standard HTML, CSS, and JavaScript, with a lightweight library for the Markdown editor.

*   **`manifest.json`**: The core configuration file for the extension. It will define:
    *   Permissions needed: `nativeMessaging` to talk to our host application, `activeTab` to get the current page's URL and title, `scripting` to inject our code, and `storage` to save note drafts.
    *   The background service worker (`background.js`).
    *   The action to take when the user clicks the extension icon in the toolbar.

*   **Background Script (`background.js`)**: An invisible script that runs in the background.
    *   It will listen for the toolbar icon click.
    *   When clicked, it will inject the `content_script.js` into the current page.
    *   It will act as the central communication hub, relaying messages from the content script to the native host application.

*   **Content Script (`content_script.js`)**: A script injected directly into the web page the user is viewing.
    *   It will be responsible for creating and managing the sidebar UI.
    *   It will automatically grab the page's `title` and `URL`.
    *   **State Persistence:** On opening, it will check `chrome.storage.local` for any saved draft content corresponding to the current page's URL. If found, it will restore the content into the editor. As the user types, it will automatically save the draft to `chrome.storage.local`, preventing data loss.
    *   It will contain the logic for the "Add Highlight" button.
    *   When the user clicks "Save", it will send the final note data to `background.js` and clear the saved draft from `chrome.storage.local`.

*   **Sidebar UI (`sidebar.html`, `sidebar.css`)**: The HTML and CSS for the sidebar.
    *   We will use a lightweight, simple library like **EasyMDE** to provide a `textarea` with basic Markdown syntax highlighting and a clean writing interface.
    *   Buttons for "Add Highlight" and "Save".
    *   An area to display the captured page title.

### B. The Native Host Application (Backend)

This is a simple Node.js script that runs locally on the user's machine. It is the bridge between the browser and the local filesystem.

*   **Native Host Manifest (`dannyis_native_host.json`)**: A JSON file that tells Chrome where to find our native application script and that our extension is allowed to talk to it. This file needs to be placed in a specific directory on the system so Chrome can find it.

*   **Node.js Script (`native-host.js`)**: The core of the backend.
    *   It will be a simple script that reads messages from standard input (`stdin`).
    *   When it receives the note data (title, sourceUrl, markdownContent), it will generate the final file.
    *   **File Naming:** The script will create a filename by combining the current Unix timestamp (in milliseconds) with a slugified version of the title, e.g., `1700733150901-apples-thunderbolt-3-cables.md`.
    *   **File Content:** It will construct the file content with YAML frontmatter, replicating the format from the user's existing notes. The `published` flag will be hardcoded to `false`.
        ```yaml
        ---
        title: "The Page Title from the Browser"
        sourceUrl: "https://the.url/of-the-page"
        tags: []
        published: false
        publishedOn: ""
        ---

        The markdown content from the editor goes here.
        ```
    *   It will save the file to the hardcoded path of the user's Astro project: `/Users/danny/dev/dannyis-astro/src/content/notes/`.

## 3. Workflow (How it all connects)

1.  **User Action:** The user clicks the extension icon.
2.  **UI Injection & State Restoration:** The `background.js` script injects `content_script.js`. The content script creates the sidebar UI and loads any saved draft for that URL from `chrome.storage.local` into the EasyMDE editor.
3.  **User Writes Note:** The user types in the editor. Changes are auto-saved to local storage. The user can add blockquotes using the "Add Highlight" button.
4.  **Save Action:** The user clicks "Save".
5.  **Message Passing (Part 1):** The `content_script.js` packages the final data into a JSON message and sends it to `background.js`. It then clears the draft from `chrome.storage.local`.
6.  **Message Passing (Part 2):** `background.js` relays the message to the native host application.
7.  **File Creation:** The `native-host.js` script receives the data, generates the correctly formatted filename and frontmatter, and saves the new note file to the local Astro project directory.

## 4. Setup and Installation

To make this work, a one-time setup will be required:

1.  **Install the Chrome Extension:** Load the extension into Chrome in developer mode.
2.  **Install the Native Host:**
    *   Place the `native-host.js` script somewhere on the machine.
    *   Place the `dannyis_native_host.json` manifest file in the correct location for Chrome to detect it (this location varies by OS).
    *   Run an installation script (a simple `.sh` or `.js` file) that sets the correct path to the `native-host.js` inside the manifest file.

This plan provides a clear path forward for building the extension simply and robustly, directly addressing the primary technical constraint.