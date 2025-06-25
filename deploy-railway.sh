#!/bin/bash

# Railway Deployment Script with Debug Mode
# This script includes detailed error checking and fixes for common issues

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="foozool-support-ai"
NODE_SERVICE_NAME="nodejs-api"
PYTHON_SERVICE_NAME="python-ml"
ENV_FILE="server/.env"

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Railway CLI and authentication
check_railway_setup() {
    print_status "Checking Railway setup..."
    
    # Add yarn to PATH if not already there
    export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"
    
    if ! command_exists railway; then
        print_error "Railway CLI is not installed. Installing now..."
        yarn global add @railway/cli
        print_success "Railway CLI installed successfully"
    else
        print_success "Railway CLI is already installed"
    fi
    
    if ! railway whoami >/dev/null 2>&1; then
        print_warning "You are not logged in to Railway. Please log in:"
        railway login
    else
        print_success "Already logged in to Railway"
    fi
}

# Function to check project structure
check_project_structure() {
    print_status "Checking project structure..."
    
    # Check if required directories exist
    if [ ! -d "server" ]; then
        print_error "server directory not found!"
        exit 1
    fi
    
    if [ ! -d "python-ml-service" ]; then
        print_error "python-ml-service directory not found!"
        exit 1
    fi
    
    # Check if required files exist
    if [ ! -f "server/package.json" ]; then
        print_error "server/package.json not found!"
        exit 1
    fi
    
    if [ ! -f "server/src/index.ts" ]; then
        print_error "server/src/index.ts not found!"
        exit 1
    fi
    
    if [ ! -f "server/tsconfig.json" ]; then
        print_error "server/tsconfig.json not found!"
        exit 1
    fi
    
    print_success "Project structure is valid"
}

# Function to check and fix package.json
fix_package_json() {
    print_status "Checking and fixing package.json..."
    
    cd server
    
    # Check if serve script exists
    if ! grep -q '"serve"' package.json; then
        print_status "Adding serve script to package.json..."
        
        # Add serve script before the last closing brace
        sed -i.bak 's/"build": "tsc"/"build": "tsc --skipLibCheck",\n    "build:fix": "yarn build \&\& (cp dist\/server\/src\/index.js dist\/index.js 2>\/dev\/null || true)",\n    "serve": "node dist\/index.js",\n    "postinstall": "yarn build:fix"/' package.json
        
        print_success "Serve script added to package.json"
    else
        print_warning "Serve script already exists in package.json"
    fi
    
    # Check if postinstall script exists
    if ! grep -q '"postinstall"' package.json; then
        print_status "Adding postinstall script to package.json..."
        sed -i.bak 's/"serve": "node dist\/index.js"/"serve": "node dist\/index.js",\n    "postinstall": "yarn build:fix"/' package.json
        print_success "Postinstall script added to package.json"
    fi
    
    cd ..
}

# Function to add health check endpoint
add_health_check() {
    print_status "Adding health check endpoint..."
    
    cd server
    
    # Check if health check already exists
    if grep -q "/api/v1/health" src/server.ts; then
        print_warning "Health check endpoint already exists"
        cd ..
        return
    fi
    
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
    cd ..
}

# Function to create Railway configuration files
create_railway_configs() {
    print_status "Creating Railway configuration files..."
    
    # Create root railway.json with better build configuration
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
}

# Function to create nixpacks configuration
create_nixpacks_config() {
    print_status "Creating nixpacks configuration..."
    
    # Create nixpacks.toml for better build control
    cat > nixpacks.toml << 'EOF'
[phases.setup]
nixPkgs = ["nodejs", "yarn"]

[phases.install]
cmds = ["yarn install --frozen-lockfile"]

[phases.build]
cmds = [
    "cd server && yarn build --skipLibCheck",
    "cd server && (cp dist/server/src/index.js dist/index.js 2>/dev/null || true)"
]

[start]
cmd = "cd server && yarn serve"
EOF

    print_success "Nixpacks configuration created"
}

# Function to test build locally
test_build_locally() {
    print_status "Testing build locally..."
    
    cd server
    
    # Clean previous build
    rm -rf dist/
    
    # Install dependencies
    print_status "Installing dependencies..."
    yarn install
    
    # Build the project
    print_status "Building TypeScript project..."
    yarn build
    
    # Check if build was successful - check both possible locations
    if [ -f "dist/index.js" ]; then
        print_success "Build successful! Found dist/index.js"
    elif [ -f "dist/server/src/index.js" ]; then
        print_status "Build successful! Found dist/server/src/index.js - fixing structure..."
        # Copy to expected location
        cp dist/server/src/index.js dist/index.js
        if [ -f "dist/server/src/index.js.map" ]; then
            cp dist/server/src/index.js.map dist/index.js.map
        fi
        print_success "Build structure fixed!"
    else
        print_error "Build failed! No index.js found in expected locations"
        print_status "Checking what was actually built..."
        find dist/ -name "*.js" | head -10
        print_status "Checking build errors..."
        yarn build 2>&1 | head -20
        exit 1
    fi
    
    print_success "Local build successful"
    cd ..
}

# Function to set environment variables
set_env_variables() {
    print_status "Setting environment variables..."
    
    if [ ! -f "$ENV_FILE" ]; then
        print_warning "Environment file $ENV_FILE not found. Creating basic variables..."
        
        # Set basic production variables
        railway variables set NODE_ENV=production || print_warning "Failed to set NODE_ENV"
        railway variables set PORT=3000 || print_warning "Failed to set PORT"
        railway variables set IS_DOCKER_DEV=false || print_warning "Failed to set IS_DOCKER_DEV"
        
        return
    fi
    
    # Read .env file and set variables
    while IFS='=' read -r key value; do
        # Skip empty lines and comments
        if [[ -n "$key" && ! "$key" =~ ^# ]]; then
            # Remove quotes from value
            value=$(echo "$value" | sed 's/^"//;s/"$//;s/^'\''//;s/'\''$//')
            
            print_status "Setting $key"
            railway variables set "$key=$value" || print_warning "Failed to set $key"
        fi
    done < "$ENV_FILE"
    
    # Set additional production variables
    railway variables set NODE_ENV=production || print_warning "Failed to set NODE_ENV"
    railway variables set PORT=3000 || print_warning "Failed to set PORT"
    railway variables set IS_DOCKER_DEV=false || print_warning "Failed to set IS_DOCKER_DEV"
    
    print_success "Environment variables configured"
}

# Function to deploy Node.js service with detailed error handling
deploy_nodejs_service() {
    print_status "Deploying Node.js service..."
    
    cd server
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in server directory"
        exit 1
    fi
    
    # Try to deploy with verbose output
    print_status "Starting deployment..."
    
    # First, try to link the project if not already linked
    railway link 2>/dev/null || print_warning "Project already linked or linking failed"
    
    # Deploy with detailed error output
    if railway up --service "$NODE_SERVICE_NAME" --verbose; then
        print_success "Node.js service deployed successfully"
    else
        print_error "Node.js service deployment failed"
        print_status "Checking Railway logs..."
        railway logs --service "$NODE_SERVICE_NAME" --tail 50
        
        print_status "Checking build logs..."
        railway logs --service "$NODE_SERVICE_NAME" --tail 100 | grep -E "(error|Error|ERROR|fail|Fail|FAIL)"
        
        exit 1
    fi
    
    cd ..
}

# Function to deploy Python service
deploy_python_service() {
    print_status "Deploying Python ML service..."
    
    cd python-ml-service
    
    if railway up --service "$PYTHON_SERVICE_NAME" --verbose; then
        print_success "Python ML service deployed successfully"
    else
        print_error "Python ML service deployment failed"
        railway logs --service "$PYTHON_SERVICE_NAME" --tail 50
        exit 1
    fi
    
    cd ..
}

# Function to add databases
add_databases() {
    print_status "Adding database services..."
    
    # Add MongoDB
    print_status "Adding MongoDB..."
    railway service create --name mongodb --type mongodb || print_warning "Failed to create MongoDB service"
    
    # Add Redis
    print_status "Adding Redis..."
    railway service create --name redis --type redis || print_warning "Failed to create Redis service"
    
    print_success "Database services added"
}

# Function to show deployment status
show_status() {
    print_status "Checking deployment status..."
    
    railway status
    
    print_success "Deployment completed!"
    print_status "You can view your services at: https://railway.app/dashboard"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up temporary files..."
    
    # Remove backup files created by sed
    find . -name "*.bak" -delete
    
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    echo "�� Railway Deployment Script with Debug Mode"
    echo "============================================="
    
    # Check prerequisites
    check_railway_setup
    check_project_structure
    
    # Prepare the project
    fix_package_json
    add_health_check
    create_railway_configs
    create_nixpacks_config
    
    # Test build locally
    test_build_locally
    
    # Deploy services
    deploy_nodejs_service
    deploy_python_service
    
    # Configure environment
    set_env_variables
    add_databases
    
    # Show status
    show_status
    
    # Cleanup
    cleanup
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    print_status "Your services are now live on Railway!"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -e, --env      Specify environment file path (default: server/.env)"
    echo "  -n, --name     Specify project name (default: foozool-support-ai)"
    echo "  --debug        Enable debug mode with more verbose output"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy with default settings"
    echo "  $0 -e .env.prod       # Deploy with custom env file"
    echo "  $0 -n my-project      # Deploy with custom project name"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -e|--env)
            ENV_FILE="$2"
            shift 2
            ;;
        -n|--name)
            PROJECT_NAME="$2"
            shift 2
            ;;
        --debug)
            set -x  # Enable debug mode
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main "$@"