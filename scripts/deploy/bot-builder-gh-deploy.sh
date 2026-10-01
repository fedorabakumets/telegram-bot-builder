#!/bin/bash
# Deploy: image built in GitHub Actions (GHCR). This script only git sync + pull + up.
# Invoked by restricted Actions SSH key (command= in authorized_keys).
set -euo pipefail

APP_DIR=/opt/telegram-bot-builder
LOCK=/var/lock/bot-builder-deploy.lock
LOG=/var/log/bot-builder-deploy.log
IMAGE="${BOT_BUILDER_IMAGE:-ghcr.io/fedorabakumets/telegram-bot-builder:latest}"

exec 9>"$LOCK"
flock 9

{
  echo "======== $(date -Is) deploy start ========"
  cd "$APP_DIR"

  git fetch --prune origin main
  BEFORE=$(git rev-parse HEAD)
  git reset --hard origin/main
  AFTER=$(git rev-parse HEAD)

  if [ "$BEFORE" = "$AFTER" ]; then
    echo "Already at $AFTER"
  else
    echo "Updated $BEFORE -> $AFTER"
  fi

  if [ -f scripts/deploy/bot-builder-gh-deploy.sh ]; then
    install -m 700 scripts/deploy/bot-builder-gh-deploy.sh /usr/local/sbin/bot-builder-gh-deploy.sh
    echo "Synced deploy script from repo"
  fi

  echo "Pulling $IMAGE (no build on VPS)"
  docker compose pull app
  docker compose up -d --no-build --remove-orphans
  docker compose ps

  # Порт слушается только после миграций и регистрации маршрутов (>30 с),
  # поэтому ждём /api/health до ~2 минут
  HEALTH_TRIES="${HEALTH_TRIES:-40}"
  ok=0
  for i in $(seq 1 "$HEALTH_TRIES"); do
    if curl -fsS --max-time 10 http://127.0.0.1:5000/api/health; then
      echo
      echo "health ok after try $i/$HEALTH_TRIES"
      ok=1
      break
    fi
    echo "health not ready yet (try $i/$HEALTH_TRIES), sleep 3s"
    sleep 3
  done
  if [ "$ok" != 1 ]; then
    echo "ERROR: /api/health failed after retries" >&2
    docker compose logs --tail=80 app >&2 || true
    exit 1
  fi

  docker image prune -f >/dev/null || true
  echo "======== $(date -Is) deploy ok ========"
} 2>&1 | tee -a "$LOG"