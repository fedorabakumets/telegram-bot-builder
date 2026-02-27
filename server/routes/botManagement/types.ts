/**
 * @fileoverview Типы для маршрутов управления ботами
 *
 * Этот модуль предоставляет интерфейсы и типы для запросов,
 * ответов и данных, используемых в маршрутах управления ботами.
 *
 * @module botManagement/types
 */

/** Данные проекта */
export interface BotProject {
    /** Идентификатор проекта */
    id: number;
    /** Название проекта */
    name: string;
    /** Дополнительные поля проекта */
    [key: string]: unknown;
}

/** Данные токена бота */
export interface BotToken {
    /** Идентификатор токена */
    id: number;
    /** Токен бота Telegram */
    token: string;
    /** Идентификатор проекта */
    projectId: number;
    /** Дополнительные поля токена */
    [key: string]: unknown;
}

/** Данные экземпляра бота */
export interface BotInstance {
    /** Идентификатор экземпляра */
    id: number;
    /** Статус бота: "running" или "stopped" */
    status: 'running' | 'stopped';
    /** Идентификатор процесса (опционально) */
    processId?: string | null;
    /** Идентификатор токена */
    tokenId: number;
    /** Дополнительные поля экземпляра */
    [key: string]: unknown;
}

/** Результат операции запуска/остановки */
export interface BotOperationResult {
    /** Успешность операции */
    success: boolean;
    /** Сообщение об ошибке (если есть) */
    error?: string;
    /** Идентификатор процесса (если запущен) */
    processId?: number;
}

/** Ответ статуса бота */
export interface BotStatusResponse {
    /** Статус бота: "running" или "stopped" */
    status: 'running' | 'stopped';
    /** Данные экземпляра бота */
    instance: BotInstance | null;
}

/** Ответ операции с ботом */
export interface BotOperationResponse {
    /** Сообщение результата */
    message: string;
    /** Идентификатор процесса (если есть) */
    processId?: number;
    /** Флаг использования токена */
    tokenUsed?: boolean;
}
