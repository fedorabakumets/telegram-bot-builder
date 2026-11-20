/** @fileoverview Выбор наследуемых настроек при создании записи бота. */
import { BOT_INHERITED_SETTING_KEYS } from './bot-inherited-settings';

/**
 * Исключает явно заданные значения из стандартного списка наследования.
 * @param input - Настройки нового бота.
 * @param explicitKeys - Явный список наследуемых ключей, если передан.
 * @returns Разрешённые ключи без повторов.
 */
export function botSettingsToInheritOnCreate(
  input: Partial<Record<(typeof BOT_INHERITED_SETTING_KEYS)[number], unknown>>,
  explicitKeys?: string[],
): string[] {
  return BOT_INHERITED_SETTING_KEYS.filter((key) =>
    explicitKeys === undefined ? input[key] === undefined : explicitKeys.includes(key));
}
