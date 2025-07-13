#!/bin/bash

echo "🔧 Foozool Support AI - Docker Build Script"
echo "==========================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop or Docker daemon."
        exit 1
    fi
    echo "✅ Docker is running"
}

# Function to clean Docker cache
clean_cache() {
    echo "🧹 Cleaning Docker cache..."
    docker system prune -f
    docker builder prune -f
    echo "✅ Cache cleaned"
}

# Function to try different build strategies
try_build() {
    local strategy=$1
    echo "🚀 Trying build strategy: $strategy"
    
    case $strategy in
        "normal")
            docker-compose build app
            ;;
        "no-cache")
            docker-compose build --no-cache app
            ;;
        "with-retry")
            for i in {1..3}; do
                echo "Attempt $i of 3..."
                if docker-compose build app; then
                    echo "✅ Build successful on attempt $i"
                    return 0
                else
                    echo "❌ Build failed on attempt $i"
                    if [ $i -lt 3 ]; then
                        echo "Waiting 10 seconds before retry..."
                        sleep 10
                    fi
                fi
            done
            return 1
            ;;
    esac
}

# Main script logic
main() {
    check_docker
    
    echo ""
    echo "Choose a build strategy:"
    echo "1) Normal build"
    echo "2) Build with no cache"
    echo "3) Build with retry logic"
    echo "4) Clean cache and build"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            try_build "normal"
            ;;
        2)
            try_build "no-cache"
            ;;
        3)
            try_build "with-retry"
            ;;
        4)
            clean_cache
            try_build "normal"
            ;;
        5)
            echo "👋 Goodbye!"
            exit 0
            ;;
        *)
            echo "❌ Invalid choice. Please run the script again."
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Build completed successfully!"
        echo "You can now run: docker-compose up"
    else
        echo ""
        echo "❌ Build failed. Try a different strategy or check your network connection."
    fi
}

# Run main function
main 