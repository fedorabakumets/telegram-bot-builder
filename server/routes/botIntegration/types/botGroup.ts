/**
 * @fileoverview Тип группы бота
 *
 * Этот модуль предоставляет интерфейс для данных группы бота.
 *
 * @module botIntegration/types/botGroup
 */

/** Данные группы бота */
export interface BotGroup {
    /** Уникальный идентификатор */
    id: number;
    /** ID проекта */
    projectId: number;
    /** Название группы */
    name: string;
    /** Chat ID в Telegram */
    chatId?: string;
    /** Тип группы */
    groupType: 'public' | 'private';
    /** Описание */
    description?: string;
    /** Настройки */
    settings?: unknown;
    /** Дата создания */
    createdAt: Date;
}
