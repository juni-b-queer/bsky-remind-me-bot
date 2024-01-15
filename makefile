.PHONY: *


up-test: db-up bun-run


build:
	docker compose build

db-up:
	docker compose up -d mysql

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

bun-run:
	bun run run