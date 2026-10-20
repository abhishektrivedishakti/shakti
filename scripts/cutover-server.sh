#!/usr/bin/env bash
# Production cutover on EC2: backup/remove old Laravel /var/www/shakti,
# deploy this Express+Prisma app, write .env, build, seed, pm2, nginx hint.
#
# Required env before running:
#   export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/shakti?sslmode=require'
#   export APP_URL='https://your-domain.com'
#   export SEED_ADMIN_EMAIL='admin@yourdomain.com'
#   export SEED_ADMIN_PASSWORD='STRONG_PASSWORD_HERE'
#
# Optional:
#   export REPO_URL='https://github.com/abhishektrivedishakti/shakti.git'
#   export APP_DIR='/var/www/shakti'
#   export PORT=3000
#   export SKIP_NGINX=1   # only print nginx instructions
#
# Usage (as ubuntu with sudo):
#   chmod +x scripts/cutover-server.sh
#   ./scripts/cutover-server.sh

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/abhishektrivedishakti/shakti.git}"
APP_DIR="${APP_DIR:-/var/www/shakti}"
PORT="${PORT:-3000}"
WWW_PARENT="$(dirname "$APP_DIR")"
STAMP="$(date +%Y%m%d_%H%M%S)"

die() { echo "ERROR: $*" >&2; exit 1; }

[[ -n "${DATABASE_URL:-}" ]] || die "Set DATABASE_URL (Postgres connection string)."
[[ -n "${APP_URL:-}" ]] || die "Set APP_URL (public https URL)."
[[ -n "${SEED_ADMIN_EMAIL:-}" ]] || die "Set SEED_ADMIN_EMAIL."
[[ -n "${SEED_ADMIN_PASSWORD:-}" ]] || die "Set SEED_ADMIN_PASSWORD."
[[ "$(id -u)" -ne 0 ]] || die "Run as ubuntu (not root). Script uses sudo where needed."

command -v git >/dev/null || die "git is required"
command -v node >/dev/null || die "node is required"
command -v npm >/dev/null || die "npm is required"

echo "==> [1/8] Backup old Laravel tree (if present)"
if [[ -d "$APP_DIR" ]]; then
  # Detect Laravel vs already-new app
  if [[ -f "$APP_DIR/artisan" ]] || [[ -d "$APP_DIR/app/Http" ]]; then
    BACKUP_TGZ="$HOME/shakti-laravel-backup-${STAMP}.tar.gz"
    echo "    Archiving $APP_DIR -> $BACKUP_TGZ"
    sudo tar -czf "$BACKUP_TGZ" -C "$WWW_PARENT" "$(basename "$APP_DIR")"
    OLD_DIR="${APP_DIR}-laravel-old-${STAMP}"
    echo "    Moving to $OLD_DIR"
    sudo mv "$APP_DIR" "$OLD_DIR"
    if [[ -f "$OLD_DIR/.env" ]]; then
      cp "$OLD_DIR/.env" "$HOME/shakti-laravel.env.${STAMP}.bak" || true
      echo "    Copied old .env to $HOME/shakti-laravel.env.${STAMP}.bak"
    fi
  elif [[ -d "$APP_DIR/.git" ]]; then
    echo "    Existing git app at $APP_DIR — pulling latest instead of wipe"
    cd "$APP_DIR"
    git fetch origin
    git checkout main
    git pull --ff-only origin main
  else
    die "$APP_DIR exists but is not Laravel and not a git clone. Move it aside manually."
  fi
fi

echo "==> [2/8] Clone repo into $APP_DIR (if needed)"
if [[ ! -d "$APP_DIR/.git" ]]; then
  sudo mkdir -p "$WWW_PARENT"
  sudo git clone "$REPO_URL" "$APP_DIR"
  sudo chown -R "$(whoami):$(whoami)" "$APP_DIR"
fi
cd "$APP_DIR"
git checkout main
git pull --ff-only origin main || true

echo "==> [3/8] Write production .env"
JWT_SECRET_VALUE="$(openssl rand -base64 48 | tr -d '\n')"
cat > "$APP_DIR/.env" <<EOF
NODE_ENV=production
PORT=${PORT}
APP_URL=${APP_URL}

DATABASE_URL=${DATABASE_URL}

JWT_SECRET=${JWT_SECRET_VALUE}

MAX_UPLOAD_BYTES=20971520

SEED_ADMIN_NAME=${SEED_ADMIN_NAME:-Shakti Admin}
SEED_ADMIN_EMAIL=${SEED_ADMIN_EMAIL}
SEED_ADMIN_PASSWORD=${SEED_ADMIN_PASSWORD}
SEED_ADMIN_MOBILE=${SEED_ADMIN_MOBILE:-9999888877}
EOF
chmod 600 "$APP_DIR/.env"
echo "    Wrote $APP_DIR/.env (JWT_SECRET generated)"

echo "==> [4/8] npm ci + build"
npm ci
npm run build

echo "==> [5/8] Prisma db push + seed"
npx prisma generate
npx prisma db push
npm run db:seed

echo "==> [6/8] Ensure uploads dir"
mkdir -p "$APP_DIR/uploads"
chmod 755 "$APP_DIR/uploads"

echo "==> [7/8] pm2 process"
if ! command -v pm2 >/dev/null; then
  sudo npm i -g pm2
fi
pm2 delete shakti 2>/dev/null || true
pm2 start npm --name shakti -- start
pm2 save
# Print startup command for the user to run once (needs root)
echo "    Run once if not already configured: pm2 startup systemd -u $(whoami) --hp $HOME"

echo "==> [8/8] Health check"
sleep 2
HEALTH="$(curl -fsS "http://127.0.0.1:${PORT}/api/health" || true)"
echo "    $HEALTH"
echo "$HEALTH" | grep -q '"ok":true' || die "Health check failed. See: pm2 logs shakti"

echo ""
echo "Nginx: leave /var/www/shakti-travels-backend and *.sql backups untouched."
if [[ "${SKIP_NGINX:-0}" != "1" ]]; then
  echo "Update site config to proxy to 127.0.0.1:${PORT} (see deploy/nginx-shakti.conf.example),"
  echo "replace YOUR_DOMAIN, then: sudo nginx -t && sudo systemctl reload nginx"
fi
echo ""
echo "Done. Open ${APP_URL} and sign in as ${SEED_ADMIN_EMAIL}"
echo "Smoke: APP_URL=${APP_URL} bash scripts/smoke-production.sh"
