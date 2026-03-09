/**
 * @fileoverview Тип информации о боте Telegram
 *
 * Этот модуль предоставляет интерфейс для данных о боте из Telegram API.
 *
 * @module botIntegration/types/telegramBotInfo
 */

/** Информация о боте Telegram */
export interface TelegramBotInfo {
    /** ID бота */
    id: number;
    /** Имя бота */
    first_name: string;
    /** Username бота */
    username?: string;
    /** Может присоединяться к группам */
    can_join_groups?: boolean;
    /** Может читать сообщения в группах */
    can_read_all_group_messages?: boolean;
    /** Поддерживает inline режим */
    supports_inline_queries?: boolean;
    /** URL аватарки */
    photoUrl?: string;
    /** Описание */
    description?: string;
    /** Краткое описание */
    short_description?: string;
}
