/** @fileoverview Подготовка транспортных настроек без удаления скрытого секрета. */
import type { RuntimeModeChanges } from './runtimeModeSettings';

/** Входные поля формы доставки сообщений. */
interface LaunchSettingsInput {
  /** Способ доставки после следующего запуска. */
  launchMode?: RuntimeModeChanges['launchMode'];
  /** Адрес вебхука, команда наследования или отсутствие нового значения. */
  webhookBaseUrl?: string | null;
  /** Секрет; отсутствие поля или маска сохраняет прежнее значение. */
  webhookSecretToken?: string | null;
}

/**
 * Исключает отсутствующие поля и маску из изменения транспортных настроек.
 * @param input - Настройки, явно отправленные клиентом.
 * @returns Безопасное изменение без обращения к Telegram.
 */
export function buildLaunchSettingsPatch(input: LaunchSettingsInput): RuntimeModeChanges {
  const patch: RuntimeModeChanges = {};
  if (input.launchMode !== undefined) patch.launchMode = input.launchMode;
  if (input.webhookBaseUrl !== undefined) patch.webhookBaseUrl = input.webhookBaseUrl;
  if (input.webhookSecretToken !== undefined
    && !(typeof input.webhookSecretToken === 'string' && /[•*…]/.test(input.webhookSecretToken))) {
    patch.webhookSecretToken = input.webhookSecretToken;
  }
  return patch;
}
