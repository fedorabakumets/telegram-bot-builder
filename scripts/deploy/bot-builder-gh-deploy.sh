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
  curl -fsS --max-time 30 http://127.0.0.1:5000/api/health
  echo
  echo "======== $(date -Is) deploy ok ========"
} 2>&1 | tee -a "$LOG"