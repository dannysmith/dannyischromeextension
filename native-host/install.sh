#!/bin/bash

set -e

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOST_SCRIPT_PATH="$DIR/native-host.js"

# The name of the manifest file
MANIFEST_NAME="com.dannyis.native_host.json"
TARGET_DIR_CHROME="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
TARGET_DIR_CHROMIUM="$HOME/Library/Application Support/Chromium/NativeMessagingHosts"

# The manifest file in the current directory
SOURCE_MANIFEST="$DIR/$MANIFEST_NAME"

# Use a temporary file for sed to avoid issues with in-place editing on macOS
TEMP_MANIFEST=$(mktemp)

# Replace the placeholder path with the actual path in the manifest
# Using a different separator for sed to handle paths with slashes
sed "s|NATIVE_HOST_PATH|$HOST_SCRIPT_PATH|g" "$SOURCE_MANIFEST" > "$TEMP_MANIFEST"

# Function to install the manifest
install_manifest() {
  TARGET_DIR=$1
  if [ -d "$TARGET_DIR" ]; then
    echo "Installing manifest for $TARGET_DIR"
    mkdir -p "$TARGET_DIR"
    cp "$TEMP_MANIFEST" "$TARGET_DIR/$MANIFEST_NAME"
    chmod 644 "$TARGET_DIR/$MANIFEST_NAME"
    echo "Manifest installed at $TARGET_DIR/$MANIFEST_NAME"
  else
    echo "Directory not found: $TARGET_DIR. Skipping."
  fi
}

# Install for both Chrome and Chromium if they exist
install_manifest "$TARGET_DIR_CHROME"
install_manifest "$TARGET_DIR_CHROMIUM"

# Clean up the temporary file
rm "$TEMP_MANIFEST"

# Make the host script executable
chmod +x "$HOST_SCRIPT_PATH"

echo ""
echo "Installation complete."
echo "IMPORTANT: You must now load the extension in Chrome (or Chromium) and update the 'allowed_origins' in the manifest file with the extension's ID."
echo "The manifest file is located at:"
echo "Chrome: $TARGET_DIR_CHROME/$MANIFEST_NAME"
echo "Chromium: $TARGET_DIR_CHROMIUM/$MANIFEST_NAME"
echo "After updating the ID, the setup will be complete."
