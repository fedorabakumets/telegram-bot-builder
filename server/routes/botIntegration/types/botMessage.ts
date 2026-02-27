/**
 * @fileoverview Тип сообщения бота
 *
 * Этот модуль предоставляет интерфейс для данных сообщения бота.
 *
 * @module botIntegration/types/botMessage
 */

/** Данные сообщения бота */
export interface BotMessage {
    /** Уникальный идентификатор сообщения */
    id: number;
    /** ID проекта */
    projectId: number;
    /** ID пользователя */
    userId: string;
    /** Тип сообщения */
    messageType: 'bot' | 'user' | 'system';
    /** Текст сообщения */
    messageText?: string;
    /** Данные сообщения (JSON) */
    messageData?: unknown;
    /** Дата создания */
    createdAt: Date;
}
