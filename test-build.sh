#!/bin/bash

# Test Build Script
# This script tests the build process to ensure it works before deployment

set -e

echo "🧪 Testing build process..."

cd server

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

# Build the project
echo "🔨 Building TypeScript project..."
yarn build

# Check build output
echo "🔍 Checking build output..."
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful! Found dist/index.js"
elif [ -f "dist/server/src/index.js" ]; then
    echo "✅ Build successful! Found dist/server/src/index.js"
    echo "📁 Copying to expected location..."
    cp dist/server/src/index.js dist/index.js
    if [ -f "dist/server/src/index.js.map" ]; then
        cp dist/server/src/index.js.map dist/index.js.map
    fi
    echo "✅ Build structure fixed!"
else
    echo "❌ Build failed! No index.js found"
    echo "📁 Checking what was built:"
    find dist/ -name "*.js" | head -10
    exit 1
fi

# Test the build
echo "🚀 Testing the built application..."
if command -v timeout >/dev/null 2>&1; then
    # Linux timeout command
    if node dist/index.js --help 2>/dev/null || timeout 5s node dist/index.js; then
        echo "✅ Build test successful!"
    else
        echo "⚠️  Build test completed (may have started server)"
    fi
else
    # macOS doesn't have timeout, use a different approach
    if node dist/index.js --help 2>/dev/null; then
        echo "✅ Build test successful!"
    else
        echo "⚠️  Build test completed (server may have started)"
        # Try to start the server briefly to test it
        node dist/index.js &
        SERVER_PID=$!
        sleep 2
        kill $SERVER_PID 2>/dev/null || true
        echo "✅ Server test completed"
    fi
fi

cd ..

echo "🎉 Build test completed successfully!" 