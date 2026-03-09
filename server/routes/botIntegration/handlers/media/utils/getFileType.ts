/**
 * @fileoverview Утилита определения типа файла
 *
 * Этот модуль предоставляет функцию для определения типа файла
 * на основе типа медиа из Telegram.
 *
 * @module botIntegration/handlers/media/utils/getFileType
 */

/**
 * Определяет тип файла на основе типа медиа
 *
 * @function getFileType
 * @param {string} mediaType - Тип медиа из Telegram
 * @returns {'photo' | 'video' | 'audio' | 'document'} Тип файла
 */
export function getFileType(mediaType: string): 'photo' | 'video' | 'audio' | 'document' {
    if (mediaType === 'video') {
        return 'video';
    }
    if (mediaType === 'audio') {
        return 'audio';
    }
    if (mediaType === 'document') {
        return 'document';
    }
    return 'photo';
}
