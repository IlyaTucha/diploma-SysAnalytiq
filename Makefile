.PHONY: build up down logs migrate createsuperuser app-shell db-shell seed seed-local seed-lessons seed-lessons-local seed-demo seed-demo-local

build:
	docker-compose build

up:
	docker-compose up -d -V

down:
	docker-compose down

logs:
	docker-compose logs -f



build-prod:
	docker-compose -f docker-compose.prod.yml build

up-prod:
	docker-compose -f docker-compose.prod.yml up -d -V

down-prod:
	docker-compose -f docker-compose.prod.yml down

logs-prod:
	docker-compose -f docker-compose.prod.yml logs -f

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

seed:
	docker-compose exec app python manage.py seed_modules

seed-local:
	cd backend && python manage.py seed_modules

seed-all:
	docker-compose exec app python manage.py seed_modules
	docker-compose exec app python manage.py seed_lessons

seed-all-local:
	cd backend && python manage.py seed_modules
	cd backend && python manage.py seed_lessons

seed-lessons:
	docker-compose exec app python manage.py seed_lessons

seed-lessons-local:
	cd backend && python manage.py seed_lessons

seed-demo:
	docker-compose exec app python manage.py seed_demo_submissions

seed-demo-local:
	cd backend && python manage.py seed_demo_submissions

check-front:
	cd frontend && npm run lint && npm run type-check

lint-front:
	cd frontend && npm run lint

test-all:
	cd backend && python -m pytest
	cd frontend && npm run lint
