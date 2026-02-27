/**
 * @fileoverview Тип ответа отправки сообщения
 *
 * Этот модуль предоставляет интерфейс для ответа операции отправки сообщения.
 *
 * @module botIntegration/types/sendMessageResponse
 */

/** Ответ операции отправки сообщения */
export interface SendMessageResponse {
    /** Успешность операции */
    success: boolean;
    /** Сообщение результата */
    message: string;
    /** Результат от Telegram API */
    result?: unknown;
}
