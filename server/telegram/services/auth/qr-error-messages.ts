/**
 * @fileoverview Константы сообщений для QR-авторизации
 * @module server/telegram/services/auth/qr-error-messages
 */

/** Сообщение об успешной генерации QR */
export const QR_GENERATED_SUCCESS = '✅ QR-токен сгенерирован';

/** Сообщение о миграции на другой DC */
export const QR_MIGRATING_DC = '🔄 QR: миграция на DC';

/** Сообщение о повторном экспорте токена */
export const QR_REEXPORTING_TOKEN = '🔄 Повторный экспорт токена после миграции...';

/** Сообщение о создании нового клиента */
export const QR_CREATING_CLIENT = '🆕 Создание нового QR-клиента';

/** Сообщение о переиспользовании клиента */
export const QR_REUSING_CLIENT = '♻️ Использование существующего QR-клиента';

/** Сообщение о проверке токена */
export const QR_CHECKING_TOKEN = '🔍 Проверка токена:';

/** Сообщение об успешном сканировании QR */
export const QR_SCANNED_SUCCESS = '✅ QR отсканирован!';

/** Сообщение о сессии */
export const QR_SESSION_STRING = '📦 Session String:';

/** Сообщение о требовании 2FA */
export const QR_REQUIRES_2FA = '🔐 QR требует 2FA пароль';

/** Сообщение о проверке 2FA */
export const QR_CHECKING_2FA = '🔐 Проверка 2FA пароля для QR...';

/** Сообщение об успешной проверке 2FA */
export const QR_2FA_VERIFIED = '✅ 2FA пароль проверен для QR';

/** Сообщение о повторном экспорте после 2FA */
export const QR_REEXPORT_AFTER_2FA = '🔄 Повторный exportLoginToken после проверки 2FA...';

/** Сообщение об успешном сканировании с 2FA */
export const QR_SCANNED_WITH_2FA = '✅ QR отсканирован с 2FA!';

/** Сообщение о несканированном QR после 2FA */
export const QR_NOT_SCANNED_AFTER_2FA = '⚠️ QR ещё не отсканирован после 2FA';

/** Сообщение об истёкшем токене */
export const QR_TOKEN_EXPIRED = 'ℹ️ Токен уже был проверен (AUTH_TOKEN_EXPIRED) — это нормально для polling';

/** Сообщение об ошибке генерации QR */
export const QR_GENERATION_ERROR = '❌ Ошибка генерации QR:';

/** Сообщение об ошибке генерации QR-токена */
export const QR_TOKEN_GENERATION_ERROR = '❌ Ошибка генерации QR-токена:';

/** Сообщение об ошибке проверки QR */
export const QR_CHECK_ERROR = '❌ Ошибка проверки QR:';

/** Сообщение об ошибке 2FA */
export const QR_2FA_ERROR = '❌ Ошибка проверки 2FA:';
