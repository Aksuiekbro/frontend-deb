#!/usr/bin/env bash
# Bring the isolated Luna backend stack up or down.
#
#   bash e2e/fixtures/luna-backend-v2/luna-stack.sh up
#   bash e2e/fixtures/luna-backend-v2/luna-stack.sh down
#
# On a fresh database the backend must boot once WITHOUT liquibase so Hibernate
# (ddl-auto: update) creates the schema, then boot again WITH liquibase so the
# changelog functions and idempotent ALTERs apply — mirroring how the deployed
# schema evolved. Subsequent `up` runs go straight to the liquibase-enabled boot.
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# This machine has both Docker Desktop and colima; pin one daemon so the stack,
# the harness's `docker exec debetter-postgres`, and manual checks all agree.
export DOCKER_CONTEXT="${LUNA_DOCKER_CONTEXT:-colima}"
COMPOSE=(docker compose -f "$DIR/luna-stack.compose.yml")
API_URL="http://localhost:18080/api/news"

wait_for_api() {
  local attempts=$1
  for ((i = 1; i <= attempts; i++)); do
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$API_URL" || true)
    if [[ "$code" =~ ^[2345][0-9][0-9]$ ]]; then
      return 0
    fi
    sleep 2
  done
  echo "Backend did not answer at $API_URL" >&2
  "${COMPOSE[@]}" logs --tail 40 app >&2 || true
  return 1
}

case "${1:-up}" in
  up)
    schema_ready=$(docker volume inspect luna-backend-v2_luna-db-data >/dev/null 2>&1 && echo yes || echo no)

    if [[ "$schema_ready" == no ]]; then
      echo "Fresh database: phase 1 — boot without liquibase so Hibernate creates the schema."
      SPRING_LIQUIBASE_ENABLED=false "${COMPOSE[@]}" up -d
      wait_for_api 90
      "${COMPOSE[@]}" stop app
    fi

    echo "Phase 2 — boot with liquibase enabled."
    SPRING_LIQUIBASE_ENABLED=true "${COMPOSE[@]}" up -d
    wait_for_api 90
    echo "Luna stack is up: backend at http://localhost:18080/api"
    ;;
  down)
    "${COMPOSE[@]}" down
    ;;
  destroy)
    "${COMPOSE[@]}" down -v
    ;;
  *)
    echo "Usage: luna-stack.sh [up|down|destroy]" >&2
    exit 1
    ;;
esac
