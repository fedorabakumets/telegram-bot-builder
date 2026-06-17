/**
 * @fileoverview Лимиты Telegram Bot API для сообщений рассылки
 * @description Константы по документации core.telegram.org/bots/api (июнь 2026)
 */

/** Максимальная длина текстового сообщения без медиа */
export const TELEGRAM_MAX_TEXT_LENGTH = 4096;

/** Максимальная длина подписи к медиа или альбому */
export const TELEGRAM_MAX_CAPTION_LENGTH = 1024;

/** Максимум файлов в медиагруппе */
export const TELEGRAM_MAX_MEDIA_GROUP = 10;

/** Минимум файлов для медиагруппы */
export const TELEGRAM_MIN_MEDIA_GROUP = 2;

/** Максимум инлайн-кнопок на сообщение */
export const TELEGRAM_MAX_INLINE_BUTTONS = 100;

/** Максимум кнопок в одном ряду */
export const TELEGRAM_MAX_BUTTONS_PER_ROW = 8;

/** Максимальная длина callback_data в байтах UTF-8 */
export const TELEGRAM_MAX_CALLBACK_DATA_BYTES = 64;

/** Максимальная длина текста для кнопки «Копировать» */
export const TELEGRAM_MAX_COPY_TEXT_LENGTH = 256;
