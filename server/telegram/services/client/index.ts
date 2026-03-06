/**
 * @fileoverview Баррер-файл для экспорта всех сервисов клиента Telegram
 * @module server/telegram/services/client/index
 */

// Работа с сессиями
export { loadSessionFromDb } from './load-session-from-db.js';
export { saveSessionToDb } from './save-session-to-db.js';
export { restoreSession } from './restore-session.js';
export { initializeManager } from './initialize-manager.js';
export { saveSession } from './save-session.js';
export { saveSessionWithCheck } from './save-session-with-check.js';
export { restoreSessionWithCheck } from './restore-session-with-check.js';

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
export { disconnectClient } from './disconnect-client.js';
export { getClient } from './get-client.js';
export { createAndStoreClient } from './create-and-store-client.js';
export { disconnectWithCheck } from './disconnect-with-check.js';

// Авторизация (phone code)
export { sendCode } from './send-code.js';
export { resendCode } from './resend-code.js';
export { verifyCode } from './verify-code.js';
export { verifyPassword } from './verify-password.js';
export { logout } from './logout.js';
export { verifyPasswordWithSession } from './verify-password-with-session.js';
export { logoutUser } from './logout-user.js';
export { verifyPasswordWithValidation } from './verify-password-with-validation.js';
export { logoutWithCheck } from './logout-with-check.js';
export { AuthOperations } from './auth-operations.js';

// Статус
export { getAuthStatus } from './get-auth-status.js';

// Группы и участники
export { getGroupMembers } from './get-group-members.js';
export { getChatInfo } from './get-chat-info.js';
export { kickMember } from './kick-member.js';
export { banMember } from './ban-member.js';
export { restrictMember } from './restrict-member.js';
export { promoteMember } from './promote-member.js';
export { demoteMember } from './demote-member.js';
export { GroupMemberOperations } from './group-member-operations.js';

// Управление чатами
export { setChatUsername } from './set-chat-username.js';
export { setChatPhoto } from './set-chat-photo.js';
export { setChatDescription } from './set-chat-description.js';
export { setChatTitle } from './set-chat-title.js';
export { setChatUsernameWithCheck } from './set-chat-username-with-check.js';
export { setChatPhotoWithCheck } from './set-chat-photo-with-check.js';
export { ChatOperations } from './chat-operations.js';

// Утилиты операций
export { checkAuthForOperation } from './check-auth-for-operation.js';
export { executeMemberOperation } from './execute-member-operation.js';

// Фасады
export { TelegramOperationsManager } from './telegram-operations-manager.js';
export { TelegramClientManager } from './telegram-client-manager.js';
export { SessionManager } from './session-manager.js';
export { UserManager } from './user-manager.js';
export { ChatManager } from './chat-manager.js';
