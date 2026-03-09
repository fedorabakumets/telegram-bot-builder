/**
 * @fileoverview Типы для маршрутов проектов
 *
 * Этот модуль предоставляет интерфейсы и типы для операций
 * с проектами ботов.
 *
 * @module projectRoutes/types
 */

/** Данные проекта */
export interface BotProject {
    /** Уникальный идентификатор проекта */
    id: number;
    /** Название проекта */
    name: string;
    /** Описание проекта */
    description?: string;
    /** ID владельца */
    ownerId: number | null;
    /** Данные проекта (JSON) */
    data?: unknown;
    /** Токен бота */
    botToken?: string | null;
    /** Флаг включения БД пользователей */
    userDatabaseEnabled?: boolean;
    /** Дата создания */
    createdAt: Date;
}

/** Данные для создания проекта */
export interface CreateProjectInput {
    /** Название проекта */
    name: string;
    /** Описание (опционально) */
    description?: string;
    /** ID владельца */
    ownerId?: number | null;
    /** Данные проекта */
    data?: unknown;
    /** Токен бота */
    botToken?: string;
    /** Флаг включения БД пользователей */
    userDatabaseEnabled?: boolean;
}

/** Ответ экспорта проекта */
export interface ExportResponse {
    /** Сгенерированный Python код */
    code: string;
}

/** Ответ информации о токене */
export interface TokenInfoResponse {
    /** Флаг наличия токена */
    hasToken: boolean;
    /** Предварительный просмотр токена */
    tokenPreview: string | null;
}
