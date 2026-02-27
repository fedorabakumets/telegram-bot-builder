/**
 * @fileoverview Типы для маршрутов аутентификации
 *
 * Этот модуль предоставляет интерфейсы и типы для данных
 * аутентификации через Telegram.
 *
 * @module auth/types
 */

/** Данные пользователя Telegram от виджета */
export interface TelegramUserData {
    /** Уникальный идентификатор пользователя */
    id: number;
    /** Имя пользователя */
    first_name: string;
    /** Фамилия пользователя (опционально) */
    last_name?: string;
    /** Имя пользователя в Telegram (опционально) */
    username?: string;
    /** URL фото профиля (опционально) */
    photo_url?: string;
    /** Временная метка аутентификации */
    auth_date: number;
}

/** Данные для создания/обновления пользователя в БД */
export interface CreateTelegramUserInput {
    /** Уникальный идентификатор Telegram */
    id: number;
    /** Имя */
    firstName: string;
    /** Фамилия (опционально) */
    lastName?: string;
    /** Username в Telegram (опционально) */
    username?: string;
    /** URL фото (опционально) */
    photoUrl?: string;
    /** Дата аутентификации (опционально) */
    authDate?: number;
}

/** Ответ авторизации */
export interface AuthResponse {
    /** Успешность операции */
    success: boolean;
    /** Сообщение результата */
    message?: string;
    /** Данные пользователя (если успешно) */
    user?: unknown;
    /** Сообщение об ошибке (если ошибка) */
    error?: string;
}
