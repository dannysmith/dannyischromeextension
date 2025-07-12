# Danny's Note-Making Chrome Extension

A Chrome extension that streamlines creating notes for [danny.is](https://danny.is) while browsing the web. This extension allows me to quickly capture thoughts, highlights, and commentary on web content, then automatically save them as draft notes in my local Astro project.

## How It Works

This extension uses a two-part architecture to overcome Chrome's security restrictions:

1. **Chrome Extension**: Provides the user interface and captures web page data
2. **Native Host**: A Node.js application that writes files to the local filesystem

### Workflow

1. **Browse & Capture**: Click the extension icon to open the sidebar on any webpage
2. **Write Notes**: Use the markdown editor to add your thoughts and commentary
3. **Add Highlights**: Select text on the page and click "Add Highlight" to include it as a blockquote
4. **Save**: Click "Save Note" to create a draft file in your Astro project
5. **Publish Later**: Review and publish notes through your normal git workflow

### Components

- **Extension Files**:
  - `manifest.json`: Extension configuration with permissions
  - `background.js`: Service worker handling messaging
  - `content_script.js`: Text selection functionality
  - `sidebar.html/js/css`: Main UI with EasyMDE editor
- **Native Host**:
  - `native-host.js`: Node.js script that writes files
  - `com.dannyis.native_host.json`: Native messaging manifest
  - `install.sh`: Setup script for native host registration

## Installation

### Prerequisites

- Node.js installed on your system
- Chrome/Chromium-based browser
- Local copy of a notes content collection at `~/dev/dannyis-astro/src/content/notes/`

### Setup Steps

1. **Install the Native Host**:

   ```bash
   cd native-host
   ./install.sh
   ```

   This registers the native host with Chrome and makes scripts executable.

2. **Load the Chrome Extension**:

   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` folder

3. **Verify Setup**:
   - The extension icon should appear in your toolbar
   - Click it to open the sidebar and test note creation

## File Format

Generated notes follow your existing Astro site structure:

```markdown
---
title: 'Page Title from Browser'
sourceUrl: 'https://example.com/page'
tags: []
draft: true
pubDate: 2024-01-15T10:30:00.000Z
---

Your markdown content here...

> Highlighted text from the page
> appears as blockquotes

Your commentary on the highlight...
```

Files are saved as: `{timestamp}-{slugified-title}.md`

## Usage Tips

- **Auto-Save**: Your drafts are automatically saved in localstorage as you type
- **Multi-Tab**: Each tab maintains its own draft independently
- **Highlights**: Select text before clicking "Add Highlight" for best results

## Development

This extension is designed for personal use with minimal maintenance overhead. The codebase is intentionally simple and focused on the core functionality of note creation.

### Browser Compatibility

- Chrome/Chromium (primary)
- Other Chromium-based browsers (likely compatible)

## Security

The extension uses Chrome's native messaging API for secure communication between the browser and local filesystem. Only the registered extension can communicate with the native host, and the native host only writes to a specific directory.
