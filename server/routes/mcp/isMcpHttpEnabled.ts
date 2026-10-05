/**
 * @fileoverview Проверка, включён ли remote HTTP MCP
 * @module server/routes/mcp/isMcpHttpEnabled
 */

import { runtimeEnv } from "../../services/runtime-overlay";

/**
 * Включён ли эндпоинт /mcp (env MCP_HTTP_ENABLED).
 * По умолчанию true; явный false/0/off выключает.
 * @returns true если remote MCP доступен
 */
export function isMcpHttpEnabled(): boolean {
  const raw = runtimeEnv("MCP_HTTP_ENABLED");
  if (raw === undefined) return true;
  const v = raw.toLowerCase();
  return v !== "false" && v !== "0" && v !== "off" && v !== "no";
}
