/**
 * @fileoverview Баррер-файл для экспорта всех сервисов клиента Telegram
 * @module server/telegram/services/client/index
 */

// Работа с сессиями
export { loadSessionFromDb } from './load-session-from-db.js';
export { saveSessionToDb } from './save-session-to-db.js';
export { restoreSession } from './restore-session.js';
export { initializeManager } from './initialize-manager.js';

// Credentials
export { loadApiCredentials } from './load-api-credentials.js';
export { saveApiCredentials } from './save-api-credentials.js';
export { getEnvCredentials } from './get-env-credentials.js';
export { setCredentials } from './set-credentials.js';

// Клиент
export { createTelegramClient } from './create-telegram-client.js';
export { disconnectTelegramClient } from './disconnect-telegram-client.js';
export { disableUpdateLoop } from './disable-update-loop.js';
export { validateSession } from './validate-session.js';
export { startClientWithPhone } from './start-client-with-phone.js';

// Авторизация (phone code)
export { sendCode } from './send-code.js';
export { resendCode } from './resend-code.js';
export { verifyCode } from './verify-code.js';
export { verifyPassword } from './verify-password.js';
export { logout } from './logout.js';

// Статус
export { getAuthStatus } from './get-auth-status.js';
