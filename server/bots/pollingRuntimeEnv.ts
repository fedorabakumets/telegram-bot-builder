/** @fileoverview Разрешённые настройки приёма обновлений без наследования секретов панели. */
import { runtimeEnv } from "../services/runtime-overlay";
import { resolveProjectSleepMode } from "../../shared/bot-execution-settings";

/** Значение обработчика для наследующего бота. */
export interface ProjectPollingRuntimeScope {
  /** Общий режим или системный режим при null. */
  defaultMode?: string | null;
  /** Нужно ли использовать общий режим. */
  inherited?: boolean | null;
}

/** Имена настроек общего polling-приёмника и пробуждения ботов. */
export const POLLING_RUNTIME_ENV: readonly string[] = [
  "BOT_POLLING_MODE", "BOT_ON_DEMAND_TOKEN_IDS",
  "BOT_ON_DEMAND_IDLE_SECONDS", "BOT_ON_DEMAND_MAX_ACTIVE",
];

/**
 * Дополняет окружение бота настройками площадки, сохраняя явные значения бота.
 * @param variables - Явные переменные конкретного бота.
 * @param env - Окружение процесса панели.
 * @param scope - Настройка наследования режима обработчика.
 * @returns Копия списка с разрешёнными настройками без секретов и подключений.
 */
export function withPollingRuntimeEnv<T extends { key: string; value: string }>(
  variables: T[], env: NodeJS.ProcessEnv = process.env, scope?: ProjectPollingRuntimeScope,
): Array<T | { key: string; value: string }> {
  const inherited = resolveProjectSleepMode(scope?.defaultMode, scope?.inherited);
  const result: Array<T | { key: string; value: string }> = scope?.inherited === true
    ? variables.filter(variable => !["BOT_POLLING_MODE", "BOT_ON_DEMAND_TOKEN_IDS"].includes(variable.key))
    : [...variables];
  if (inherited) result.push({ key: "BOT_POLLING_MODE", value: inherited });
  /** Явный режим проекта или токена действует независимо от общего списка пробных ботов. */
  if (result.some((variable) => variable.key === "BOT_POLLING_MODE")
    && !result.some((variable) => variable.key === "BOT_ON_DEMAND_TOKEN_IDS")) {
    result.push({ key: "BOT_ON_DEMAND_TOKEN_IDS", value: "" });
  }
  for (const key of POLLING_RUNTIME_ENV) {
    const value = runtimeEnv(key, env);
    if (value && !result.some((variable) => variable.key === key)) result.push({ key, value });
  }
  return result;
}
