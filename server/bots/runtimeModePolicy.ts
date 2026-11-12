/** @fileoverview Проверка и разрешение сохранённого режима обработчика бота. */
import { runtimeEnv } from '../services/runtime-overlay';

/** Допустимые способы исполнения обработчика. */
export type RuntimeMode = 'direct' | 'ondemand' | 'process';

/** Ошибка пользовательской настройки режима. */
export class RuntimeModeValidationError extends Error {
  /** Код ответа API для неверной настройки. */
  readonly status = 400;
}

/** Проверяет значение без неявного исправления неизвестных режимов. */
export function parseRuntimeMode(value: unknown): RuntimeMode {
  if (value !== 'direct' && value !== 'ondemand' && value !== 'process') {
    throw new RuntimeModeValidationError('Выберите постоянную работу, сон или отдельный процесс');
  }
  return value;
}

/** Отклоняет сон обработчика при получении обновлений через вебхук. */
export function validateRuntimeMode(mode: RuntimeMode, launchMode: string): void {
  if (launchMode === 'webhook' && mode !== 'direct') {
    throw new RuntimeModeValidationError('Режимы со сном доступны только при получении сообщений через polling');
  }
}

/** Возвращает настройку бота с приоритетом над общим окружением сервера. */
export function resolveRuntimeModeSettings(
  variables: ReadonlyArray<{ key: string; value: string }>,
  launchMode: string | null | undefined,
  env: NodeJS.ProcessEnv = process.env,
  tokenId?: number,
) {
  /** Последняя индивидуальная настройка имеет приоритет без зависимости от ES2022. */
  const ownModes = variables.filter((item) => item.key === 'BOT_POLLING_MODE');
  const own = ownModes[ownModes.length - 1];
  const server = runtimeEnv('BOT_POLLING_MODE', env);
  const selected = runtimeEnv('BOT_ON_DEMAND_TOKEN_IDS', env)?.split(',').map((id) => id.trim()).filter(Boolean) ?? [];
  const excluded = !own && tokenId !== undefined && selected.length > 0 && !selected.includes(String(tokenId));
  const configuredMode = parseRuntimeMode(own ? own.value : server || 'direct');
  return {
    mode: excluded ? 'direct' as const : configuredMode,
    source: own ? 'bot' as const : server ? 'server' as const : 'default' as const,
    launchMode: launchMode === 'webhook' ? 'webhook' as const : 'polling' as const,
    requiresRestart: true as const,
  };
}
