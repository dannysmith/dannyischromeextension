const fs = require('fs')
const path = require('path')
const os = require('os')

// --- Debug Logging ---
const logPath = path.join(os.tmpdir(), 'dannyis_native_host.log')
const log = (message) => {
  fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`)
}

log('--- Native host script started ---')

try {
  // Hardcoded path to the Astro project's notes directory
  const notesDir = '/Users/danny/dev/dannyis-astro/src/content/notes'
  log(`Notes directory: ${notesDir}`)

  // Function to slugify text for filenames
  function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }

  // Function to send a message back to the extension
  function sendMessage(message) {
    const buffer = Buffer.from(JSON.stringify(message))
    const lengthBuffer = Buffer.alloc(4)
    lengthBuffer.writeUInt32LE(buffer.length, 0)
    process.stdout.write(lengthBuffer)
    process.stdout.write(buffer)
  }

  // Function to read messages from Chrome
  process.stdin.on('data', (chunk) => {
    log('Received data chunk from Chrome.')
    // This implementation is simplified to handle one message per execution,
    // which is a common pattern for native messaging hosts.
    // A more robust solution would handle buffer splitting if multiple messages arrived at once.
    try {
      const messageLength = chunk.readUInt32LE(0)
      const messageContent = chunk.slice(4, 4 + messageLength).toString()
      const data = JSON.parse(messageContent)
      log('Successfully parsed message: ' + JSON.stringify(data, null, 2))

      const { title, sourceUrl, markdownContent } = data

      // 1. Generate filename
      const timestamp = new Date().getTime()
      const slug = slugify(title)
      const filename = `${timestamp}-${slug}.md`
      const filePath = path.join(notesDir, filename)
      log(`Generated file path: ${filePath}`)

      // 2. Construct file content with frontmatter
      const fileContent = `---
title: "${title.replace(/"/g, '"')}"
sourceUrl: "${sourceUrl}"
tags: []
draft: true
pubDate: ${new Date().toISOString()}
---

${markdownContent || ''}
`
      log('Constructed file content.')

      // 3. Write the file
      fs.writeFileSync(filePath, fileContent)
      log('Successfully wrote file.')

      sendMessage({ status: 'success', filePath: filePath })
      log('Sent success response.')
    } catch (err) {
      log('Error processing message: ' + err.stack)
      sendMessage({ status: 'error', message: err.message, stack: err.stack })
    }
  })

  process.stdin.on('end', () => {
    log('--- Stdin closed, native host exiting ---')
  })
} catch (err) {
  log('!!! A critical error occurred on startup: ' + err.stack)
  // If we crash on startup, we can't send a message back, but the log will tell us why.
}
