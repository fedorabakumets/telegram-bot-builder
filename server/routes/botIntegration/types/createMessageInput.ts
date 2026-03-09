/**
 * @fileoverview Тип данных для создания сообщения
 *
 * Этот модуль предоставляет интерфейс для входных данных
 * при создании сообщения.
 *
 * @module botIntegration/types/createMessageInput
 */

/** Данные для создания сообщения */
export interface CreateMessageInput {
    /** ID проекта */
    projectId: number;
    /** ID пользователя */
    userId: string;
    /** Тип сообщения */
    messageType: 'bot' | 'user' | 'system';
    /** Текст сообщения */
    messageText?: string;
    /** Данные сообщения */
    messageData?: unknown;
}
