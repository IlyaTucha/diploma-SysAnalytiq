.PHONY: check run

check:
	cd frontend && npx tsc --noEmit
	cd frontend && npm run lint

run:
	cd frontend && npm run dev
