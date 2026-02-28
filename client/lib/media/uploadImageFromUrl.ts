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
 * @param projectId - ID проекта
 * @param nodeName - Имя узла для формирования имени файла
 * @returns Promise с результатом загрузки
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  projectId: number,
  nodeName: string
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

/**
 * Конвертирует Blob в base64 строку
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Конвертирует Blob в base64 строку
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Удаляем data:image/jpeg;base64, префикс
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
