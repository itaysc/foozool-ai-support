#!/bin/bash

# Setup script for Railway persistent storage
echo "Setting up Railway persistent storage for ML models..."

# Create the storage volume if it doesn't exist
railway volume create models-storage --size 10GB

echo "✅ Railway persistent storage setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy your application to Railway"
echo "2. The models will be downloaded to persistent storage on first run"
echo "3. Subsequent deployments will reuse the cached models"
echo ""
echo "Note: The first deployment may take longer due to model downloads" 