#!/bin/bash

# This script acts as a bridge to ensure a Node.js executable is found.
# Chrome launches native hosts with a minimal PATH, so we look node up at runtime
# rather than hardcoding a specific (and eventually stale) fnm version path.

NODE_BIN="$(command -v node || true)"
if [ -z "$NODE_BIN" ]; then
  # Fall back to the newest node installed via fnm.
  NODE_BIN="$(ls -t "$HOME/Library/Application Support/fnm/node-versions"/*/installation/bin/node 2>/dev/null | head -n 1)"
fi

# The absolute path to the JS script. `dirname "$0"` gets the directory of this launcher script.
JS_SCRIPT_PATH="$(dirname "$0")/native-host.js"

# Execute the Node.js script, passing all of its arguments through.
# The log file for the node script will still be created at /tmp/dannyis_native_host.log
exec "$NODE_BIN" "$JS_SCRIPT_PATH" "$@"
