#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code on the web sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install all dependencies (npm install takes advantage of container layer caching)
cd "$CLAUDE_PROJECT_DIR"
npm install

# Compile TypeScript so Jest can resolve dist/ imports
npm run build
