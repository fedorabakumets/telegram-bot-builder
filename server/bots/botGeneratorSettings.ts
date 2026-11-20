/** @fileoverview Преобразование настроек бота в общие параметры генератора и отпечатка. */

import type { BotInheritedSettings } from '../../shared/bot-inherited-settings';

/**
 * Преобразует действующие флаги, сохраняя поведение старых nullable значений.
 * @param settings - Настройки, выбранные для генерации.
 * @returns Флаги генерации Python, которые участвуют в отпечатке сборки.
 */
export function botGeneratorSettings(settings: BotInheritedSettings) {
  return {
    saveIncomingMedia: settings.saveIncomingMedia === 1,
    catchAllHandlers: settings.catchAllHandlers !== 0,
    trackUserBlocks: settings.trackUserBlocks !== 0,
    trackGroupMembership: settings.trackGroupMembership !== 0,
    protectContent: settings.protectContent === 1,
    contentCache: settings.contentCache === 1,
  };
}
