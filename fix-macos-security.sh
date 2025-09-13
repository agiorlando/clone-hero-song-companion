#!/bin/bash

# Fix macOS security issues for Clone Hero Song Companion
echo "🔐 Fixing macOS security restrictions..."

APP_PATH="/Applications/Clone Hero Song Companion.app"

if [ -d "$APP_PATH" ]; then
    echo "📱 Found app at: $APP_PATH"
    
    echo "🔓 Removing quarantine attribute..."
    sudo xattr -rd com.apple.quarantine "$APP_PATH"
    
    echo "🔧 Clearing extended attributes..."
    sudo xattr -c "$APP_PATH"
    
    echo "🛡️ Fixing permissions..."
    sudo chmod -R 755 "$APP_PATH"
    
    echo "✅ Security restrictions removed!"
    echo "🚀 You can now run the app without security warnings."
    echo "💡 This works for both Intel and Apple Silicon versions."
else
    echo "❌ App not found at $APP_PATH"
    echo "💡 Make sure the app is installed in Applications folder"
    echo "   Or modify the APP_PATH in this script to match your installation"
fi
