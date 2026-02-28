/**
 * @fileoverview Загрузка изображений по URL
 * 
 * Модуль предоставляет функцию для загрузки изображений из интернета
 * и сохранения их в папку uploads проекта.
 * 
 * @module downloadImageFromUrl
 */

import { downloadFileFromUrl } from "./downloadFileFromUrl";

/**
 * Результат загрузки изображения
 */
interface DownloadImageResult {
  /** Успешность операции */
  success: boolean;
  /** Локальный путь к файлу (при успехе) */
  localPath?: string;
  /** Сообщение об ошибке (при неудаче) */
  error?: string;
}

/**
 * Загружает изображение по URL и сохраняет в папку uploads
 * 
 * @param imageUrl - URL изображения для загрузки
 * @param projectId - ID проекта для сохранения в правильную папку
 * @param nodeName - Имя узла для формирования имени файла
 * @returns Promise с результатом загрузки: путь к файлу или ошибка
 * 
 * @example
 * const result = await downloadImageFromUrl(
 *   'https://example.com/image.jpg',
 *   47,
 *   'start'
 * );
 * // { success: true, localPath: '/uploads/project_47/start_image.jpg' }
 */
export async function downloadImageFromUrl(
  imageUrl: string,
  projectId: number,
  nodeName: string
): Promise<DownloadImageResult> {
  try {
    // Создаём путь для сохранения
    const timestamp = Date.now();
    const fileName = `${nodeName}_image_${timestamp}.jpg`;
    const localPath = `/uploads/project_${projectId}/${fileName}`;
    
    // Загружаем файл
    const result = await downloadFileFromUrl(imageUrl, `.${localPath}`);
    
    if (result.success) {
      return { success: true, localPath };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Неизвестная ошибка' 
    };
  }
}
