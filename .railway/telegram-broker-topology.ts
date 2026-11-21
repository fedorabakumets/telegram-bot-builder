/** @fileoverview Явный выбор единственного владельца Telethon для проверяемого плана Railway. */

/** Поддерживаемые варианты размещения общего брокера. */
export type TelegramBrokerTopology = 'standalone' | 'embedded';

/** Меняется отдельным проверяемым коммитом после подготовки контролируемой передачи тома. */
export const TELEGRAM_BROKER_TOPOLOGY: TelegramBrokerTopology = 'standalone';

/** Единый путь журнала и блокировки независимо от контейнера-владельца. */
export const TELEGRAM_BROKER_MOUNT = '/var/lib/botcraft-telegram';

/** Общие параметры приватного слушателя; webhook исполнителя использует отдельный порт 9080. */
export const telegramBrokerEnvironment = {
  TELETHON_BROKER_ALLOW_PRIVATE_NETWORK: '1', TELETHON_BROKER_HOST: '::',
  TELETHON_BROKER_PORT: '8765', TELETHON_BROKER_LOCK_FILE: `${TELEGRAM_BROKER_MOUNT}/broker.lock`,
};

/**
 * Определяет размещение без неявного чтения окружения и одновременного запуска двух владельцев.
 * @param mode - Проверяемый вариант размещения.
 * @returns Согласованные параметры адреса API и запуска брокера.
 */
export function telegramBrokerTopology(mode: TelegramBrokerTopology) {
  if (mode !== 'standalone' && mode !== 'embedded') throw new Error('Неизвестная топология Telegram-брокера');
  const embedded = mode === 'embedded';
  return {
    embedded,
    runtimeEnvironment: embedded ? { ...telegramBrokerEnvironment, TELETHON_BROKER_MODE: 'embedded', PORT: '8765' }
      : { TELETHON_BROKER_MODE: 'external' },
    brokerUrl: embedded ? 'http://${{bot runtime.RAILWAY_PRIVATE_DOMAIN}}:8765'
      : 'http://${{telegram-accounts.RAILWAY_PRIVATE_DOMAIN}}:8765',
  };
}
