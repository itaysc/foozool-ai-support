#!/bin/bash

echo "🚀 Deploying to Railway with optimized configuration..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login to Railway if not already logged in
echo "🔐 Checking Railway login status..."
railway whoami || railway login

# Verify the Dockerfile exists
if [ ! -f "python-ml-service/Dockerfile" ]; then
    echo "❌ Dockerfile not found at python-ml-service/Dockerfile"
    exit 1
fi

# Verify the minimal requirements exist
if [ ! -f "python-ml-service/requirements/minimal.txt" ]; then
    echo "❌ Minimal requirements not found at python-ml-service/requirements/minimal.txt"
    exit 1
fi

echo "✅ All files verified"

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "🎉 Deployment complete!"
echo ""
echo "📊 Expected image size: ~1.36GB (well under 4GB limit)"
echo "🔍 Check Railway logs for deployment status"
echo "🌐 Your service should be available at the Railway URL" 