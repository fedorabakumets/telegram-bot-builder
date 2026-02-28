/**
 * @fileoverview Генерация кода для резолвинга путей к медиафайлам
 * 
 * Модуль создаёт Python-код для проверки и преобразования
 * относительных путей /uploads/ в FSInputFile.
 * 
 * @module bot-generator/transitions/generate-media-path-resolve
 */

/**
 * Тип медиа: "photo", "video", "audio", "document"
 */
export type MediaType = 'photo' | 'video' | 'audio' | 'document';

/**
 * Генерирует Python-код для резолвинга пути к медиафайлу
 * 
 * @param mediaType - Тип медиа (photo, video, audio, document)
 * @param urlVar - Имя переменной с URL
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMediaPathResolve(
  mediaType: MediaType,
  urlVar: string,
  indent: string = '                '
): string {
  let code = '';
  
  code += `${indent}if ${urlVar}.startsWith('/uploads/'):\n`;
  code += `${indent}    ${mediaType}_path = get_upload_file_path("${urlVar}")\n`;
  code += `${indent}    ${mediaType}_url = FSInputFile(${mediaType}_path)\n`;
  
  return code;
}
