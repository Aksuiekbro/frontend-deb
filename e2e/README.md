# Luna Browser Matrix

This is a local-only, destructive end-to-end harness for the Luna tournament integrity matrix.

## Prerequisites

On macOS, use Bash with the BSD command-line tools available: `stat`, `mktemp`, `shasum`, and `lsof`. The harness also requires `jq`, Docker Desktop (or a running Docker daemon), Node.js with `npm` and `npx`, and the Playwright browser installed for this project. Run it from a local checkout with the repository dependencies installed.

The isolated Docker stack must already provide:

- PostgreSQL container `debetter-postgres`, with database `debetter` and user `debetter_user`.
- Backend container `luna-backend-app`, using image `debetter-spring-app:luna-backend-v2`.
- The backend API at `http://localhost:18080/api`.

The fixture controller binds only to `127.0.0.1:18081`. The frontend is built and started locally by the harness.

## Fixtures And Accounts

The tracked SQL seeds tournament fixtures `9101`, `9102`, `9103`, `9104`, `9105`, and `9106`. The synthetic account scope is exactly organizer `solborg` plus participants matching `^solbp(0[1-9]|1[0-6])$`, namely `solbp01` through `solbp16`. Reset deletes only those accounts and their related profile, authority, and fixture data. The setup SQL and controller register the same scope.

## Credential Handoff

Create `/tmp/debetter-luna-test.env` as a regular file owned by the current user, with mode `600`, containing exactly one line in this form:

```text
export SOL_BACKEND_PASSWORD=REPLACE_WITH_LOCAL_PASSWORD
```

Use a real local test value in place of the placeholder. Do not commit the file. The harness accepts a 1-32 character value, rejects extra lines and symlinks, and removes the handoff file during cleanup.

## Run

```bash
bash e2e/run-luna-browser-matrix.sh
```

This command resets the local database, registers the synthetic accounts, seeds fixtures, mutates fixture state through the browser matrix, and recreates the local frontend build. Do not point it at production or a shared database. Generated logs, screenshots, traces, reports, and other evidence remain under ignored `test-results/tournament-integrity/luna-browser-v2/` and are not tracked.
