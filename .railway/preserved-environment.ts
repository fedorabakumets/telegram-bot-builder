/** @fileoverview Сохраняет существующие значения Railway без выгрузки секретов в репозиторий. */
import { preserve } from "railway/iac";

/** Фиксирует имена существующих переменных, сохраняя их значения на стороне Railway. */
export const backendEnvironment = {
  API_BASE_URL: preserve(),
  ADMIN_API_KEY: preserve(),
  AGENT_AUTO_AUTH_ALLOWED_IDS: preserve(),
  AGENT_AUTO_AUTH_ENABLED: preserve(),
  AGENT_AUTO_AUTH_ID: preserve(),
  AGENT_AUTO_AUTH_SECRET: preserve(),
  APP_MODE: preserve(),
  BOTCRAFT_MCP_PROFILE: preserve(),
  BOT_ENV_SOURCE: preserve(),
  BOT_RUNTIME_MODE: preserve(),
  DATABASE_URL: preserve(),
  HOST: preserve(),
  MEDIA_RUNTIME_BASE_URL: preserve(),
  MEDIA_RUNTIME_SECRET: preserve(),
  NODE_ENV: preserve(),
  PORT: preserve(),
  REDIS_URL: preserve(),
  S3_ACCESS_KEY_ID: preserve(),
  S3_BUCKET: preserve(),
  S3_ENDPOINT_URL: preserve(),
  S3_FORCE_PATH_STYLE: preserve(),
  S3_REGION: preserve(),
  S3_SECRET_ACCESS_KEY: preserve(),
  SESSION_SECRET: preserve(),
  STORAGE_ENCRYPTION_KEY: preserve(),
  WORKER_RUNTIME: preserve(),
};

/** Фиксирует имена существующих переменных, сохраняя их значения на стороне Railway. */
export const runtimeEnvironment = {
  BOT_BUILDS_BUCKET_REF: preserve(),
  DATABASE_URL: preserve(),
  NODE_ENV: preserve(),
  REDIS_URL: preserve(),
  RUNNER_BROADCASTS_ENABLED: preserve(),
  RUNNER_ID: preserve(),
  RUNNER_REQUIRE_FENCE: preserve(),
  /** Общий секрет приватной доставки webhook; создаётся в Railway до применения плана. */
  RUNNER_WEBHOOK_SECRET: preserve(),
};

/** Фиксирует имена существующих переменных, сохраняя их значения на стороне Railway. */
export const frontendEnvironment = {
  BACKEND_URL: preserve(),
  NODE_ENV: preserve(),
  PORT: preserve(),
};
