#!/bin/bash

# Railway Web Interface Deployment Script
# This script prepares your project for deployment via Railway's web interface

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🌐 Railway Web Interface Deployment Preparation"
echo "=============================================="

# Add yarn to PATH
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

# 1. Test the build locally
print_status "Testing build locally..."
./test-build.sh

# 2. Create Railway configuration files
print_status "Creating Railway configuration files..."

# Create root railway.json
cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd server && yarn build && yarn serve",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create nixpacks.toml
cat > nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ["nodejs", "yarn"]

[phases.install]
cmds = ["yarn install --frozen-lockfile"]

[phases.build]
cmds = [
    "cd server && yarn build",
    "cd server && (cp dist/server/src/index.js dist/index.js 2>/dev/null || true)"
]

[start]
cmd = "cd server && yarn serve"
EOF

# Create Python service railway.json
cat > python-ml-service/railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python main.py",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF

# Create requirements.txt for Python service
cat > python-ml-service/requirements.txt << 'EOF'
fastapi==0.115.8
uvicorn==0.34.0
uvloop
pydantic==2.10.6
pydantic_core==2.27.2
starlette==0.45.3
prometheus_client
python-json-logger
annotated-types==0.7.0
anyio==4.8.0
click==8.1.8
h11==0.14.0
idna==3.10
sniffio==1.3.1
typing_extensions==4.12.2
EOF

print_success "Railway configuration files created"

# 3. Add health check endpoint if not exists
print_status "Adding health check endpoint..."
cd server

if ! grep -q "/api/v1/health" src/server.ts; then
    # Add health check endpoint before the closing brace of initRoutes method
    sed -i.bak '/this\.app\.use.*zendesk.*v1.*;/a\
      this.app.get("/api/v1/health", (req, res) => {\
        res.status(200).json({\
          status: "healthy",\
          timestamp: new Date().toISOString(),\
          service: "foozool-support-ai"\
        });\
      });' src/server.ts
    print_success "Health check endpoint added"
else
    print_warning "Health check endpoint already exists"
fi

cd ..

# 4. Update package.json scripts
print_status "Updating package.json scripts..."
cd server

if ! grep -q '"serve"' package.json; then
    sed -i.bak 's/"build": "tsc"/"build": "tsc --skipLibCheck",\n    "build:fix": "yarn build \&\& (cp dist\/server\/src\/index.js dist\/index.js 2>\/dev\/null || true)",\n    "serve": "node dist\/index.js",\n    "postinstall": "yarn build:fix"/' package.json
    print_success "Package.json scripts updated"
else
    print_warning "Package.json scripts already exist"
fi

cd ..

# 5. Create environment variables template
print_status "Creating environment variables template..."
if [ -f "server/.env" ]; then
    cp server/.env server/.env.example
    # Remove sensitive values
    sed -i.bak 's/=.*/=YOUR_VALUE_HERE/' server/.env.example
    print_success "Environment variables template created: server/.env.example"
else
    print_warning "No .env file found. You'll need to set environment variables manually in Railway."
fi

# 6. Clean up backup files
find . -name "*.bak" -delete

print_success "🎉 Project prepared for Railway web deployment!"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://railway.app/dashboard"
echo "2. Click 'New Project'"
echo "3. Select 'Deploy from GitHub repo'"
echo "4. Connect your GitHub repository"
echo "5. Railway will auto-detect your services"
echo "6. Set environment variables in Railway dashboard"
echo "7. Deploy!"
echo ""
echo "🔧 Environment Variables to set in Railway:"
echo "- NODE_ENV=production"
echo "- PORT=3000"
echo "- IS_DOCKER_DEV=false"
echo "- Add all variables from your .env file"
echo ""
echo "🌐 Your services will be available at:"
echo "- Node.js API: https://your-project-name.railway.app"
echo "- Python ML: https://your-python-service.railway.app" 