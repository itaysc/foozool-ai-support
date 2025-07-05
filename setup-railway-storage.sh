#!/bin/bash

# Script to set up Railway persistent storage for ML models
echo "Setting up Railway persistent storage for ML models..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login to Railway if not already logged in
echo "Checking Railway login status..."
railway whoami || railway login

# Create a persistent volume for models
echo "Creating persistent volume for models..."
railway volume create models-storage --size 10GB

echo "Persistent storage setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your application: railway up"
echo "2. The models will be downloaded to persistent storage on first run"
echo "3. Subsequent deployments will reuse the cached models"
echo ""
echo "Note: The first deployment may take longer due to model downloading." 