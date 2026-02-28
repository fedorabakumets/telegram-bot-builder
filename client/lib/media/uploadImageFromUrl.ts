/**
 * @fileoverview API для загрузки изображений по URL
 * 
 * Модуль предоставляет функцию для загрузки изображений из интернета
 * на сервер через API endpoint.
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
  /** Сообщение об успехе */
  message?: string;
  /** Сообщение об ошибке */
  error?: string;
}

/**
 * Загружает изображение по URL на сервер
 * 
 * @param imageUrl - URL изображения для загрузки
 * @param projectId - ID проекта
 * @param nodeName - Имя узла для формирования имени файла
 * @returns Promise с результатом загрузки
 * 
 * @example
 * const result = await uploadImageFromUrl(
 *   'https://example.com/image.jpg',
 *   47,
 *   'start'
 * );
 * if (result.success) {
 *   console.log('Изображение загружено:', result.localPath);
 * }
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  projectId: number,
  nodeName: string
): Promise<UploadImageResult> {
  try {
    const response = await fetch('/api/media/upload-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        projectId,
        nodeName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Ошибка загрузки изображения',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}
