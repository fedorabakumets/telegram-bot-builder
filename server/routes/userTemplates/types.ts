/**
 * @fileoverview Типы для управления шаблонами пользователей
 *
 * Этот модуль предоставляет интерфейсы и типы для операций
 * с шаблонами ботов пользователей.
 *
 * @module userTemplates/types
 */

/** Данные шаблона бота */
export interface BotTemplate {
    /** Уникальный идентификатор шаблона */
    id: number;
    /** Название шаблона */
    name: string;
    /** Описание шаблона */
    description?: string;
    /** ID владельца */
    ownerId: number;
    /** Данные шаблона (JSON) */
    templateData: unknown;
    /** Дата создания */
    createdAt: Date;
    /** Дата обновления */
    updatedAt: Date;
}

/** Данные для создания шаблона */
export interface CreateTemplateInput {
    /** Название шаблона */
    name: string;
    /** Описание (опционально) */
    description?: string;
    /** ID владельца */
    ownerId: number;
    /** Данные шаблона */
    templateData?: unknown;
}

/** Ответ операции с шаблоном */
export interface TemplateOperationResponse {
    /** Успешность операции */
    success: boolean;
    /** Данные шаблона (если есть) */
    template?: BotTemplate;
    /** Сообщение об ошибке (если есть) */
    error?: string;
}
