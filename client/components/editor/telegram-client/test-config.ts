/**
 * @fileoverview Тестовые конфигурации Telegram Client API
 *
 * Содержит тестовые данные для разработки:
 * - API ID и API Hash для тестового приложения
 * - Информация о MTProto серверах (test и production)
 *
 * @module test-config
 */

/**
 * Тестовая конфигурация Telegram Client API
 */
export const TEST_CONFIG = {
  /** API ID тестового приложения */
  apiId: '19827705',
  /** API Hash тестового приложения */
  apiHash: '52359acb7208f952fb68fd5c2c32cbec',
  /** Название приложения */
  appTitle: 'FCM credentials Update',
  /** Короткое имя */
  shortName: '',
  /** Test сервер */
  testServer: '149.154.167.40:443',
  /** Production сервер */
  productionServer: '149.154.167.50:443',
} as const;
