/**
 * @fileoverview Утилиты парсинга и сериализации .env формата для raw-редактора
 * @module components/editor/bot/card/env-raw-parser
 */

/** Маска для секретных значений */
export const SECRET_MASK = '••••••••';

/** Список системных ключей */
export const SYSTEM_KEYS = new Set([
  'BOT_TOKEN', 'ADMIN_IDS', 'LOG_LEVEL', 'PROTECT_CONTENT',
  'SAVE_INCOMING_MEDIA', 'API_BASE_URL', 'API_PORT', 'API_USE_SSL',
  'API_TIMEOUT', 'DISABLE_ASYNC_LOG', 'REDIS_URL',
  'DATABASE_URL', 'MAX_UPDATE_AGE_SECONDS', 'WEBHOOK_PORT',
]);

/** Ключи только для чтения (игнорируются при сохранении) */
export const IGNORED_KEYS = new Set(['PROJECT_ID', 'TOKEN_ID']);

/** Распарсенная строка .env */
export interface ParsedEnvLine {
  /** Имя переменной */
  key: string;
  /** Значение переменной */
  value: string;
}

/**
 * Парсит текст в формате .env в массив пар key-value
 * Игнорирует пустые строки и комментарии (#)
 * @param text - Текст из textarea
 * @returns Массив распарсенных строк
 */
export function parseEnvText(text: string): ParsedEnvLine[] {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'))
    .map(line => {
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) return { key: line, value: '' };
      return { key: line.slice(0, eqIndex).trim(), value: line.slice(eqIndex + 1).trim() };
    })
    .filter(item => item.key.length > 0);
}

/** Элемент системной переменной для сериализации */
interface SystemVarInput {
  /** Имя переменной */
  key: string;
  /** Значение */
  value: string;
  /** Флаг секретности */
  isSecret: boolean;
}

/** Элемент кастомной переменной для сериализации */
interface CustomVarInput {
  /** Имя переменной */
  key: string;
  /** Значение */
  value: string;
  /** Флаг секретности */
  isSecret: number | null;
}

/**
 * Сериализует переменные в текст формата .env
 * @param systemVars - Системные переменные
 * @param customItems - Кастомные переменные
 * @returns Текст для textarea
 */
export function serializeEnvVars(
  systemVars: SystemVarInput[],
  customItems: CustomVarInput[],
): string {
  const lines: string[] = [];

  lines.push('# Системные переменные');
  for (const v of systemVars) {
    lines.push(`${v.key}=${v.value}`);
  }

  if (customItems.length > 0) {
    lines.push('');
    lines.push('# Пользовательские переменные');
    for (const v of customItems) {
      const val = v.isSecret ? SECRET_MASK : v.value;
      lines.push(`${v.key}=${val}`);
    }
  }

  return lines.join('\n');
}
