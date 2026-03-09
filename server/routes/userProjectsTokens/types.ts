/**
 * @fileoverview Типы для управления проектами и токенами пользователей
 *
 * Этот модуль предоставляет интерфейсы и типы для операций
 * с проектами и токенами ботов пользователей.
 *
 * @module userProjectsTokens/types
 */

/** Данные проекта бота */
export interface BotProject {
    /** Уникальный идентификатор проекта */
    id: number;
    /** Название проекта */
    name: string;
    /** Описание проекта */
    description?: string;
    /** ID владельца */
    ownerId: number;
    /** Данные проекта (JSON) */
    data?: unknown;
    /** Токен бота */
    botToken?: string;
    /** Флаг включения БД пользователей */
    userDatabaseEnabled?: boolean;
    /** Дата создания */
    createdAt: Date;
}

/** Данные токена бота */
export interface BotToken {
    /** Уникальный идентификатор токена */
    id: number;
    /** Токен бота */
    token: string;
    /** ID владельца */
    ownerId: number;
    /** ID проекта (опционально) */
    projectId?: number;
    /** Дата создания */
    createdAt: Date;
}

/** Ответ операции */
export interface OperationResponse {
    /** Успешность операции */
    success: boolean;
    /** Данные (если есть) */
    data?: unknown;
    /** Сообщение об ошибке (если есть) */
    error?: string;
}
