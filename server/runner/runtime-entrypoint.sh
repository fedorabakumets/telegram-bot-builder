# @fileoverview Подготавливает доступный UID исполнителя и том общего Telegram-брокера перед понижением привилегий.
set -eu

# Подключённый том Railway изначально принадлежит root; меняем только каталоги состояния.
if [ "$(id -u)" = "0" ]; then
  runtime_uid="${RUNTIME_UID:-10001}"
  case "$runtime_uid" in *[!0-9]*|'') echo 'Некорректный UID исполнителя' >&2; exit 1 ;; esac
  mkdir -p /app/cache /home/botcraft /var/lib/botcraft-telegram
  chown "$runtime_uid:$runtime_uid" /app /app/cache /home/botcraft
  chown -R "$runtime_uid:$runtime_uid" /var/lib/botcraft-telegram
  exec gosu "$runtime_uid:$runtime_uid" "$@"
fi

# При заранее заданном UID права тома подготавливает платформа или администратор.
exec "$@"
