#!/bin/bash

set -e

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# --- IMPORTANT ---
# The path in the manifest must point to our new launcher script.
HOST_SCRIPT_PATH="$DIR/native-host-launcher.sh"
# ---

# The name of the manifest file
MANIFEST_NAME="com.dannyis.native_host.json"

# Define target directories for supported browsers
TARGET_DIR_CHROME="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
TARGET_DIR_CHROMIUM="$HOME/Library/Application Support/Chromium/NativeMessagingHosts"
TARGET_DIR_ARC="$HOME/Library/Application Support/Arc/User Data/NativeMessagingHosts"

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
  BROWSER_NAME=$2
  if [ -d "$TARGET_DIR" ]; then
    echo "Found $BROWSER_NAME. Installing manifest..."
    mkdir -p "$TARGET_DIR"
    cp "$TEMP_MANIFEST" "$TARGET_DIR/$MANIFEST_NAME"
    chmod 644 "$TARGET_DIR/$MANIFEST_NAME"
    echo "-> Manifest installed at $TARGET_DIR/$MANIFEST_NAME"
  else
    echo "-> $BROWSER_NAME not found. Skipping."
  fi
}

# Install for all supported browsers if their directories exist
install_manifest "$TARGET_DIR_CHROME" "Google Chrome"
install_manifest "$TARGET_DIR_CHROMIUM" "Chromium"
install_manifest "$TARGET_DIR_ARC" "Arc Browser"

# Clean up the temporary file
rm "$TEMP_MANIFEST"

# --- IMPORTANT ---
# Make both the launcher and the node script executable.
chmod +x "$DIR/native-host.js"
chmod +x "$DIR/native-host-launcher.sh"
# ---

echo ""
echo "Installation complete."
echo "The native host is now pointing to the launcher script."
echo "If you previously set the 'allowed_origins' ID, you should not need to change it again."
