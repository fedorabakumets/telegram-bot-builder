/**
 * @fileoverview Флаг встроенного подключения узла psql_query к БД платформы
 * @module server/utils/isPsqlBuiltinEnabled
 */

import { runtimeFlag } from "../services/runtime-overlay";

/**
 * Разрешено ли узлу psql_query в режиме `builtin` ходить в БД платформы (DATABASE_URL панели).
 * По умолчанию выключено: в многопользовательской установке это даёт любому боту
 * доступ к чужим токенам, сессиям и данным. Включается только администратором
 * сервера через PSQL_BUILTIN_ENABLED=true (например, для однопользовательской установки).
 * @param env - Окружение сервера
 * @returns true, если PSQL_BUILTIN_ENABLED равен true/1/yes
 */
export function isPsqlBuiltinEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return runtimeFlag("PSQL_BUILTIN_ENABLED", env);
}
