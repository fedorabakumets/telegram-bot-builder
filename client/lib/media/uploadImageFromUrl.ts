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
    console.log('📥 Загрузка изображения через браузер:', imageUrl);
    
    // Используем CORS-прокси для обхода блокировок
    // allorigins.dev - бесплатный прокси для CORS запросов
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(imageUrl)}`;
    console.log('🔄 Используем прокси:', proxyUrl);
    
    // Загружаем изображение через прокси
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    console.log('📡 Статус ответа:', response.status, response.statusText);

    if (!response.ok) {
      // Если прокси не сработал, пробуем напрямую
      console.log('⚠️ Прокси не сработал, пробуем напрямую...');
      return await uploadDirect(imageUrl, projectId, nodeName);
    }

    // Получаем изображение как blob
    const blob = await response.blob();
    console.log('📦 Получен blob:', blob.type, blob.size, 'bytes');

    // Проверяем, что blob не пустой
    if (blob.size === 0) {
      throw new Error('Пустой blob - сервер не вернул изображение');
    }

    // Конвертируем blob в base64
    const base64 = await blobToBase64(blob);
    console.log('📝 Base64 длина:', base64.length, 'символов');
    
    // Отправляем base64 на сервер
    console.log('📤 Отправка на сервер...');
    const uploadResponse = await fetch('/api/media/upload-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        projectId,
        nodeName,
        imageBase64: base64,
      }),
    });

    console.log('📥 Ответ сервера:', uploadResponse.status);
    const data = await uploadResponse.json();
    console.log('📋 Данные ответа:', data);

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: data.error || 'Ошибка загрузки изображения',
      };
    }

    return data;
  } catch (error) {
    console.error('❌ Ошибка загрузки изображения:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
    };
  }
}

/**
 * Прямая загрузка изображения (fallback)
 */
async function uploadDirect(
  imageUrl: string,
  projectId: number,
  nodeName: string
): Promise<UploadImageResult> {
  try {
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Пустой blob');
    }

    const base64 = await blobToBase64(blob);
    
    const uploadResponse = await fetch('/api/media/upload-from-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        projectId,
        nodeName,
        imageBase64: base64,
      }),
    });

    const data = await uploadResponse.json();

    if (!uploadResponse.ok) {
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
