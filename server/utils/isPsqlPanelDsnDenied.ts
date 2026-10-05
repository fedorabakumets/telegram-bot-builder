/**
 * @fileoverview Флаг запрета узлу psql_query ходить в БД панели через DATABASE_URL
 * @module server/utils/isPsqlPanelDsnDenied
 */

import { runtimeFlag } from "../services/runtime-overlay";

/**
 * Запрещено ли узлу psql_query в режиме `env` подключаться по переменной DATABASE_URL.
 * По умолчанию выключено: пока флага нет, сгенерированный код и поведение узла прежние.
 * Включается администратором сервера через PSQL_PANEL_DSN_DENIED=true и действует
 * после пересборки бота. Свою переменную и режим custom не закрывает.
 * Роль bot_runtime этот флаг не заменяет.
 * @param env - Окружение сервера
 * @returns true, если PSQL_PANEL_DSN_DENIED равен true/1/yes
 */
export function isPsqlPanelDsnDenied(env: NodeJS.ProcessEnv = process.env): boolean {
  return runtimeFlag("PSQL_PANEL_DSN_DENIED", env);
}
