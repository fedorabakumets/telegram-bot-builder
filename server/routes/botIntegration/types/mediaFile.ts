/**
 * @fileoverview Тип медиафайла
 *
 * Этот модуль предоставляет интерфейс для данных медиафайла.
 *
 * @module botIntegration/types/mediaFile
 */

/** Данные медиафайла */
export interface MediaFile {
    /** Уникальный идентификатор */
    id: number;
    /** ID проекта */
    projectId: number;
    /** Имя файла */
    fileName: string;
    /** Тип файла */
    fileType: 'photo' | 'video' | 'audio' | 'document';
    /** Путь к файлу */
    filePath: string;
    /** Размер файла */
    fileSize: number;
    /** MIME тип */
    mimeType?: string;
    /** URL файла */
    url: string;
    /** Описание */
    description?: string;
    /** Теги */
    tags?: string[];
    /** Публичный доступ */
    isPublic: boolean;
}
