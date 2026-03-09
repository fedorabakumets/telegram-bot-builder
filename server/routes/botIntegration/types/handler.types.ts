/**
 * @fileoverview Общие типы для хендлеров botIntegration
 *
 * @module botIntegration/types
 */

/**
 * Базовый ответ хендлера
 */
export interface HandlerResponse {
    /** Успешность операции */
    success: boolean;
    /** Сообщение пользователю */
    message?: string;
    /** Данные ответа */
    data?: any;
    /** Сообщение об ошибке */
    error?: string;
    /** Детали ошибки */
    details?: any;
}

/**
 * Параметры Telegram Bot API для ограничения участника
 */
export interface ChatPermissions {
    /** Может ли отправлять сообщения */
    can_send_messages?: boolean;
    /** Может ли отправлять медиа */
    can_send_media_messages?: boolean;
    /** Может ли отправлять опросы */
    can_send_polls?: boolean;
    /** Может ли отправлять другие сообщения */
    can_send_other_messages?: boolean;
    /** Может ли добавлять предпросмотр ссылок */
    can_add_web_page_previews?: boolean;
    /** Может ли изменять информацию о чате */
    can_change_info?: boolean;
    /** Может ли приглашать новых участников */
    can_invite_users?: boolean;
    /** Может ли закреплять сообщения */
    can_pin_messages?: boolean;
}

/**
 * Параметры для создания ссылки-приглашения
 */
export interface InviteLinkOptions {
    /** Название ссылки */
    name?: string;
    /** Дата истечения (timestamp) */
    expireDate?: number;
    /** Лимит участников */
    memberLimit?: number;
    /** Создавать запросы на вступление */
    createsJoinRequest?: boolean;
}

/**
 * Результат поиска пользователя
 */
export interface UserSearchResult {
    /** Найден ли пользователь */
    found: boolean;
    /** Данные пользователя */
    data?: {
        success: boolean;
        user: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            type: string;
        };
        userId: string;
        source: 'local_project' | 'local_global' | 'telegram';
    };
}
