#!/bin/bash

# Development Server with Enhanced Logging
# Monitors Next.js dev server and logs all issues

LOG_DIR="./logs"
mkdir -p "$LOG_DIR"

DEV_LOG="$LOG_DIR/dev-server.log"
ERROR_LOG="$LOG_DIR/dev-errors.log"
CSS_LOG="$LOG_DIR/css-issues.log"

echo "🚀 Starting development server with logging..."
echo "📝 Logs will be saved to: $LOG_DIR"
echo ""

# Clean old logs
> "$DEV_LOG"
> "$ERROR_LOG"
> "$CSS_LOG"

# Start dev server and capture all output
npm run dev 2>&1 | tee "$DEV_LOG" | while IFS= read -r line; do
  # Log all output
  echo "$(date '+%H:%M:%S') $line" >> "$DEV_LOG"
  
  # Extract errors
  if echo "$line" | grep -qiE "(error|failed|warning|css|style)"; then
    echo "$(date '+%H:%M:%S') $line" >> "$ERROR_LOG"
    
    # Specifically log CSS issues
    if echo "$line" | grep -qiE "(css|style|tailwind|postcss)"; then
      echo "$(date '+%H:%M:%S') $line" >> "$CSS_LOG"
    fi
  fi
  
  # Display in console
  echo "$line"
done
