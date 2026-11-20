/** @fileoverview Подготовка индивидуальных изменений автоперезапуска бота. */
import type { RuntimeModeChange } from './runtimeModeBatch';
import { RuntimeModeValidationError } from './runtimeModePolicy';

/** Изменения источника и значения автоперезапуска. */
export interface BotAutoRestartPatch {
  /** Индивидуальное включение автоперезапуска. */
  autoRestart?: 0 | 1;
  /** Индивидуальное число попыток. */
  maxRestartAttempts?: number;
  /** Использовать общий флаг проекта. */
  inheritAutoRestart?: boolean;
  /** Использовать общий лимит проекта. */
  inheritMaxRestartAttempts?: boolean;
}

/** Преобразует явно указанные значения в независимые настройки токена. */
export function buildBotAutoRestartPatch(
  autoRestart: 0 | 1 | 'inherit' | undefined,
  maxRestartAttempts: number | 'inherit' | undefined,
): BotAutoRestartPatch {
  return {
    ...(autoRestart === undefined ? {} : { inheritAutoRestart: autoRestart === 'inherit' }),
    ...(autoRestart === 0 || autoRestart === 1 ? { autoRestart } : {}),
    ...(maxRestartAttempts === undefined ? {} : { inheritMaxRestartAttempts: maxRestartAttempts === 'inherit' }),
    ...(typeof maxRestartAttempts === 'number' ? { maxRestartAttempts } : {}),
  };
}

/** Читает системные изменения из пакета без неявного преобразования неверных значений. */
export function parseBotAutoRestartBatch(changes: RuntimeModeChange[]): BotAutoRestartPatch {
  let autoRestart: 0 | 1 | 'inherit' | undefined;
  let attempts: number | 'inherit' | undefined;
  for (const { key, action, value } of changes) {
    if (action !== 'update') continue;
    if (key === 'AUTO_RESTART') {
      if (value === 'inherit') autoRestart = value;
      else if (value === '1' || value === 'true') autoRestart = 1;
      else if (value === '0' || value === 'false') autoRestart = 0;
      else throw new RuntimeModeValidationError('Выберите значение автоперезапуска');
    }
    if (key === 'MAX_RESTART_ATTEMPTS') {
      if (value === 'inherit') attempts = value;
      else if (typeof value === 'string' && /^(?:[1-9]|10)$/.test(value)) attempts = Number(value);
      else throw new RuntimeModeValidationError('Число попыток автоперезапуска должно быть от 1 до 10');
    }
  }
  return buildBotAutoRestartPatch(autoRestart, attempts);
}
