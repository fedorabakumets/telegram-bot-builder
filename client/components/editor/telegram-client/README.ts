/**
 * @fileoverview Документация по компоненту TelegramClientConfig
 *
 * Этот компонент предоставляет интерфейс для настройки Telegram Client API (Userbot).
 *
 * @module TelegramClientConfig
 */

/**
 * @typedef {Object} TelegramClientConfigProps
 * @property {number} projectId - ID проекта для настройки
 */

/**
 * @typedef {Object} AuthStatus
 * @property {boolean} isAuthenticated - Статус авторизации
 * @property {boolean} hasCredentials - Наличие API credentials
 * @property {string} [phoneNumber] - Номер телефона
 * @property {number} [userId] - ID пользователя
 * @property {string} [username] - Имя пользователя
 */

/**
 * @typedef {'bot-only' | 'hybrid' | 'client-only'} TelegramMode
 * @description Режим работы Telegram
 * - bot-only: Только официальный Bot API
 * - hybrid: Bot API + Client API для рассылок (рекомендуется)
 * - client-only: Только Client API (userbot)
 */

/**
 * @component
 * @name TelegramClientConfig
 * @description
 * Компонент настройки Telegram Client API предоставляет:
 *
 * 1. Выбор режима работы:
 *    - 🤖 Только Bot API - официальный API бота с ограничениями
 *    - ⚡ Hybrid - Bot API + Client API для рассылок (рекомендуется)
 *    - 📱 Только Client API - полные возможности, риск бана
 *
 * 2. Настройку API credentials:
 *    - API ID - получается на my.telegram.org
 *    - API Hash - получается на my.telegram.org
 *
 * 3. Авторизацию через номер телефона:
 *    - Отправка кода подтверждения
 *    - Проверка кода
 *    - Поддержка 2FA пароля
 *
 * 4. Управление сессией:
 *    - Просмотр статуса авторизации
 *    - Информация о пользователе
 *    - Выход из аккаунта
 *
 * @example
 * ```tsx
 * import { TelegramClientConfig } from '@/components/editor/telegram-client';
 *
 * function SettingsPage({ projectId }: { projectId: number }) {
 *   return (
 *     <div>
 *       <TelegramClientConfig projectId={projectId} />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Использование в редакторе
 * <TabsContent value="client-api">
 *   <TelegramClientConfig projectId={currentProject.id} />
 * </TabsContent>
 * ```
 */

/**
 * @fileoverview API Endpoints для Telegram Client API
 *
 * @module TelegramClientAPI
 */

/**
 * @endpoint POST /api/telegram-auth/send-code
 * @description Отправляет код подтверждения на номер телефона
 * @body {Object} Request
 * @body {string} phoneNumber - Номер телефона в международном формате
 * @returns {Object} Response
 * @returns {boolean} success - Статус операции
 * @returns {string} phoneCodeHash - Хеш кода для последующей проверки
 *
 * @example
 * POST /api/telegram-auth/send-code
 * { "phoneNumber": "+79991234567" }
 */

/**
 * @endpoint POST /api/telegram-auth/verify-code
 * @description Проверяет код подтверждения
 * @body {Object} Request
 * @body {string} phoneNumber - Номер телефона
 * @body {string} phoneCode - Код из SMS
 * @body {string} phoneCodeHash - Хеш кода
 * @returns {Object} Response
 * @returns {boolean} success - Статус операции
 * @returns {boolean} [needsPassword] - Требуется ли 2FA пароль
 */

/**
 * @endpoint POST /api/telegram-auth/verify-password
 * @description Проверяет 2FA пароль
 * @body {Object} Request
 * @body {string} password - Пароль двухфакторной аутентификации
 * @returns {Object} Response
 * @returns {boolean} success - Статус операции
 */

/**
 * @endpoint POST /api/telegram-auth/save-credentials
 * @description Сохраняет API credentials
 * @body {Object} Request
 * @body {string} apiId - API ID от my.telegram.org
 * @body {string} apiHash - API Hash от my.telegram.org
 * @returns {Object} Response
 * @returns {boolean} success - Статус операции
 */

/**
 * @endpoint GET /api/telegram-auth/status
 * @description Получает статус авторизации
 * @returns {Object} Response
 * @returns {boolean} isAuthenticated - Статус авторизации
 * @returns {boolean} hasCredentials - Наличие credentials
 * @returns {string} [phoneNumber] - Номер телефона
 * @returns {number} [userId] - ID пользователя
 * @returns {string} [username] - Имя пользователя
 */

/**
 * @endpoint POST /api/telegram-auth/logout
 * @description Выход из аккаунта Client API
 * @returns {Object} Response
 * @returns {boolean} success - Статус операции
 */
