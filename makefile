.PHONY: *


up-test: test-up run


build:
	docker compose build

test-up:
	docker compose up -d mysql jetstream



up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

run:
	bun run run

backup-db:
	./bin/backup-db.sh

import-db:
	./bin/import-db.sh `ls ./backups/*_bunreplybot.sql | tail -1`

install:
	bun install

link:
	bun link bsky-event-handlers