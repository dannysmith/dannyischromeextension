#!/bin/bash

# This script acts as a bridge to ensure the correct Node.js executable is used.

# The absolute path to the node executable we discovered earlier.
NODE_PATH="/Users/danny/Library/Application Support/fnm/node-versions/v20.11.0/installation/bin/node"

# The absolute path to the JS script. `dirname "$0"` gets the directory of this launcher script.
JS_SCRIPT_PATH="$(dirname "$0")/native-host.js"

# Execute the Node.js script, passing all of its arguments through.
# The log file for the node script will still be created at /tmp/dannyis_native_host.log
exec "$NODE_PATH" "$JS_SCRIPT_PATH" "$@"
