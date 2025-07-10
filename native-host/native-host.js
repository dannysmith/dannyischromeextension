#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Hardcoded path to the Astro project's notes directory
const notesDir = '/Users/danny/dev/dannyis-astro/src/content/notes';

// Function to slugify text for filenames
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-')   // Replace multiple - with single -
    .replace(/^-+/, '')       // Trim - from start of text
    .replace(/-+$/, '');      // Trim - from end of text
}

// Function to read messages from Chrome
function readMessage(callback) {
  const chunks = [];
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', () => {
    const input = Buffer.concat(chunks);
    const messageLength = input.readUInt32LE(0);
    const messageContent = input.slice(4, 4 + messageLength).toString();
    callback(JSON.parse(messageContent));
  });
}

// Main logic
readMessage((data) => {
  try {
    const { title, sourceUrl, markdownContent } = data;

    // 1. Generate filename
    const timestamp = new Date().getTime();
    const slug = slugify(title);
    const filename = `${timestamp}-${slug}.md`;
    const filePath = path.join(notesDir, filename);

    // 2. Construct file content with frontmatter
    const fileContent = `---
title: "${title.replace(/"/g, '\"')}"
sourceUrl: "${sourceUrl}"
tags: []
published: false
publishedOn: ""
---

${markdownContent}
`;

    // 3. Write the file
    fs.writeFileSync(filePath, fileContent);

    // Send a success response back to the extension
    const response = { status: 'success', filePath: filePath };
    const responseBuffer = Buffer.from(JSON.stringify(response));
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(responseBuffer.length, 0);
    process.stdout.write(lengthBuffer);
    process.stdout.write(responseBuffer);

  } catch (err) {
    const response = { status: 'error', message: err.message };
    const responseBuffer = Buffer.from(JSON.stringify(response));
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(responseBuffer.length, 0);
    process.stdout.write(lengthBuffer);
    process.stdout.write(responseBuffer);
  }
});
