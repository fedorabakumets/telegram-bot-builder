/**
 * @fileoverview API для загрузки изображений по URL
 *
 * Модуль предоставляет функцию для загрузки изображений из интернета.
 * Использует простой подход - сохраняет URL для последующей загрузки сервером.
 *
 * @module uploadImageFromUrl
 */

/**
 * Результат загрузки изображения
 */
interface UploadImageResult {
  /** Успешность операции */
  success: boolean;
  /** Локальный путь к файлу на сервере */
  localPath?: string;
  /** URL изображения (если не загружено локально) */
  imageUrl?: string;
  /** Сообщение об успехе */
  message?: string;
  /** Сообщение об ошибке */
  error?: string;
}

/**
 * Загружает изображение по URL на сервер
 *
 * Примечание: Из-за CORS ограничений, изображение сохраняется как URL.
 * Сервер бота загрузит его при отправке.
 *
 * @param imageUrl - URL изображения для загрузки
 * @param _projectId - ID проекта (не используется, сохраняется для совместимости)
 * @param _nodeName - Имя узла (не используется, сохраняется для совместимости)
 * @returns Promise с результатом загрузки
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  _projectId: number,
  _nodeName: string
): Promise<UploadImageResult> {
  // Из-за CORS ограничений и блокировок стоковых сайтов,
  // просто возвращаем URL. Сервер бота загрузит изображение при отправке.
  console.log('📥 Сохранение URL изображения:', imageUrl);

  return {
    success: true,
    imageUrl,
    message: 'URL сохранён. Изображение будет загружено сервером при отправке.'
  };
}
