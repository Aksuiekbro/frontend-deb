.PHONY: test lint typecheck build verify

test:
	@echo "TODO(test): plug in the test runner here, e.g. 'npm test'"
	@exit 0

lint:
	npm run lint

typecheck:
	npx tsc --noEmit

build:
	npm run build

verify: test lint typecheck build
	@echo "verify: OK"
