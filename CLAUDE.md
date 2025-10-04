See @docs/tasks.md for task management

# Project: Danny's Note-Making Chrome Extension

## Overview

Chrome extension that opens a sidebar for taking notes while browsing. Saves notes as Markdown files with frontmatter to `/Users/danny/dev/dannyis-astro/src/content/notes/`.

## Architecture

- **Extension** (`extension/`): Manifest V3 Chrome extension
  - `background.js`: Service worker, message router between sidebar/content/native host
  - `sidebar.js/html`: Side panel UI with EasyMDE markdown editor
  - `content_script.js`: Runs on all pages, extracts `window.getSelection()`
- **Native Host** (`native-host/`): Node.js script for filesystem access
  - Receives note data via native messaging, writes files with timestamp-slug naming

## Data Flow

1. Sidebar requests tab info → background → sidebar displays title
2. User clicks "Add Highlight" → sidebar → background → content script → returns selection → appends as blockquote
3. User clicks "Save Note" → sidebar → background → native host → writes file to disk
4. Draft auto-saved to `chrome.storage.local` per URL, cleared on save

## Key Files

- `extension/manifest.json`: Permissions, side panel config
- `native-host/native-host.js`: File writer
- `native-host/com.dannyis.native_host.json`: Native host manifest (needs path updated during install)

## Dependencies

- EasyMDE: Markdown editor (minified files in `extension/`)
- Node.js: Required for native host
