#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

CREDENTIAL_FILE=/tmp/debetter-luna-test.env
EVIDENCE_ROOT="$ROOT/test-results/tournament-integrity/luna-browser-v2"
MARKER="$(mktemp -t luna-browser-matrix.XXXXXX)"
CONTROL_HOST="127.0.0.1"
CONTROL_PORT="18081"
CONTROL_READY_URL="http://${CONTROL_HOST}:${CONTROL_PORT}/ready"
CONTROL_INSTANCE_TOKEN=""
CONTROL_INSTANCE_ID_HASH=""
CONTROL_BEFORE_SMOKE_STATUS=1
CONTROL_BEFORE_PLAYWRIGHT_STATUS=1
CONTROL_AFTER_PLAYWRIGHT_STATUS=1
CONTROL_PORT_OWNER=""
PLAYWRIGHT_STATUS=1
RUN_STARTED=0
CONTROL_PID=""
CONTROL_LOG=""
SMOKE_OUTPUT=""
BUILD_LOG=""
BUILD_EVIDENCE_PATH=""
FINAL_VALIDATION_PATH=""
BUILD_ID=""
BUILD_EXIT=1
PACKAGE_LOCK_HASH=""
SOURCE_HASH_BEFORE_RUN=""
SOURCE_HASH_AFTER_RUN=""
FINAL_REPORT_PATH=""
PREBUILD_NEXT_EXISTED=0
PREBUILD_NEXT_REMOVED=0
ENV_ISOLATION_DIR=""
ENV_FILE_LIST=""
ENV_PROOF_PATH=""
ENV_ISOLATION_ACTIVE=0
ENV_RESTORE_STATUS=1
ENV_ISOLATION_STARTED_AT=""
ENV_RESTORED_AT=""
declare -a ENV_PATHS=()
declare -a ENV_MODES=()
declare -a ENV_MOVED_FLAGS=()
NODE_BIN=""
NPM_BIN=""
NPX_BIN=""
EXECUTION_PATH=""
SOL_BACKEND_PASSWORD_VALUE=""
ORGANIZER_USERNAME=""
DEBATER_USERNAME=""
ORGANIZER_PASSWORD=""
DEBATER_PASSWORD=""
CLEANUP_DONE=0

validate_local_inputs() {
  [[ "$CREDENTIAL_FILE" == /tmp/debetter-luna-test.env ]] || {
    printf '%s\n' "Credential handoff path is outside the approved local path." >&2
    return 1
  }
  [[ "$CONTROL_HOST" == "127.0.0.1" && "$CONTROL_PORT" == "18081" ]] || {
    printf '%s\n' "Control host/port must remain http://127.0.0.1:18081." >&2
    return 1
  }
  [[ "$EVIDENCE_ROOT" == "$ROOT/test-results/tournament-integrity/luna-browser-v2" ]] || {
    printf '%s\n' "Evidence path is outside the approved local evidence root." >&2
    return 1
  }
}

parse_credential_handoff() {
  local line
  local raw
  local value
  local line_count
  line_count="$(awk 'END { print NR }' "$CREDENTIAL_FILE")"
  if [[ "$line_count" -ne 1 ]]; then
    printf '%s\n' "Credential handoff must contain exactly one export line." >&2
    return 1
  fi
  IFS= read -r line < "$CREDENTIAL_FILE" || true
  if [[ "$line" == *$'\r'* || "$line" != export\ SOL_BACKEND_PASSWORD=* ]]; then
    printf '%s\n' "Credential handoff must be exactly export SOL_BACKEND_PASSWORD=<value>." >&2
    return 1
  fi
  raw="${line#export SOL_BACKEND_PASSWORD=}"
  if [[ -z "$raw" ]]; then
    printf '%s\n' "Credential handoff password value is empty." >&2
    return 1
  fi
  case "$raw" in
    \'*\')
      value="${raw#\'}"
      value="${value%\'}"
      [[ "$raw" == \'*\' && "$value" != *\'* ]] || {
        printf '%s\n' "Credential handoff has invalid single-quoted syntax." >&2
        return 1
      }
      ;;
    \"*\")
      value="${raw#\"}"
      value="${value%\"}"
      [[ "$raw" == \"*\" && "$value" != *\"* ]] || {
        printf '%s\n' "Credential handoff has invalid double-quoted syntax." >&2
        return 1
      }
      ;;
    *)
      value="$raw"
      [[ "$value" != *[[:space:]]* ]] || {
        printf '%s\n' "Credential handoff has invalid unquoted whitespace." >&2
        return 1
      }
      ;;
  esac
  [[ -n "$value" && "${#value}" -le 32 ]] || {
    printf '%s\n' "Credential handoff password must be 1-32 characters." >&2
    return 1
  }
  SOL_BACKEND_PASSWORD_VALUE="$value"
}

write_env_proof() {
  local status="$1"
  local restored="$2"
  local paths_json='[]'
  local modes_json='[]'
  local moved_json='[]'
  if ((${#ENV_PATHS[@]} > 0)); then
    paths_json="$(printf '%s\n' "${ENV_PATHS[@]}" | jq -Rsc 'split("\n") | map(select(length > 0))')"
    modes_json="$(printf '%s\n' "${ENV_MODES[@]}" | jq -Rsc 'split("\n") | map(select(length > 0))')"
    moved_json="$(printf '%s\n' "${ENV_MOVED_FLAGS[@]}" | jq -Rsc 'split("\n") | map(select(length > 0) | tonumber)')"
  fi
  jq -n \
    --arg status "$status" \
    --arg startedAt "$ENV_ISOLATION_STARTED_AT" \
    --arg restoredAt "$ENV_RESTORED_AT" \
    --argjson fileCount "${#ENV_PATHS[@]}" \
    --argjson paths "$paths_json" \
    --argjson modes "$modes_json" \
    --argjson moved "$moved_json" \
    --argjson restored "$restored" \
    '{
      mode: "project-env-isolation",
      status: $status,
      startedAt: $startedAt,
      restoredAt: (if $restoredAt == "" then null else $restoredAt end),
      fileCount: $fileCount,
      paths: $paths,
      originalModes: $modes,
      movedFlags: $moved,
      restored: ($restored == 1),
      contentsPersisted: false,
      contentHashesPersisted: false
    }' > "$ENV_PROOF_PATH"
}

restore_project_env_files() {
  if [[ "$ENV_ISOLATION_ACTIVE" -ne 1 ]]; then
    ENV_RESTORE_STATUS=0
    return 0
  fi
  local failure=0
  local index
  local relative_path
  local source_path
  local backup_path
  local mode
  for ((index=${#ENV_PATHS[@]} - 1; index >= 0; index--)); do
    relative_path="${ENV_PATHS[index]}"
    mode="${ENV_MODES[index]}"
    source_path="$ROOT/$relative_path"
    backup_path="$ENV_ISOLATION_DIR/$relative_path"
    if [[ -e "$backup_path" || -L "$backup_path" ]]; then
      if [[ -L "$source_path" ]]; then
        failure=1
      elif [[ -e "$source_path" ]]; then
        if ! cmp -s "$backup_path" "$source_path" || [[ "$(stat -f '%Lp' "$source_path")" != "$mode" ]]; then
          failure=1
        else
          rm -f "$backup_path" || failure=1
        fi
      else
        if ! mv "$backup_path" "$source_path" || ! chmod "$mode" "$source_path" || [[ "$(stat -f '%Lp' "$source_path")" != "$mode" ]]; then
          failure=1
        fi
      fi
    elif [[ ! -e "$source_path" && ! -L "$source_path" ]]; then
      failure=1
    elif [[ "$(stat -f '%Lp' "$source_path")" != "$mode" ]]; then
      failure=1
    fi
  done
  if [[ "$failure" -ne 0 ]]; then
    ENV_RESTORE_STATUS=1
    ENV_RESTORED_AT=""
    write_env_proof "restore-failed" 0 || true
    printf '%s\n' "Project .env restoration failed; temporary isolated copies were retained." >&2
    return 1
  fi
  ENV_RESTORED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  ENV_RESTORE_STATUS=0
  write_env_proof "restored" 1 || {
    ENV_RESTORE_STATUS=1
    printf '%s\n' "Project .env restoration proof could not be persisted." >&2
    return 1
  }
  if ! rm -rf "$ENV_ISOLATION_DIR"; then
    ENV_RESTORE_STATUS=1
    printf '%s\n' "Project .env temporary isolation directory could not be removed." >&2
    return 1
  fi
  ENV_ISOLATION_ACTIVE=0
  return 0
}

isolate_project_env_files() {
  local source_path
  local relative_path
  local backup_path
  local mode
  ENV_ISOLATION_DIR="$(mktemp -d "$ROOT/.release-env-isolation.XXXXXX")"
  chmod 700 "$ENV_ISOLATION_DIR"
  [[ "$(stat -f '%Lp' "$ENV_ISOLATION_DIR")" == "700" ]] || {
    printf '%s\n' "Project .env isolation directory could not be secured." >&2
    return 1
  }
  ENV_FILE_LIST="$ENV_ISOLATION_DIR/.paths"
  : > "$ENV_FILE_LIST"
  chmod 600 "$ENV_FILE_LIST"
  if ! find "$ROOT" \
      \( -path "$ROOT/.git" -o -path "$ROOT/node_modules" -o -path "$ROOT/.next" -o -path "$ROOT/test-results" \) -prune -o \
      -name '.env*' -print0 > "$ENV_FILE_LIST"; then
    printf '%s\n' "Project .env file discovery failed." >&2
    return 1
  fi
  ENV_ISOLATION_ACTIVE=1
  ENV_ISOLATION_STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  while IFS= read -r -d '' source_path; do
    if [[ ! -f "$source_path" || -L "$source_path" ]]; then
      printf '%s\n' "Project .env isolation only permits regular files." >&2
      restore_project_env_files
      return 1
    fi
    relative_path="${source_path#"$ROOT/"}"
    backup_path="$ENV_ISOLATION_DIR/$relative_path"
    mode="$(stat -f '%Lp' "$source_path")"
    ENV_PATHS+=("$relative_path")
    ENV_MODES+=("$mode")
    ENV_MOVED_FLAGS+=(0)
    if ! mkdir -p "$(dirname "$backup_path")" || ! mv "$source_path" "$backup_path"; then
      printf '%s\n' "Project .env isolation move failed." >&2
      restore_project_env_files
      return 1
    fi
    ENV_MOVED_FLAGS[$((${#ENV_MOVED_FLAGS[@]} - 1))]=1
    if [[ "$(stat -f '%Lp' "$backup_path")" != "$mode" ]]; then
      printf '%s\n' "Project .env isolation could not verify moved file mode." >&2
      restore_project_env_files
      return 1
    fi
  done < "$ENV_FILE_LIST"
  rm -f "$ENV_FILE_LIST"
  ENV_FILE_LIST=""
  ENV_PROOF_PATH="$EVIDENCE_ROOT/env-isolation-${$}.json"
  write_env_proof "isolated" 0
}

compute_relevant_source_hash() {
  node --input-type=module <<'NODE'
import { createHash } from "node:crypto"
import { lstat, readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const sourceRoots = [
  "app",
  "components",
  "client",
  "e2e",
  "hooks",
  "lib",
  "public",
  "styles",
  "types",
  "components.json",
  "eslint.config.mjs",
  "next-env.d.ts",
  "next.config.mjs",
  "package.json",
  "package-lock.json",
  "playwright.config.ts",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
]
const excludedDirectoryNames = new Set([".git", ".next", "node_modules", "test-results"])
const isExcluded = (relativePath) => {
  const segments = relativePath.split(path.sep)
  const basename = segments[segments.length - 1] ?? ""
  return segments.some((segment) => excludedDirectoryNames.has(segment) || /(?:secret|credential|password|token)/i.test(segment)) ||
    basename === ".npmrc" ||
    basename.startsWith(".env") ||
    /(?:secret|credential|password|token)/i.test(basename)
}
const files = []
const collect = async (relativePath) => {
  if (isExcluded(relativePath)) return
  const absolutePath = path.join(root, relativePath)
  let info
  try {
    info = await lstat(absolutePath)
  } catch {
    return
  }
  if (info.isFile()) {
    files.push(relativePath)
    return
  }
  if (!info.isDirectory()) return
  const entries = await readdir(absolutePath, { withFileTypes: true })
  for (const entry of entries) await collect(path.join(relativePath, entry.name))
}
for (const sourceRoot of sourceRoots) await collect(sourceRoot)
files.sort()
const digest = createHash("sha256")
for (const relativePath of files) {
  const contentHash = createHash("sha256").update(await readFile(path.join(root, relativePath))).digest("hex")
  digest.update(`${relativePath.split(path.sep).join("/")}\0${contentHash}\n`)
}
process.stdout.write(digest.digest("hex"))
NODE
}

write_build_evidence() {
  local build_log_path="${BUILD_LOG#"$ROOT/"}"
  local build_evidence_path="${BUILD_EVIDENCE_PATH#"$ROOT/"}"
  local build_log_hash=""
  if [[ -f "$BUILD_LOG" ]]; then
    build_log_hash="$(shasum -a 256 "$BUILD_LOG" | awk '{print $1}')"
  fi
  jq -n \
    --arg mode "release-matrix" \
    --argjson preBuildNextExistedBeforeRemoval "$PREBUILD_NEXT_EXISTED" \
    --argjson preBuildNextRemoved "$PREBUILD_NEXT_REMOVED" \
    --arg buildId "$BUILD_ID" \
    --arg buildLogPath "$build_log_path" \
    --arg buildLogHash "$build_log_hash" \
    --argjson buildExit "$BUILD_EXIT" \
    --arg envIsolationEvidencePath "${ENV_PROOF_PATH#"$ROOT/"}" \
    --arg controlInstanceIdHash "$CONTROL_INSTANCE_ID_HASH" \
    --arg packageLockHash "$PACKAGE_LOCK_HASH" \
    --arg sourceHashBeforeRun "$SOURCE_HASH_BEFORE_RUN" \
    --arg backendURL "http://localhost:18080/api" \
    --arg nextPublicApiURL "/api" \
    --arg previewMode "false" \
    --arg previewRole "participant" \
    --arg demoMode "false" \
    --arg localOnly "1" \
    --arg releaseMatrix "1" \
    --arg nodeEnv "production" \
    '{
      mode: $mode,
      preBuildNextExistedBeforeRemoval: ($preBuildNextExistedBeforeRemoval == 1),
      preBuildNextRemoved: ($preBuildNextRemoved == 1),
      buildId: $buildId,
      buildLogPath: $buildLogPath,
      buildLogHash: $buildLogHash,
      buildExit: $buildExit,
      envIsolationEvidencePath: $envIsolationEvidencePath,
      controlInstanceIdHash: $controlInstanceIdHash,
      explicitEnv: {
        BACKEND_URL: $backendURL,
        NEXT_PUBLIC_API_URL: $nextPublicApiURL,
        NEXT_PUBLIC_PREVIEW_MODE: $previewMode,
        NEXT_PUBLIC_PREVIEW_ROLE: $previewRole,
        NEXT_PUBLIC_DEMO_MODE: $demoMode,
        NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: $localOnly,
        TOURNAMENT_INTEGRITY_RELEASE_MATRIX: $releaseMatrix,
        NODE_ENV: $nodeEnv
      },
      packageLockHash: $packageLockHash,
      sourceHashBeforeRun: $sourceHashBeforeRun
    }' > "$BUILD_EVIDENCE_PATH"
  printf 'Release build evidence: %s\n' "$BUILD_EVIDENCE_PATH"
}

stop_frontend_listeners() {
  local port
  local listeners
  local attempts
  for port in 3000 3001; do
    attempts=0
    while true; do
      listeners="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
      if [[ -z "$listeners" ]]; then
        break
      fi
      kill $listeners 2>/dev/null || true
      attempts=$((attempts + 1))
      if [[ "$attempts" -ge 10 ]]; then
        kill -KILL $listeners 2>/dev/null || true
        sleep 1
        listeners="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
        if [[ -n "$listeners" ]]; then
          printf 'Unable to free localhost:%s before fresh frontend start.\n' "$port" >&2
          return 1
        fi
        break
      fi
      sleep 0.2
    done
  done
}

assert_frontend_ports_free() {
  local port
  local listeners
  for port in 3000 3001; do
    listeners="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -n "$listeners" ]]; then
      printf 'localhost:%s still has a listener before fresh frontend start.\n' "$port" >&2
      return 1
    fi
  done
}

assert_control_port_free() {
  local listeners
  listeners="$(lsof -tiTCP:"$CONTROL_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$listeners" ]]; then
    printf 'localhost:%s must be free before controller start; found listener(s): %s\n' "$CONTROL_PORT" "$listeners" >&2
    return 1
  fi
}

assert_controller_instance() {
  local listeners
  local listener_count
  if [[ -z "$CONTROL_PID" ]] || ! kill -0 "$CONTROL_PID" 2>/dev/null; then
    printf '%s\n' "Controller process is not alive." >&2
    return 1
  fi
  listeners="$(lsof -tiTCP:"$CONTROL_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  listener_count="$(printf '%s\n' "$listeners" | awk 'NF { count += 1 } END { print count + 0 }')"
  CONTROL_PORT_OWNER="$listeners"
  if [[ "$listener_count" -ne 1 || "$listeners" != "$CONTROL_PID" ]]; then
    printf 'Controller pid %s does not exclusively own localhost:%s (listeners=%s).\n' "$CONTROL_PID" "$CONTROL_PORT" "$listeners" >&2
    return 1
  fi
  env -i \
    PATH="$EXECUTION_PATH" \
    CONTROL_INSTANCE_TOKEN="$CONTROL_INSTANCE_TOKEN" \
    CONTROL_READY_URL="$CONTROL_READY_URL" \
    "$NODE_BIN" --input-type=module <<'NODE'
const { CONTROL_INSTANCE_TOKEN, CONTROL_READY_URL } = process.env
const { createHash } = await import("node:crypto")
const response = await fetch(CONTROL_READY_URL)
if (!response.ok) throw new Error(`controller readiness returned ${response.status}`)
const report = await response.json()
const expectedHash = createHash("sha256").update(CONTROL_INSTANCE_TOKEN).digest("hex")
if (report.ready !== true || report.instanceToken !== CONTROL_INSTANCE_TOKEN || report.instanceIdHash !== expectedHash || report.bind !== "127.0.0.1:18081") {
  throw new Error("controller readiness identity did not match this run")
}
NODE
}

cleanup() {
  local exit_status=$?
  if [[ "$CLEANUP_DONE" -eq 1 ]]; then
    return "$exit_status"
  fi
  CLEANUP_DONE=1
  trap - EXIT INT TERM HUP QUIT
  set +e
  if [[ -n "$CONTROL_PID" ]]; then
    kill "$CONTROL_PID" 2>/dev/null || true
    wait "$CONTROL_PID" 2>/dev/null || true
  fi
  if [[ "$RUN_STARTED" -eq 1 ]]; then
    for port in 3000 3001; do
      local listeners
      listeners="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
      if [[ -n "$listeners" ]]; then
        kill $listeners 2>/dev/null || true
      fi
    done
  fi
  if [[ "$ENV_ISOLATION_ACTIVE" -eq 1 ]]; then
    restore_project_env_files || exit_status=1
  elif [[ -n "$ENV_ISOLATION_DIR" && -d "$ENV_ISOLATION_DIR" ]]; then
    rm -rf "$ENV_ISOLATION_DIR" || exit_status=1
  fi
  if [[ -n "$FINAL_VALIDATION_PATH" && -f "$FINAL_VALIDATION_PATH" ]]; then
    local validation_temp="${FINAL_VALIDATION_PATH}.tmp"
    local restored_value=0
    if [[ "$ENV_RESTORE_STATUS" -eq 0 ]]; then
      restored_value=1
    fi
    if ! jq --argjson restored "$restored_value" '.environmentIsolationRestoredAfterCleanup = ($restored == 1)' "$FINAL_VALIDATION_PATH" > "$validation_temp" || ! mv -f "$validation_temp" "$FINAL_VALIDATION_PATH"; then
      rm -f "$validation_temp"
      exit_status=1
    fi
  fi
  find "$EVIDENCE_ROOT" -type f -exec chmod 444 {} + 2>/dev/null || true
  find "$EVIDENCE_ROOT" -type d -exec chmod 555 {} + 2>/dev/null || true
  rm -f "$CREDENTIAL_FILE"
  if [[ -n "$CONTROL_LOG" && -f "$CONTROL_LOG" ]]; then
    chmod 444 "$CONTROL_LOG" 2>/dev/null || true
  fi
  if [[ -n "$ENV_PROOF_PATH" && -f "$ENV_PROOF_PATH" ]]; then
    printf 'Environment isolation proof: %s (restored=%s)\n' "$ENV_PROOF_PATH" "$([[ "$ENV_RESTORE_STATUS" -eq 0 ]] && printf true || printf false)"
  fi
  rm -f "$MARKER"
  exit "$exit_status"
}
trap cleanup EXIT INT TERM HUP QUIT

if [[ ! -f "$CREDENTIAL_FILE" ]]; then
  printf '%s\n' "Missing credential handoff: $CREDENTIAL_FILE" >&2
  exit 2
fi
if [[ -L "$CREDENTIAL_FILE" ]]; then
  printf '%s\n' "Credential handoff must not be a symlink." >&2
  exit 2
fi
if [[ "$(stat -f '%Lp' "$CREDENTIAL_FILE")" != "600" ]]; then
  printf '%s\n' "Credential handoff must have mode 600." >&2
  exit 2
fi
if [[ "$(stat -f '%u' "$CREDENTIAL_FILE")" != "$(id -u)" ]]; then
  printf '%s\n' "Credential handoff must be owned by the current user." >&2
  exit 2
fi

validate_local_inputs
parse_credential_handoff

NODE_BIN="$(command -v node || true)"
NPM_BIN="$(command -v npm || true)"
NPX_BIN="$(command -v npx || true)"
if [[ -z "$NODE_BIN" || -z "$NPM_BIN" || -z "$NPX_BIN" || ! -x "$NODE_BIN" || ! -x "$NPM_BIN" || ! -x "$NPX_BIN" ]]; then
  printf '%s\n' "node, npm, and npx must be available as executable local tools." >&2
  exit 2
fi
EXECUTION_PATH="${PATH:-/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin}"
ORGANIZER_USERNAME="solborg"
DEBATER_USERNAME="solbp01"
ORGANIZER_PASSWORD="$SOL_BACKEND_PASSWORD_VALUE"
DEBATER_PASSWORD="$SOL_BACKEND_PASSWORD_VALUE"
CONTROL_INSTANCE_TOKEN="$(env -i PATH="$EXECUTION_PATH" "$NODE_BIN" --input-type=module -e 'import { randomBytes } from "node:crypto"; process.stdout.write(randomBytes(32).toString("hex"))')"
CONTROL_INSTANCE_ID_HASH="$(printf '%s' "$CONTROL_INSTANCE_TOKEN" | shasum -a 256 | awk '{print $1}')"
if [[ ! "$CONTROL_INSTANCE_TOKEN" =~ ^[a-f0-9]{64}$ || ! "$CONTROL_INSTANCE_ID_HASH" =~ ^[a-f0-9]{64}$ ]]; then
  printf '%s\n' "Controller instance identity generation failed." >&2
  exit 2
fi

mkdir -p "$EVIDENCE_ROOT/runs"
chmod 755 "$EVIDENCE_ROOT" "$EVIDENCE_ROOT/runs"
ENV_PROOF_PATH="$EVIDENCE_ROOT/env-isolation-${$}.json"
isolate_project_env_files

stop_frontend_listeners
assert_frontend_ports_free
assert_control_port_free

BUILD_LOG="$EVIDENCE_ROOT/release-build-${$}.log"
BUILD_EVIDENCE_PATH="$EVIDENCE_ROOT/release-build-evidence-${$}.json"
PACKAGE_LOCK_HASH="$(shasum -a 256 "$ROOT/package-lock.json" | awk '{print $1}')"
SOURCE_HASH_BEFORE_RUN="$(compute_relevant_source_hash)"
if [[ -e "$ROOT/.next" ]]; then
  PREBUILD_NEXT_EXISTED=1
fi
printf 'preBuildNextExistedBeforeRemoval=%s\n' "$PREBUILD_NEXT_EXISTED" > "$BUILD_LOG"
rm -rf "$ROOT/.next"
if [[ -e "$ROOT/.next" ]]; then
  printf '%s\n' 'preBuildNextRemoved=false' >> "$BUILD_LOG"
  printf '%s\n' 'Release build refused to start because .next could not be removed.' >&2
  exit 1
fi
PREBUILD_NEXT_REMOVED=1
printf '%s\n' 'preBuildNextRemoved=true' >> "$BUILD_LOG"
printf 'Starting clean release build with source hash %s.\n' "$SOURCE_HASH_BEFORE_RUN"
set +e
env -i \
  PATH="$EXECUTION_PATH" \
  HOME="${HOME:-/tmp}" \
  TMPDIR="${TMPDIR:-/tmp}" \
  LANG="${LANG:-C}" \
  LC_ALL="${LC_ALL:-C}" \
  NODE_ENV="production" \
  BACKEND_URL="http://localhost:18080/api" \
  NEXT_PUBLIC_API_URL="/api" \
  NEXT_PUBLIC_PREVIEW_MODE="false" \
  NEXT_PUBLIC_PREVIEW_ROLE="participant" \
  NEXT_PUBLIC_DEMO_MODE="false" \
  NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY="1" \
  TOURNAMENT_INTEGRITY_RELEASE_MATRIX="1" \
  "$NPM_BIN" run build >>"$BUILD_LOG" 2>&1
BUILD_EXIT=$?
set -e
if [[ -f "$ROOT/.next/BUILD_ID" ]]; then
  BUILD_ID="$(tr -d '\r\n' < "$ROOT/.next/BUILD_ID")"
fi
write_build_evidence
printf 'Release build exit: %s\n' "$BUILD_EXIT"
if [[ "$BUILD_EXIT" -ne 0 ]]; then
  printf 'Release build failed; Playwright will not start. Log: %s\n' "$BUILD_LOG" >&2
  exit "$BUILD_EXIT"
fi
if [[ -z "$BUILD_ID" ]]; then
  printf '%s\n' "Release build completed without .next/BUILD_ID; Playwright will not start." >&2
  exit 1
fi
export TOURNAMENT_INTEGRITY_RELEASE_BUILD_ID="$BUILD_ID"
export TOURNAMENT_INTEGRITY_RELEASE_BUILD_EVIDENCE_PATH="$BUILD_EVIDENCE_PATH"
export TOURNAMENT_INTEGRITY_RELEASE_SOURCE_HASH_BEFORE_RUN="$SOURCE_HASH_BEFORE_RUN"
CONTROL_LOG="$EVIDENCE_ROOT/controller-${$}.log"
SMOKE_OUTPUT="$EVIDENCE_ROOT/controller-smoke-${$}.json"
assert_control_port_free
env -i \
  PATH="$EXECUTION_PATH" \
  HOME="${HOME:-/tmp}" \
  TMPDIR="${TMPDIR:-/tmp}" \
  LANG="${LANG:-C}" \
  LC_ALL="${LC_ALL:-C}" \
  NODE_ENV="production" \
  SOL_BACKEND_PASSWORD="$SOL_BACKEND_PASSWORD_VALUE" \
  SOL_BACKEND_DB_CONTAINER="debetter-postgres" \
  SOL_BACKEND_DB_USER="debetter_user" \
  SOL_BACKEND_DB_NAME="debetter" \
  LUNA_CONTROL_INSTANCE_TOKEN="$CONTROL_INSTANCE_TOKEN" \
  "$NODE_BIN" e2e/fixtures/luna-backend-v2/control-service.mjs >"$CONTROL_LOG" 2>&1 &
CONTROL_PID=$!
sleep 1

poll_controller_ready() {
  env -i \
    PATH="$EXECUTION_PATH" \
    CONTROL_INSTANCE_TOKEN="$CONTROL_INSTANCE_TOKEN" \
    CONTROL_READY_URL="$CONTROL_READY_URL" \
    "$NODE_BIN" --input-type=module <<'NODE'
const { CONTROL_INSTANCE_TOKEN, CONTROL_READY_URL } = process.env
const { createHash } = await import("node:crypto")
const response = await fetch(CONTROL_READY_URL)
  if (!response.ok) throw new Error(`controller readiness returned ${response.status}`)
  const report = await response.json()
  const expectedHash = createHash("sha256").update(CONTROL_INSTANCE_TOKEN).digest("hex")
  if (report.ready !== true || report.instanceToken !== CONTROL_INSTANCE_TOKEN || report.instanceIdHash !== expectedHash || report.bind !== "127.0.0.1:18081") throw new Error("controller readiness identity did not match this run")
  const fixtures = report.fixtures
  if (!Array.isArray(fixtures) || fixtures.length !== 6) throw new Error("controller readiness did not provide six fixtures")
  for (const fixtureId of [9101, 9102, 9103, 9104, 9105, 9106]) {
    const fixture = fixtures.find((entry) => entry && entry.fixtureId === fixtureId)
    if (!fixture || typeof fixture.tournamentId !== "number" || fixture.resetURL !== `http://127.0.0.1:18081/fixtures/${fixtureId}/reset` || fixture.stateURL !== `http://127.0.0.1:18081/fixtures/${fixtureId}/state`) {
      throw new Error(`controller readiness omitted explicit fixture ${fixtureId} endpoints`)
    }
  }
NODE
}

if ! poll_controller_ready; then
  printf '%s\n' "Controller readiness poll 1 failed." >&2
  exit 1
fi
sleep 2
if ! poll_controller_ready; then
  printf '%s\n' "Controller readiness poll 2 failed." >&2
  exit 1
fi
if ! assert_controller_instance; then
  printf '%s\n' "Controller identity check before smoke failed." >&2
  exit 1
fi
CONTROL_BEFORE_SMOKE_STATUS=0

env -i \
  PATH="$EXECUTION_PATH" \
  SMOKE_OUTPUT="$SMOKE_OUTPUT" \
  "$NODE_BIN" --input-type=module <<'NODE'
const fs = await import("node:fs/promises")
const base = "http://127.0.0.1:18081"
const reset = await fetch(`${base}/fixtures/9101/reset`, { method: "POST" })
const resetBody = await reset.json()
if (reset.status !== 200 || resetBody.reset !== true || resetBody.fixtureId !== 9101 || resetBody.stateURL !== `${base}/fixtures/9101/state`) {
  throw new Error(`controller reset smoke failed with status ${reset.status}`)
}
const state = await fetch(`${base}/fixtures/9101/state`)
const stateBody = await state.json()
if (state.status !== 200 || stateBody.fixtureId !== 9101 || stateBody.tournamentId !== 9101) {
  throw new Error(`controller state smoke failed with status ${state.status}`)
}
await fs.writeFile(process.env.SMOKE_OUTPUT, `${JSON.stringify({
  controller: base,
  fixtureId: 9101,
  reset: { status: reset.status, body: resetBody },
  state: { status: state.status, schemaVersion: stateBody.schemaVersion, fixtureId: stateBody.fixtureId, tournamentId: stateBody.tournamentId, counts: stateBody.counts },
}, null, 2)}\n`)
NODE

env -i \
  PATH="$EXECUTION_PATH" \
  HOME="${HOME:-/tmp}" \
  TMPDIR="${TMPDIR:-/tmp}" \
  LANG="${LANG:-C}" \
  LC_ALL="${LC_ALL:-C}" \
  BACKEND_URL="http://localhost:18080/api" \
  ORGANIZER_USERNAME="$ORGANIZER_USERNAME" \
  ORGANIZER_PASSWORD="$ORGANIZER_PASSWORD" \
  DEBATER_USERNAME="$DEBATER_USERNAME" \
  DEBATER_PASSWORD="$DEBATER_PASSWORD" \
  "$NODE_BIN" --input-type=module <<'NODE'
const base = process.env.BACKEND_URL
const logins = [
  [process.env.ORGANIZER_USERNAME, process.env.ORGANIZER_PASSWORD],
  [process.env.DEBATER_USERNAME, process.env.DEBATER_PASSWORD],
]
for (const [username, password] of logins) {
  const response = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
  if (response.status !== 200) throw new Error(`localhost backend login failed with status ${response.status}`)
}
NODE

if ! assert_controller_instance; then
  printf '%s\n' "Controller identity check before Playwright failed." >&2
  exit 1
fi
CONTROL_BEFORE_PLAYWRIGHT_STATUS=0

touch "$MARKER"
RUN_STARTED=1
set +e
env -i \
  PATH="$EXECUTION_PATH" \
  HOME="${HOME:-/tmp}" \
  TMPDIR="${TMPDIR:-/tmp}" \
  LANG="${LANG:-C}" \
  LC_ALL="${LC_ALL:-C}" \
  NODE_ENV="production" \
  PLAYWRIGHT_BASE_URL="http://localhost:3000" \
  PLAYWRIGHT_PORT="3000" \
  BACKEND_URL="http://localhost:18080/api" \
  NEXT_PUBLIC_API_URL="/api" \
  NEXT_PUBLIC_PREVIEW_MODE="false" \
  NEXT_PUBLIC_PREVIEW_ROLE="participant" \
  NEXT_PUBLIC_DEMO_MODE="false" \
  NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY="1" \
  TOURNAMENT_INTEGRITY_RELEASE_MATRIX="1" \
  TOURNAMENT_INTEGRITY_RELEASE_BUILD_ID="$BUILD_ID" \
  TOURNAMENT_INTEGRITY_RELEASE_BUILD_EVIDENCE_PATH="$BUILD_EVIDENCE_PATH" \
  TOURNAMENT_INTEGRITY_RELEASE_SOURCE_HASH_BEFORE_RUN="$SOURCE_HASH_BEFORE_RUN" \
  TOURNAMENT_INTEGRITY_CONTROL_INSTANCE_TOKEN="$CONTROL_INSTANCE_TOKEN" \
  TOURNAMENT_INTEGRITY_API_BASE_URL="http://localhost:18080/api" \
  TOURNAMENT_INTEGRITY_READY_URL="http://127.0.0.1:18081/ready" \
  TOURNAMENT_INTEGRITY_ORGANIZER_USERNAME="$ORGANIZER_USERNAME" \
  TOURNAMENT_INTEGRITY_ORGANIZER_PASSWORD="$ORGANIZER_PASSWORD" \
  TOURNAMENT_INTEGRITY_DEBATER_USERNAME="$DEBATER_USERNAME" \
  TOURNAMENT_INTEGRITY_DEBATER_PASSWORD="$DEBATER_PASSWORD" \
  TOURNAMENT_INTEGRITY_ALLOW_WRITES="1" \
  "$NPX_BIN" playwright test e2e/tournament-results-integrity.spec.ts
PLAYWRIGHT_STATUS=$?
set -e

set +e
assert_controller_instance
CONTROL_AFTER_PLAYWRIGHT_STATUS=$?
set -e

SOURCE_HASH_COMPUTE_EXIT=0
set +e
SOURCE_HASH_AFTER_RUN="$(compute_relevant_source_hash)"
SOURCE_HASH_COMPUTE_EXIT=$?
set -e
SOURCE_HASH_UNCHANGED=0
if [[ "$SOURCE_HASH_COMPUTE_EXIT" -eq 0 && -n "$SOURCE_HASH_AFTER_RUN" && "$SOURCE_HASH_AFTER_RUN" == "$SOURCE_HASH_BEFORE_RUN" ]]; then
  SOURCE_HASH_UNCHANGED=1
fi

REPORT_COUNT=0
REPORT_PATH=""
while IFS= read -r report_path; do
  REPORT_COUNT=$((REPORT_COUNT + 1))
  REPORT_PATH="$report_path"
done < <(find "$EVIDENCE_ROOT/runs" -type f -name final-report.json -newer "$MARKER" -print | sort)
if [[ "$REPORT_COUNT" -eq 1 ]]; then
  FINAL_REPORT_PATH="${REPORT_PATH#"$ROOT/"}"
fi

FINAL_VALIDATION_PATH="$EVIDENCE_ROOT/release-final-validation-${$}.json"
jq -n \
  --arg mode "release-matrix" \
  --arg buildId "$BUILD_ID" \
  --arg buildEvidencePath "${BUILD_EVIDENCE_PATH#"$ROOT/"}" \
  --arg envIsolationEvidencePath "${ENV_PROOF_PATH#"$ROOT/"}" \
  --arg controlInstanceIdHash "$CONTROL_INSTANCE_ID_HASH" \
  --arg controlPid "$CONTROL_PID" \
  --arg controlPortOwner "$CONTROL_PORT_OWNER" \
  --arg sourceHashBeforeRun "$SOURCE_HASH_BEFORE_RUN" \
  --arg sourceHashAfterRun "$SOURCE_HASH_AFTER_RUN" \
  --argjson preBuildNextRemoved "$PREBUILD_NEXT_REMOVED" \
  --arg sourceHashError "$(if [[ "$SOURCE_HASH_COMPUTE_EXIT" -eq 0 ]]; then printf ''; else printf 'recompute exited %s' "$SOURCE_HASH_COMPUTE_EXIT"; fi)" \
  --arg finalReportPath "$FINAL_REPORT_PATH" \
  --argjson buildExit "$BUILD_EXIT" \
  --argjson playwrightExit "$PLAYWRIGHT_STATUS" \
  --argjson controlBeforeSmoke "$CONTROL_BEFORE_SMOKE_STATUS" \
  --argjson controlBeforePlaywright "$CONTROL_BEFORE_PLAYWRIGHT_STATUS" \
  --argjson controlAfterPlaywright "$CONTROL_AFTER_PLAYWRIGHT_STATUS" \
  --argjson sourceHashUnchanged "$SOURCE_HASH_UNCHANGED" \
  '{
    mode: $mode,
    buildId: $buildId,
    buildEvidencePath: $buildEvidencePath,
    envIsolationEvidencePath: $envIsolationEvidencePath,
    environmentIsolationRestoredAfterCleanup: null,
    controller: {
      host: "127.0.0.1",
      port: 18081,
      pid: $controlPid,
      portOwner: $controlPortOwner,
      instanceIdHash: $controlInstanceIdHash,
      beforeSmoke: ($controlBeforeSmoke == 0),
      beforePlaywright: ($controlBeforePlaywright == 0),
      afterPlaywright: ($controlAfterPlaywright == 0)
    },
    buildExit: $buildExit,
    preBuildNextRemoved: ($preBuildNextRemoved == 1),
    playwrightExit: $playwrightExit,
    sourceHashBeforeRun: $sourceHashBeforeRun,
    sourceHashAfterRun: $sourceHashAfterRun,
    sourceHashUnchanged: ($sourceHashUnchanged == 1),
    sourceHashError: (if $sourceHashError == "" then null else $sourceHashError end),
    finalReportPath: (if $finalReportPath == "" then null else $finalReportPath end)
  }' > "$FINAL_VALIDATION_PATH"

REPORT_VALID=1
BUILD_EVIDENCE_VALID=1
FINAL_VALIDATION_VALID=1
if jq -e \
  --arg buildId "$BUILD_ID" \
  --arg packageLockHash "$PACKAGE_LOCK_HASH" \
  --arg sourceHashBeforeRun "$SOURCE_HASH_BEFORE_RUN" \
  --arg sourceHashAfterRun "$SOURCE_HASH_AFTER_RUN" \
  --arg buildLogPath "${BUILD_LOG#"$ROOT/"}" \
  --arg buildLogHash "$(shasum -a 256 "$BUILD_LOG" | awk '{print $1}')" \
  --arg buildEvidencePath "${BUILD_EVIDENCE_PATH#"$ROOT/"}" \
  --arg envIsolationEvidencePath "${ENV_PROOF_PATH#"$ROOT/"}" \
  --arg controlInstanceIdHash "$CONTROL_INSTANCE_ID_HASH" \
  --arg finalValidationPath "${FINAL_VALIDATION_PATH#"$ROOT/"}" \
  --argjson buildExit "$BUILD_EXIT" \
  --argjson playwrightExit "$PLAYWRIGHT_STATUS" \
  --argjson controlBeforeSmoke "$CONTROL_BEFORE_SMOKE_STATUS" \
  --argjson controlBeforePlaywright "$CONTROL_BEFORE_PLAYWRIGHT_STATUS" \
  --argjson controlAfterPlaywright "$CONTROL_AFTER_PLAYWRIGHT_STATUS" \
  --argjson sourceHashUnchanged "$SOURCE_HASH_UNCHANGED" \
  '.mode == "release-matrix" and
   .buildId == $buildId and
   ((.preBuildNextExistedBeforeRemoval | type) == "boolean") and
   .preBuildNextRemoved == true and
   .buildLogPath == $buildLogPath and
   (.buildLogHash | test("^[a-f0-9]{64}$")) and
   .buildExit == $buildExit and
   .envIsolationEvidencePath == $envIsolationEvidencePath and
   (.controlInstanceIdHash | test("^[a-f0-9]{64}$")) and
   .controlInstanceIdHash == $controlInstanceIdHash and
   .explicitEnv == {
     BACKEND_URL: "http://localhost:18080/api",
     NEXT_PUBLIC_API_URL: "/api",
     NEXT_PUBLIC_PREVIEW_MODE: "false",
     NEXT_PUBLIC_PREVIEW_ROLE: "participant",
     NEXT_PUBLIC_DEMO_MODE: "false",
     NEXT_PUBLIC_INTEGRITY_LOCAL_ONLY: "1",
     TOURNAMENT_INTEGRITY_RELEASE_MATRIX: "1",
     NODE_ENV: "production"
   } and
   .buildLogHash == $buildLogHash and
   (.packageLockHash | test("^[a-f0-9]{64}$")) and
   .packageLockHash == $packageLockHash and
   .sourceHashBeforeRun == $sourceHashBeforeRun and
   $buildExit == 0 and
   ($buildId | length) > 0' "$BUILD_EVIDENCE_PATH" >/dev/null; then
  BUILD_EVIDENCE_VALID=0
fi
if [[ ! -f "$ENV_PROOF_PATH" ]]; then
  BUILD_EVIDENCE_VALID=1
elif ! jq -e '.mode == "project-env-isolation" and .restored == false and .contentsPersisted == false and .contentHashesPersisted == false' "$ENV_PROOF_PATH" >/dev/null; then
  BUILD_EVIDENCE_VALID=1
fi
if jq -e \
  --arg buildId "$BUILD_ID" \
  --arg buildEvidencePath "${BUILD_EVIDENCE_PATH#"$ROOT/"}" \
  --arg envIsolationEvidencePath "${ENV_PROOF_PATH#"$ROOT/"}" \
  --arg controlInstanceIdHash "$CONTROL_INSTANCE_ID_HASH" \
  --arg sourceHashBeforeRun "$SOURCE_HASH_BEFORE_RUN" \
  --arg sourceHashAfterRun "$SOURCE_HASH_AFTER_RUN" \
  --argjson preBuildNextRemoved "$PREBUILD_NEXT_REMOVED" \
  --arg finalReportPath "$FINAL_REPORT_PATH" \
  --argjson buildExit "$BUILD_EXIT" \
  --argjson playwrightExit "$PLAYWRIGHT_STATUS" \
  --argjson controlBeforeSmoke "$CONTROL_BEFORE_SMOKE_STATUS" \
  --argjson controlBeforePlaywright "$CONTROL_BEFORE_PLAYWRIGHT_STATUS" \
  --argjson controlAfterPlaywright "$CONTROL_AFTER_PLAYWRIGHT_STATUS" \
  --argjson sourceHashUnchanged "$SOURCE_HASH_UNCHANGED" \
  '.mode == "release-matrix" and
   .buildId == $buildId and
   .buildEvidencePath == $buildEvidencePath and
   .envIsolationEvidencePath == $envIsolationEvidencePath and
   .buildExit == $buildExit and
   .playwrightExit == $playwrightExit and
   .controller.instanceIdHash == $controlInstanceIdHash and
   .controller.beforeSmoke == ($controlBeforeSmoke == 0) and
   .controller.beforePlaywright == ($controlBeforePlaywright == 0) and
   .controller.afterPlaywright == ($controlAfterPlaywright == 0) and
   .sourceHashBeforeRun == $sourceHashBeforeRun and
   .sourceHashAfterRun == $sourceHashAfterRun and
   .preBuildNextRemoved == ($preBuildNextRemoved == 1) and
   .sourceHashUnchanged == ($sourceHashUnchanged == 1) and
   .sourceHashUnchanged == true and
   .sourceHashError == null and
   .controller.afterPlaywright == true and
   ((.finalReportPath // "") == $finalReportPath)' "$FINAL_VALIDATION_PATH" >/dev/null; then
  FINAL_VALIDATION_VALID=0
fi
if [[ "$REPORT_COUNT" -ne 1 ]]; then
  REPORT_VALID=1
else
  if jq -e '
    .status == "PASS" and
    .valid == true and
    .readiness == true and
    (.registeredIds | sort) == [
      "apf-knockout-9101",
      "apf-preliminary-9101",
      "bpf-knockout-9102",
      "bpf-preliminary-9102",
      "invalid-ballots-9101",
      "invalid-tie-ballot-9103",
      "ld-generated-rounds-9103",
      "ld-generated-rounds-9105",
      "legacy-repair-9105",
      "mixed-and-no-ld-contract",
      "partial-row-nonrepairable-9105",
      "privacy-and-authorization-9102",
      "progression-gating-9101"
    ] and
    (.executedIds | sort) == (.registeredIds | sort) and
    (.cases | length) == 13 and
    all(.cases[]; .status == "PASS") and
    ((.cases | map(.name) | sort) == [
      "apf-knockout-9101",
      "apf-preliminary-9101",
      "bpf-knockout-9102",
      "bpf-preliminary-9102",
      "invalid-ballots-9101",
      "invalid-tie-ballot-9103",
      "ld-generated-rounds-9103",
      "ld-generated-rounds-9105",
      "legacy-repair-9105",
      "mixed-and-no-ld-contract",
      "partial-row-nonrepairable-9105",
      "privacy-and-authorization-9102",
      "progression-gating-9101"
    ]) and
    all(.cases[]; (.resetArtifacts | length) > 0 and (.mutationEvidence | length) > 0) and
    .contextCloseCancellationSelfCheckReport.passed == true and
    .contextCloseCancellationBijectionValidation.valid == true and
    (.contextCloseCancellationBijectionValidation.errors | length) == 0 and
    (.contextCloseCancellations | type) == "array" and
    ((.contextCloseCancellations | map(.correlationId) | unique | length) == (.contextCloseCancellations | length)) and
    (.validation.unpersistedContextCloseCancellationIds | length) == 0 and
    (.validation.nextLinkPrefetchClassifierValidation | type) == "object" and
    .validation.nextLinkPrefetchClassifierValidation.selfCheckReport.passed == true and
    (.validation.nextLinkPrefetchClassifierValidation.selfCheckReport.conditions | length) >= 18 and
    .validation.nextLinkPrefetchClassifierValidation.uniqueCorrelationIds == true and
    .validation.nextLinkPrefetchClassifierValidation.exactClassifiedEvidence == true and
    (.validation.nextLinkPrefetchClassifierValidation.expectedAbortCount | type) == "number" and
    .validation.nextLinkPrefetchClassifierValidation.expectedAbortCount >= 0 and
    (.validation.nextLinkPrefetchClassifierValidation.missingDurableSessionIds | length) == 0 and
    all(.validation.nextLinkPrefetchClassifierValidation.sessionCoverage[];
      .durableRuntimeEvidence == true and
      .durablePrefetchEvidence == true and
      (.expectedAbortCount | type) == "number" and
      .expectedAbortCount >= 0
    ) and
    (.validation.runtimeEvidenceValidation | type) == "object" and
    .validation.runtimeEvidenceValidation.valid == true and
    .validation.runtimeEvidenceValidation.allSessionRuntimeRecordsReasserted == true and
    (.validation.runtimeEvidenceValidation.trackedSessionIds | length) > 0 and
    (.validation.runtimeEvidenceValidation.missingDurableSessionIds | length) == 0 and
    (.validation.runtimeEvidenceValidation.missingDurablePrefetchEvidenceSessionIds | length) == 0 and
    (.validation.runtimeEvidenceValidation.runtimeLifecycleFailures | length) == 0 and
    (.validation.runtimeEvidenceValidation.runtimeAssertionFailures | length) == 0 and
    (.validation.runtimeEvidenceValidation.sessionCloseFailures | length) == 0 and
    (.validation.runtimeEvidenceValidation.duplicateRequestCorrelationIds | length) == 0 and
    .validation.runtimeEvidenceValidation.contextCloseCancellationSelfCheckReport.passed == true and
    .validation.runtimeEvidenceValidation.contextCloseCancellationBijectionValidation.valid == true and
    (.validation.runtimeEvidenceValidation.contextCloseCancellationBijectionValidation.errors | length) == 0 and
    (.validation.runtimeEvidenceValidation.duplicateContextCloseCancellationCorrelationIds | length) == 0 and
    (.validation.runtimeEvidenceValidation.contextCloseCancellationCount | type) == "number" and
    .validation.runtimeEvidenceValidation.contextCloseCancellationCount == (.contextCloseCancellations | length) and
    (.validation.runtimePersistenceValidation.missingCloseCancellationFileNames | length) == 0 and
    (.validation.runtimePersistenceValidation.missingCloseCancellationSessionIds | length) == 0 and
    (.validation.runtimePersistenceValidation.actualCloseCancellationSessionIds | sort) == (.validation.runtimeEvidenceValidation.trackedSessionIds | sort) and
    (.validation.runtimeEvidenceValidation.unsettledRequestCorrelationIds | length) == 0 and
    (.validation.runtimeEvidenceValidation.unexpectedRequestCorrelationIds | length) == 0 and
    (.validation.runtimeEvidenceValidation.missingRequestCorrelationIds | length) == 0 and
    (.validation.runtimeEvidenceValidation.invalidRequestTerminalStateCorrelationIds | length) == 0 and
    (.runtimeSessions | length) == (.validation.runtimeEvidenceValidation.trackedSessionIds | length) and
    all(.runtimeSessions[];
      (.sessionId | type) == "string" and
      (.runtime.requestEvidence | type) == "array" and
      (.runtime.expectedNextLinkPrefetchAborts | type) == "array" and
      (.runtime.contextCloseCancellations | type) == "array" and
      ((.runtime.requestEvidence | map(.correlationId) | unique | length) == (.runtime.requestEvidence | length)) and
      ((.runtime.expectedNextLinkPrefetchAborts | map(.correlationId) | unique | length) == (.runtime.expectedNextLinkPrefetchAborts | length)) and
      ((.runtime.contextCloseCancellations | map(.correlationId) | unique | length) == (.runtime.contextCloseCancellations | length)) and
      (.runtime.phase == "closed") and
      (.runtime.closeBoundarySequence | type) == "number" and
      all(.runtime.contextCloseCancellations[];
        .classification == "context-close-cancelled" and
        .phase == "closing" and
        (.sequence | type) == "number" and
        (.closeBoundarySequence | type) == "number" and
        .sequence > .closeBoundarySequence and
        .method == "GET" and
        .isLocalRequest == true and
        .isNavigationRequest == false and
        .responseObserved == false and
        .responseStatus == null and
        .failure == null and
        .voidMutationCorrelationId == null and
        .voidMutationOwner == null and
        ((.resourceType == "script" and (.path | test("^/_next/static/chunks/.+\\.js$"))) or
         (.resourceType == "fetch" and
          (.path | test("^/api(?:/|$)") | not) and
          (.path | test("^/auth(?:/|$)") | not) and
          (.path | startswith("/_next/") | not) and
          .query.rscPresent == true and
          .headers.rsc == "1" and
          .headers.nextRouterPrefetch == "1" and
          (.headers.nextRouterSegmentPrefetch != null)))
      ) and
      all(.runtime.expectedNextLinkPrefetchAborts[];
        .classification == "expected-next-link-prefetch-abort" and
        .failure == "net::ERR_ABORTED" and
        .method == "GET" and
        .path == "/auth" and
        (.query.mode == "login" or .query.mode == "register") and
        .query.rscPresent == true and
        .resourceType == "fetch" and
        .isNavigationRequest == false and
        .headers.rsc == "1" and
        .headers.nextRouterPrefetch == "1" and
        (.headers.nextRouterSegmentPrefetch != null) and
        .responseObserved == false and
        .responseStatus == null and
        (.expectedTournamentPathAtRequest | type) == "string" and
        (.expectedTournamentPathAtRequest | test("^/tournament/[0-9]+$")) and
        .expectedTournamentPathAtFailure == .expectedTournamentPathAtRequest and
        .pagePathAtRequest == .expectedTournamentPathAtRequest and
        .pagePathAtFailure == .expectedTournamentPathAtRequest and
        .mainFrameAuthNavigationObserved == false
      ) and
      all(.runtime.requestEvidence[];
        .classification != "expected-next-link-prefetch-abort" or
        (.failure == "net::ERR_ABORTED" and
         .method == "GET" and
         .path == "/auth" and
         (.query.mode == "login" or .query.mode == "register") and
         .query.rscPresent == true and
         .resourceType == "fetch" and
         .isNavigationRequest == false and
         .headers.rsc == "1" and
         .headers.nextRouterPrefetch == "1" and
         (.headers.nextRouterSegmentPrefetch != null) and
         .responseObserved == false and
         .responseStatus == null and
         (.expectedTournamentPathAtRequest | type) == "string" and
         (.expectedTournamentPathAtRequest | test("^/tournament/[0-9]+$")) and
         .expectedTournamentPathAtFailure == .expectedTournamentPathAtRequest and
         .pagePathAtRequest == .expectedTournamentPathAtRequest and
         .pagePathAtFailure == .expectedTournamentPathAtRequest and
         .mainFrameAuthNavigationObserved == false)
      )
    )
  ' "$REPORT_PATH" >/dev/null; then
    REPORT_VALID=0
  fi
fi

if [[ "$REPORT_COUNT" -eq 1 ]]; then
  if jq -e \
    --arg buildId "$BUILD_ID" \
    --arg sourceHashBeforeRun "$SOURCE_HASH_BEFORE_RUN" \
    --arg sourceHashAfterRun "$SOURCE_HASH_AFTER_RUN" \
    --arg packageLockHash "$PACKAGE_LOCK_HASH" \
    --arg envIsolationEvidencePath "${ENV_PROOF_PATH#"$ROOT/"}" \
    --arg controlInstanceIdHash "$CONTROL_INSTANCE_ID_HASH" \
    '.releaseBuildEvidence.mode == "release-matrix" and
     .releaseBuildEvidence.buildId == $buildId and
     .releaseBuildEvidence.buildExit == 0 and
     .releaseBuildEvidence.envIsolationEvidencePath == $envIsolationEvidencePath and
     .releaseBuildEvidence.controlInstanceIdHash == $controlInstanceIdHash and
     .releaseBuildEvidence.packageLockHash == $packageLockHash and
     .releaseBuildEvidence.sourceHashBeforeRun == $sourceHashBeforeRun and
     .releaseValidation.mode == "release-matrix" and
     .releaseValidation.sourceHashBeforeRun == $sourceHashBeforeRun and
     .releaseValidation.sourceHashAfterRun == $sourceHashAfterRun and
     .releaseValidation.sourceHashUnchanged == true and
     .releaseValidation.sourceHashError == null and
     .readyReport.instanceIdHash == $controlInstanceIdHash and
     .readyReport.instanceToken == "[REDACTED]" and
     .validation.releaseValidation.sourceHashUnchanged == true and
     .validation.releaseValidation.sourceHashError == null' "$REPORT_PATH" >/dev/null; then
    :
  else
    REPORT_VALID=1
  fi
fi

printf 'Release build evidence: %s (exit %s, BUILD_ID %s)\n' "$BUILD_EVIDENCE_PATH" "$BUILD_EXIT" "$BUILD_ID"
printf 'Playwright exit: %s\n' "$PLAYWRIGHT_STATUS"
printf 'Final validation: %s (source unchanged=%s)\n' "$FINAL_VALIDATION_PATH" "$([[ "$SOURCE_HASH_UNCHANGED" -eq 1 ]] && printf true || printf false)"
if [[ "$REPORT_COUNT" -eq 1 ]]; then
  printf 'Final report: %s\n' "$REPORT_PATH"
fi

if [[ "$PLAYWRIGHT_STATUS" -ne 0 || "$BUILD_EVIDENCE_VALID" -ne 0 || "$FINAL_VALIDATION_VALID" -ne 0 || "$REPORT_VALID" -ne 0 ]]; then
  exit 1
fi
