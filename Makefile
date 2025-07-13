.PHONY: clean start dev

clean:
	docker rm -f $$(docker ps -a --filter "name=foozool-" -q) || true
	docker network prune -f
	docker volume prune -f

start:
	docker-compose up --build

dev:
	docker-compose up --build
