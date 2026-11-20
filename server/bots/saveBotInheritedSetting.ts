/** @fileoverview Сохранение отдельной личной или наследуемой настройки бота. */
import type { BotInheritedSettingKey } from '../../shared/bot-inherited-settings';
import type { BotInheritedSettingChanges } from './botInheritedSettingsPatch';
import { saveRuntimeModeSettings } from './runtimeModeSettings';

/**
 * Атомарно изменяет значение и признак наследования выбранного поля.
 * @param projectId - Идентификатор проекта.
 * @param tokenId - Идентификатор бота.
 * @param key - Поле, допускающее наследование.
 * @param value - Проверенное индивидуальное значение или команда наследования.
 * @returns Итоговые значения бота либо null, если он отсутствует в проекте.
 */
export function saveBotInheritedSetting<K extends BotInheritedSettingKey>(
  projectId: number, tokenId: number, key: K, value: BotInheritedSettingChanges[K],
) {
  return saveRuntimeModeSettings(tokenId, { botSettingChanges: { [key]: value } }, projectId);
}
