/**
 * @fileoverview Типы для управления ID пользователей
 *
 * Этот модуль предоставляет интерфейсы и типы для операций
 * с базой ID пользователей Telegram.
 *
 * @module userIds/types
 */

/** Данные ID пользователя */
export interface UserIdItem {
    /** Уникальный идентификатор записи */
    id: number;
    /** ID пользователя Telegram */
    userId: string;
    /** Источник добавления */
    source: 'manual' | 'import' | 'bot';
    /** Дата создания */
    createdAt: Date;
}

/** Статистика по ID пользователей */
export interface UserIdsStats {
    /** Общее количество ID */
    total: number;
    /** Количество по источникам */
    bySource: Record<string, number>;
}

/** Ответ операции добавления */
export interface AddUserIdResponse {
    /** Успешность операции */
    success: boolean;
    /** Добавленная запись */
    item: UserIdItem;
}
