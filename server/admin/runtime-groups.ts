/**
 * @fileoverview Разделы админки, которые заменяют длинный .env
 * @module server/admin/runtime-groups
 */

import type { RuntimeField, RuntimeGroup } from "./runtime-field";
import { docsForRuntimeGroup } from "./runtime-guides";
import { placeholderFor } from "./runtime-placeholders";

/** Хранилища файлов */
const storages: RuntimeField[] = [
  { env: "STORAGE_BACKEND", label: "Активный тип", kind: "text", hint: "local или s3" },
  { env: "STORAGE_LIMIT_GB", label: "Лимит, ГБ", kind: "number", hint: "Пусто — без лимита" },
  { env: "S3_ENDPOINT_URL", label: "S3 endpoint", kind: "text" },
  { env: "S3_REGION", label: "Регион", kind: "text" },
  { env: "S3_BUCKET", label: "Бакет", kind: "text" },
  { env: "S3_ACCESS_KEY_ID", label: "Ключ доступа", kind: "secret" },
  { env: "S3_SECRET_ACCESS_KEY", label: "Секретный ключ", kind: "secret" },
  { env: "S3_FORCE_PATH_STYLE", label: "Path-style", kind: "bool" },
  { env: "S3_PUBLIC_URL_BASE", label: "Публичный адрес", kind: "text", hint: "CDN. Для бэкапов такое хранилище закрыто" },
  { env: "UPLOADS_STORAGE_ID", label: "Хранилище загрузок", kind: "text" },
];

/** Бэкапы базы */
const backups: RuntimeField[] = [
  { env: "DB_BACKUPS_STORAGE_ID", label: "Куда писать", kind: "storage", hint: "Пусто — папка .db-backups" },
  { env: "DB_BACKUPS_DIR", label: "Папка на диске", kind: "text" },
  { env: "DB_BACKUP_INTERVAL_HOURS", label: "Интервал, часы", kind: "number", hint: "0 — автобэкап выключен" },
  { env: "DB_BACKUPS_KEEP", label: "Сколько хранить", kind: "number" },
  { env: "DB_BACKUP_LABEL", label: "Метка базы панели", kind: "text" },
  { env: "DB_BACKUP_TARGETS", label: "Другие базы", kind: "secret", hint: "метка=адрес через пробел. Пустое поле секрет не стирает" },
  { env: "DB_BACKUP_TELEGRAM_ENABLED", label: "Отправлять в Telegram", kind: "bool", hint: "Дополнительная копия после сохранения в хранилище" },
  { env: "DB_BACKUP_TELEGRAM_BOT_TOKEN", label: "Токен бота Telegram", kind: "secret", hint: "Пустое поле сохраняет прежний токен" },
  { env: "DB_BACKUP_TELEGRAM_CHAT_ID", label: "Chat ID Telegram", kind: "text", hint: "Личный чат или закрытая группа. Файл до 50 МБ" },
];

/** Запуск ботов */
const workers: RuntimeField[] = [
  { env: "USE_WORKER_POOL", label: "Пул воркеров", kind: "bool", hint: "Выключенный false возвращает отдельные процессы" },
  { env: "WORKER_GROUPING", label: "Группировка", kind: "text", hint: "project, owner или shared" },
  { env: "WORKER_RUNTIME", label: "Среда", kind: "text", hint: "process, docker или remote" },
  { env: "WORKER_DOCKER_IMAGE", label: "Образ Docker", kind: "text" },
  { env: "WORKER_DOCKER_NETWORK", label: "Сеть Docker", kind: "text" },
  { env: "WORKER_DOCKER_ISOLATE", label: "Изоляция сети и uploads", kind: "bool" },
  { env: "WORKER_DOCKER_BRIDGE_NAME", label: "Имя сети площадки", kind: "text" },
  { env: "WORKER_DOCKER_UPLOADS_READONLY", label: "Uploads только чтение", kind: "bool" },
  { env: "WORKER_MEMORY_LIMIT", label: "Память", kind: "text" },
  { env: "WORKER_CPUS", label: "CPU", kind: "text" },
  { env: "WORKER_ENV_PASSTHROUGH", label: "Переменные для ботов", kind: "text" },
  { env: "WORKER_DOCKER_HOST_ROOT", label: "Корень на хосте", kind: "text" },
];

/** Исполнители и Railway */
const runners: RuntimeField[] = [
  { env: "WORKER_RUNNER_ID", label: "ID исполнителя", kind: "text" },
  { env: "WORKER_RUNNER_REDIS_URL", label: "Redis исполнителя", kind: "secret" },
  { env: "WORKER_RUNNER_REDIS_REQUIRED", label: "Запретить Redis панели", kind: "bool" },
  { env: "RUNNER_SITE_INFO_HIDE_URLS", label: "Не писать адреса в Redis", kind: "bool" },
  { env: "RAILWAY_TOKEN", label: "Токен Railway", kind: "secret" },
  { env: "RAILWAY_PROJECT_ID", label: "Проект Railway", kind: "text" },
  { env: "RAILWAY_ENVIRONMENT_ID", label: "Окружение Railway", kind: "text" },
  { env: "RAILWAY_RUNNER_IMAGE", label: "Образ раннера", kind: "text" },
  { env: "WORKER_RAILWAY_PROJECTS", label: "Проекты на Railway", kind: "text" },
];

/** Сборки ботов */
const builds: RuntimeField[] = [
  { env: "BOT_ARTIFACT_SOURCE", label: "Источник кода", kind: "text", hint: "disk или storage" },
  { env: "BOT_BUILDS_STORAGE_ID", label: "Хранилище сборок", kind: "storage" },
  { env: "BOT_BUILDS_DIR", label: "Папка сборок", kind: "text" },
  { env: "BOT_BUILDS_KEEP", label: "Сколько сборок хранить", kind: "number" },
];

/** Прочие настройки площадки */
const platform: RuntimeField[] = [
  { env: "TELEGRAM_PROXY_URL", label: "Прокси Telegram", kind: "text" },
  { env: "SUPPORT_BOT_TOKEN", label: "Токен бота поддержки", kind: "secret" },
  { env: "SUPPORT_ADMIN_CHAT_IDS", label: "Чаты администраторов", kind: "text" },
  { env: "MCP_HTTP_ENABLED", label: "HTTP MCP", kind: "bool" },
  { env: "MCP_AGENT_TOKEN", label: "Токен MCP", kind: "secret" },
  { env: "STUDIO_BOT_MANAGER_TOKEN", label: "Токен Bot Manager", kind: "secret" },
  { env: "BOT_MANAGER_ADMIN_IDS", label: "Админы Bot Manager", kind: "text" },
  { env: "PSQL_BUILTIN_ENABLED", label: "psql builtin к базе панели", kind: "bool" },
  { env: "PSQL_PANEL_DSN_DENIED", label: "Запрет DATABASE_URL в psql env", kind: "bool" },
  { env: "BOT_RUNTIME_ENABLED", label: "Роль bot_runtime", kind: "bool" },
  { env: "BOT_DATABASE_URL", label: "Адрес роли bot_runtime", kind: "secret" },
];

/**
 * Подмешивает пример placeholder и ссылки на документы раздела
 * @param group - Раздел без подсказок ввода
 * @returns Раздел для формы и API
 */
function withHints(group: RuntimeGroup): RuntimeGroup {
  return {
    ...group,
    docs: docsForRuntimeGroup(group.id),
    fields: group.fields.map((field) => {
      const placeholder = placeholderFor(field.env);
      return placeholder ? { ...field, placeholder } : field;
    }),
  };
}

/** Все разделы по порядку меню */
export const RUNTIME_GROUPS: RuntimeGroup[] = [
  withHints({ id: "storages", title: "Хранилища", description: "Куда панель пишет файлы. Ключи S3 шифруются и в форме не показываются.", fields: storages }),
  withHints({ id: "backups", title: "Бэкапы", description: "Куда и как часто снимать дамп базы. Публичный бакет выбрать нельзя.", fields: backups }),
  withHints({ id: "workers", title: "Воркеры", description: "Как запускать ботов. Пока поля пустые, действуют прежние переменные.", fields: workers }),
  withHints({ id: "runners", title: "Исполнители", description: "Связь с удалённым раннером и Railway.", fields: runners }),
  withHints({ id: "builds", title: "Сборки", description: "Где лежит собранный код бота для исполнителя.", fields: builds }),
  withHints({ id: "platform", title: "Площадка", description: "Поддержка, MCP и доступ ботов к базе. Секрет не меняется, если поле оставить пустым.", fields: platform }),
];

/**
 * Ищет раздел по id
 * @param id - Ключ раздела
 * @returns Раздел или undefined
 */
export function findRuntimeGroup(id: string): RuntimeGroup | undefined {
  return RUNTIME_GROUPS.find((group) => group.id === id);
}
