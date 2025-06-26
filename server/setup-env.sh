#!/bin/bash

echo "Setting up environment file..."

# Check if prod.env exists and copy it
if [ -f "prod.env" ]; then
    echo "Found prod.env, copying to .env"
    cp prod.env .env
    echo "Environment file created successfully"
else
    echo "prod.env not found, creating empty .env file"
    touch .env
    echo "Empty .env file created"
fi

# List files for debugging
echo "Current directory contents:"
ls -la

echo "Environment setup complete" 