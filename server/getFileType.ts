/**
 * Определяет тип файла по MIME-типу
 *
 * @param mimeType - MIME-тип файла (например, 'image/jpeg', 'video/mp4', 'audio/mpeg', 'application/pdf')
 * @returns Тип файла, определенный на основе MIME-типа:
 *          - 'photo': если MIME-тип начинается с 'image/'
 *          - 'video': если MIME-тип начинается с 'video/'
 *          - 'audio': если MIME-тип начинается с 'audio/'
 *          - 'document': для всех остальных случаев
 *
 * @description
 * Функция анализирует переданный MIME-тип файла и возвращает соответствующую категорию файла.
 * Используется для определения типа медиафайла при обработке загрузок или отправке файлов
 * через Telegram API или другие системы, требующие спецификации типа файла.
 *
 * @example
 * // Примеры использования функции
 *
 * getFileType('image/jpeg');     // Возвращает 'photo'
 * getFileType('video/mp4');      // Возвращает 'video'
 * getFileType('audio/mpeg');     // Возвращает 'audio'
 * getFileType('application/pdf'); // Возвращает 'document'
 * getFileType('text/plain');     // Возвращает 'document'
 *
 * @since 1.0.0
 */
export function getFileType(mimeType: string): 'photo' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'photo';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}
