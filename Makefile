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

# ---- Local development (frontend outside Docker) ----

# Start DB + backend in Docker
dev-backend:
	docker-compose up -d db app
	@echo [OK] DB and backend started at http://localhost:8000

# Start frontend locally (Vite dev server)
dev-frontend:
	cd frontend && npm run dev

# Full local start: DB + backend + migrations
# Then run in separate terminals:
#   make dev-frontend
#   ngrok http 5173  (if you need VK auth locally)
dev-start:
	docker-compose up -d db app
	@echo Waiting for DB...
	@ping -n 4 127.0.0.1 >nul 2>&1 || sleep 3
	docker-compose exec app python manage.py migrate --noinput
	@echo [OK] DB and backend ready at http://localhost:8000
	@echo Next steps:
	@echo   make dev-frontend  - start Vite dev server
	@echo   ngrok http 5173    - ngrok tunnel for VK auth

# Stop backend and DB
dev-stop:
	docker-compose stop db app
