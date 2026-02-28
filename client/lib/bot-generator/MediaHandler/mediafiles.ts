/**
 * @fileoverview Генерация кода обработчиков медиафайлов
 * Модуль для вставки кода навигации в обработчики фото, видео, аудио и документов
 */

import { generateAudioHandlerCode, generateDocumentHandlerCode, generatePhotoHandlerCode, generateVideoHandlerCode, hasAudioInput, hasDocumentInput, hasPhotoInput, hasVideoInput } from '.';

/**
 * Генерирует Python-код обработчиков медиафайлов с навигацией
 * @param nodes - Массив узлов для анализа наличия медиа-инпутов
 * @param navigationCode - Код навигации для вставки в обработчики
 * @param code - Начальный код для добавления сгенерированных обработчиков
 * @returns Полный код с обработчиками медиафайлов
 */
export function mediafiles(nodes: any[], navigationCode: string, code: string): string {
    if (hasPhotoInput(nodes || [])) {
        let photoCode = generatePhotoHandlerCode();
        photoCode = photoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += photoCode;
    }
    if (hasVideoInput(nodes || [])) {
        let videoCode = generateVideoHandlerCode();
        videoCode = videoCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += videoCode;
    }
    if (hasAudioInput(nodes || [])) {
        let audioCode = generateAudioHandlerCode();
        audioCode = audioCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += audioCode;
    }
    if (hasDocumentInput(nodes || [])) {
        let docCode = generateDocumentHandlerCode();
        docCode = docCode.replace('            # (здесь будет сгенерированный код навигации)', navigationCode);
        code += docCode;
    }
    return code;
}
