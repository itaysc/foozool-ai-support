.PHONY: clean start build up dev rebuild down help

# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

help:
	@echo "🐳 Foozool Docker Commands:"
	@echo "  make build    - Build all services with cache"
	@echo "  make up       - Start services in background"
	@echo "  make dev      - Start services with logs"
	@echo "  make rebuild  - Clean build and start"
	@echo "  make down     - Stop all services"
	@echo "  make clean    - Remove containers, networks, and volumes"
	@echo "  make start    - Legacy command with watch mode"

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans || true
	docker system prune -f || true
	@echo "✅ Cleanup complete!"

start:
	@echo "🚀 Starting with watch mode..."
	docker-compose up --build --watch

build:
	@echo "🔨 Building with cache and parallel processing..."
	docker-compose build --parallel
	@echo "✅ Build complete!"

up:
	@echo "🚀 Starting services in background..."
	docker-compose up -d
	@echo "✅ Services started! Check logs with: make logs"

dev:
	@echo "🚀 Starting services with live logs..."
	docker-compose up

rebuild:
	@echo "🔨 Clean building from scratch..."
	docker-compose build --no-cache --parallel
	docker-compose up -d
	@echo "✅ Rebuild complete! Services are running."

down:
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped!"

logs:
	docker-compose logs -f

status:
	docker-compose ps
