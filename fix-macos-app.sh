#!/bin/bash

# Fix macOS "damaged file" error for Clone Hero Song Companion
# Run this script if macOS says the app is damaged

APP_NAME="Clone Hero Song Companion.app"
APP_PATH=""

# Find the app in common locations
LOCATIONS=(
    "/Applications/$APP_NAME"
    "$HOME/Applications/$APP_NAME"
    "$HOME/Desktop/$APP_NAME"
    "$HOME/Downloads/$APP_NAME"
    "./$APP_NAME"
)

echo "🔍 Looking for Clone Hero Song Companion..."

for location in "${LOCATIONS[@]}"; do
    if [ -d "$location" ]; then
        APP_PATH="$location"
        echo "✅ Found app at: $APP_PATH"
        break
    fi
done

if [ -z "$APP_PATH" ]; then
    echo "❌ Could not find Clone Hero Song Companion.app"
    echo "Please drag the app to your Desktop and run this script again"
    exit 1
fi

echo "🔧 Fixing macOS security issues..."

# Remove quarantine attribute
echo "  - Removing quarantine attribute..."
sudo xattr -d com.apple.quarantine "$APP_PATH" 2>/dev/null || true

# Remove all extended attributes
echo "  - Clearing extended attributes..."
sudo xattr -c "$APP_PATH" 2>/dev/null || true

# Fix permissions
echo "  - Fixing permissions..."
sudo chmod -R 755 "$APP_PATH" 2>/dev/null || true

# Re-sign with ad-hoc signature
echo "  - Re-signing app..."
codesign --force --deep --sign - "$APP_PATH" 2>/dev/null || true

# Verify signature
echo "  - Verifying signature..."
if codesign --verify --verbose "$APP_PATH" 2>/dev/null; then
    echo "✅ App successfully fixed!"
    echo "🚀 You can now launch Clone Hero Song Companion"
else
    echo "⚠️  Signature verification failed, but app might still work"
fi

echo ""
echo "If the app still doesn't work:"
echo "1. Right-click the app → Open"
echo "2. Click 'Open' in the security dialog"
echo "3. Or go to System Preferences → Security & Privacy → General → Click 'Open Anyway'"
