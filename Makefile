.PHONY: test lint typecheck build verify

test:
	npm test -- --runInBand

lint:
	npm run lint

typecheck:
	npm run typecheck

build:
	npm run build

verify: test lint typecheck build
	@echo "verify: OK"
