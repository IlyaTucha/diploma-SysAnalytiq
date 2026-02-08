.PHONY: build up down logs migrate createsuperuser app-shell db-shell

build:
	docker-compose build

up:
	docker-compose up -d

down:
	docker-compose down

logs:
	docker-compose logs -f

migrate:
	docker-compose exec app python manage.py migrate

makemigrations:
	docker-compose exec app python manage.py makemigrations

createsuperuser:
	docker-compose exec app python manage.py createsuperuser

app-shell:
	docker-compose exec app bash

db-shell:
	docker-compose exec db psql -U postgres -d diploma

test-back:
	docker-compose exec app python -m pytest

test-back-local:
	cd backend && python -m pytest

check-front:
	cd frontend && npm run lint && npm run type-check

lint-front:
	cd frontend && npm run lint
