#!/usr/bin/env bash
# Запуск исполнителя Cursor (My Machines) на Railway.
# Переменные:
#   CURSOR_API_KEY   — личный API-ключ Cursor (обязательно)
#   GITHUB_TOKEN     — токен GitHub с правом записи в репозиторий (для git push и gh)
#   REPO_URL         — репозиторий (по умолчанию telegram-bot-builder)
#   CURSOR_WORKER_NAME — имя машины в Cursor (по умолчанию railway)
#   GIT_USER_NAME, GIT_USER_EMAIL — автор коммитов агента
set -euo pipefail

: "${CURSOR_API_KEY:?Задайте CURSOR_API_KEY — личный API-ключ Cursor}"
REPO_URL="${REPO_URL:-https://github.com/fedorabakumets/telegram-bot-builder.git}"
WORKSPACE="${WORKSPACE_DIR:-/data/workspace}"
NAME="${CURSOR_WORKER_NAME:-railway}"

git config --global user.name "${GIT_USER_NAME:-Cursor Agent}"
git config --global user.email "${GIT_USER_EMAIL:-cursoragent@cursor.com}"
git config --global init.defaultBranch main
if [ -n "${GITHUB_TOKEN:-}" ]; then
  # Токен только в файле учётных данных, а не в адресе remote: так он не попадёт в git config репозитория
  git config --global credential.helper "store --file=/root/.git-credentials"
  printf 'https://x-access-token:%s@github.com\n' "$GITHUB_TOKEN" > /root/.git-credentials
  chmod 600 /root/.git-credentials
  export GH_TOKEN="$GITHUB_TOKEN"
fi

if [ ! -d "$WORKSPACE/.git" ]; then
  echo "[cursor-worker] клонируем $REPO_URL в $WORKSPACE"
  mkdir -p "$(dirname "$WORKSPACE")"
  git clone "$REPO_URL" "$WORKSPACE"
else
  echo "[cursor-worker] рабочая копия есть, обновляем ссылки"
  git -C "$WORKSPACE" fetch --prune origin || echo "[cursor-worker] fetch не удался, продолжаем"
fi

if [ ! -d "$WORKSPACE/node_modules" ]; then
  echo "[cursor-worker] npm ci"
  (cd "$WORKSPACE" && npm ci --no-audit --no-fund) || echo "[cursor-worker] npm ci не удался, агент установит зависимости сам"
fi

# Без --idle-release-timeout 0 исполнитель завершается через час простоя с кодом 0
exec agent --api-key "$CURSOR_API_KEY" worker \
  --name "$NAME" \
  --worker-dir "$WORKSPACE" \
  --data-dir /data/cursor \
  --idle-release-timeout 0 \
  start
