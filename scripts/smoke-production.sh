#!/usr/bin/env bash
# Smoke-check a deployed Shakti instance.
# Usage:
#   APP_URL=https://your-domain.com bash scripts/smoke-production.sh
#   APP_URL=http://127.0.0.1:3000 bash scripts/smoke-production.sh
#
# Optional:
#   ADMIN_EMAIL=admin@shakti.com ADMIN_PASSWORD='...' bash scripts/smoke-production.sh

set -euo pipefail

APP_URL="${APP_URL:-http://127.0.0.1:3000}"
APP_URL="${APP_URL%/}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@shakti.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"

pass=0
fail=0

check() {
  local name="$1"
  local ok="$2"
  if [[ "$ok" == "1" ]]; then
    echo "PASS  $name"
    pass=$((pass + 1))
  else
    echo "FAIL  $name"
    fail=$((fail + 1))
  fi
}

echo "Smoking ${APP_URL}"

HEALTH_JSON="$(curl -fsS "${APP_URL}/api/health" || echo '')"
if echo "$HEALTH_JSON" | grep -q '"ok":true'; then
  check "GET /api/health ok=true" 1
else
  check "GET /api/health ok=true" 0
fi

if echo "$HEALTH_JSON" | grep -q '"phase":10'; then
  check "health phase=10" 1
else
  check "health phase=10" 0
fi

if echo "$HEALTH_JSON" | grep -q '"dbProvider":"postgresql"'; then
  check "health dbProvider=postgresql" 1
elif echo "$HEALTH_JSON" | grep -q '"database":"ok"'; then
  check "health database=ok (provider not postgresql — review DATABASE_URL)" 0
else
  check "health dbProvider" 0
fi

UNAUTH_CODE="$(curl -s -o /dev/null -w '%{http_code}' "${APP_URL}/api/dashboard/summary" || echo 000)"
if [[ "$UNAUTH_CODE" == "401" ]]; then
  check "unauth /api/dashboard/summary -> 401" 1
else
  check "unauth /api/dashboard/summary -> 401 (got ${UNAUTH_CODE})" 0
fi

if [[ -n "$ADMIN_PASSWORD" ]]; then
  LOGIN_JSON="$(curl -fsS -X POST "${APP_URL}/api/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" || echo '')"
  TOKEN="$(echo "$LOGIN_JSON" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')"
  if [[ -z "$TOKEN" ]]; then
    TOKEN="$(echo "$LOGIN_JSON" | sed -n 's/.*"token": "\([^"]*\)".*/\1/p')"
  fi
  if [[ -n "$TOKEN" ]]; then
    check "POST /api/auth/login" 1
    ME_CODE="$(curl -s -o /dev/null -w '%{http_code}' -H "Authorization: Bearer ${TOKEN}" "${APP_URL}/api/auth/me" || echo 000)"
    if [[ "$ME_CODE" == "200" ]]; then
      check "GET /api/auth/me" 1
    else
      check "GET /api/auth/me (got ${ME_CODE})" 0
    fi
  else
    check "POST /api/auth/login" 0
  fi
else
  echo "SKIP  login (set ADMIN_PASSWORD to exercise auth)"
fi

echo ""
echo "Result: ${pass} passed, ${fail} failed"
[[ "$fail" -eq 0 ]]
