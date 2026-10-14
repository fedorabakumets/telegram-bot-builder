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
    /** Может ли отправлять текстовые сообщения */
    can_send_messages?: boolean;
    /** Может ли отправлять аудио */
    can_send_audios?: boolean;
    /** Может ли отправлять документы */
    can_send_documents?: boolean;
    /** Может ли отправлять фото */
    can_send_photos?: boolean;
    /** Может ли отправлять видео */
    can_send_videos?: boolean;
    /** Может ли отправлять видеозаметки */
    can_send_video_notes?: boolean;
    /** Может ли отправлять голосовые */
    can_send_voice_notes?: boolean;
    /** Может ли отправлять опросы */
    can_send_polls?: boolean;
    /** Может ли отправлять стикеры и другие сообщения */
    can_send_other_messages?: boolean;
    /** Может ли добавлять предпросмотр ссылок */
    can_add_web_page_previews?: boolean;
    /** Может ли ставить реакции */
    can_react_to_messages?: boolean;
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
