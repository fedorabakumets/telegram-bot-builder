/**
 * @fileoverview Примеры значений полей рантайма. В input не подставляются
 * @module server/admin/runtime-placeholders
 */

/**
 * Короткие примеры как в env и в документации проекта.
 * Пустая строка секрета по-прежнему не стирает сохранённое значение.
 */
export const RUNTIME_PLACEHOLDERS: Record<string, string> = {
  STORAGE_BACKEND: "s3",
  STORAGE_LIMIT_GB: "10",
  S3_ENDPOINT_URL: "https://s3.amazonaws.com",
  S3_REGION: "us-east-1",
  S3_BUCKET: "tbb-uploads",
  S3_ACCESS_KEY_ID: "AKIA...",
  S3_SECRET_ACCESS_KEY: "wJalr...EXAMPLEKEY",
  S3_PUBLIC_URL_BASE: "https://cdn.example.com",
  UPLOADS_STORAGE_ID: "s3-uploads",
  DB_BACKUPS_DIR: ".db-backups",
  DB_BACKUP_INTERVAL_HOURS: "24",
  DB_BACKUPS_KEEP: "7",
  DB_BACKUP_LABEL: "panel",
  DB_BACKUP_TARGETS: "railway-tbb-bots=postgresql://user:pass@host:5432/db",
  DB_BACKUP_TELEGRAM_BOT_TOKEN: "123456:AA...",
  DB_BACKUP_TELEGRAM_CHAT_ID: "-1001234567890",
  WORKER_GROUPING: "owner",
  WORKER_RUNTIME: "docker",
  WORKER_DOCKER_IMAGE: "tbb-worker:local",
  WORKER_DOCKER_NETWORK: "telegram-bot-builder_default",
  WORKER_DOCKER_BRIDGE_NAME: "telegram-bot-builder_default",
  WORKER_MEMORY_LIMIT: "256m",
  WORKER_CPUS: "0.5",
  WORKER_ENV_PASSTHROUGH: "OPENAI_API_KEY,WEBHOOK_BASE_URL",
  WORKER_DOCKER_HOST_ROOT: "/opt/telegram-bot-builder",
  WORKER_RUNNER_ID: "runner-1",
  WORKER_RUNNER_REDIS_URL: "redis://default:pass@host:6379",
  RAILWAY_TOKEN: "...",
  RAILWAY_PROJECT_ID: "00000000-0000-0000-0000-000000000000",
  RAILWAY_ENVIRONMENT_ID: "00000000-0000-0000-0000-000000000000",
  RAILWAY_RUNNER_IMAGE: "ghcr.io/fedorabakumets/telegram-bot-builder-runner:latest",
  WORKER_RAILWAY_PROJECTS: "1,5",
  BOT_ARTIFACT_SOURCE: "storage",
  BOT_BUILDS_DIR: ".bot-builds",
  BOT_BUILDS_KEEP: "3",
  TELEGRAM_PROXY_URL: "http://127.0.0.1:8080",
  SUPPORT_BOT_TOKEN: "123456:AA...",
  SUPPORT_ADMIN_CHAT_IDS: "123456789",
  MCP_AGENT_TOKEN: "mcp_...",
  STUDIO_BOT_MANAGER_TOKEN: "mcp_...",
  BOT_MANAGER_ADMIN_IDS: "123456789",
  BOT_DATABASE_URL: "postgresql://bot_runtime:pass@host:5432/db",
};

/**
 * Пример для поля или undefined, если примера нет
 * @param env - Имя переменной
 * @returns Строка placeholder
 */
export function placeholderFor(env: string): string | undefined {
  return RUNTIME_PLACEHOLDERS[env];
}
