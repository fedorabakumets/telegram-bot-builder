/**
 * @fileoverview Загрузка изображений по URL
 *
 * Модуль предоставляет функцию для загрузки изображений из интернета
 * и сохранения их в папку uploads проекта.
 *
 * @module downloadImageFromUrl
 */

import { downloadFileFromUrl } from "./downloadFileFromUrl";
import { mkdirSync } from "node:fs";
import path from "node:path";

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
 * // { success: true, localPath: '/uploads/47/2026-02-28/start_image.jpg' }
 */
export async function downloadImageFromUrl(
  imageUrl: string,
  projectId: number,
  nodeName: string
): Promise<DownloadImageResult> {
  try {
    // Создаём путь в формате uploads/{projectId}/{date}/
    const date = new Date().toISOString().split('T')[0]; // ГГГГ-ММ-ДД
    const uploadDir = path.join(process.cwd(), 'uploads', String(projectId), date);
    
    // Создаём директорию если не существует
    try {
      mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 Директория создана: ${uploadDir}`);
    } catch (err) {
      console.error(`Ошибка создания директории ${uploadDir}:`, err);
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const safeNodeName = nodeName.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
    const fileName = `${timestamp}-${safeNodeName}-image.jpg`;
    const localFilePath = path.join(uploadDir, fileName);
    
    // Путь для сохранения в БД (относительный)
    const localPath = `/uploads/${projectId}/${date}/${fileName}`;

    // Загружаем файл с заголовками браузера
    console.log(`📥 Загрузка изображения: ${imageUrl}`);
    console.log(`💾 Сохранение в: ${localFilePath}`);
    
    const result = await downloadFileFromUrl(imageUrl, localFilePath);

    if (result.success) {
      console.log(`✅ Изображение загружено: ${localPath}`);
      return { success: true, localPath };
    } else {
      console.error(`❌ Ошибка загрузки: ${result.error}`);
      
      // Проверяем, является ли ошибка блокировкой со стороны сервера
      const isBlockedByServer = 
        result.error?.includes('ECONNRESET') ||
        result.error?.includes('403') ||
        result.error?.includes('401') ||
        result.error?.includes('блокиров') ||
        result.error?.includes('Forbidden');
      
      if (isBlockedByServer) {
        return { 
          success: false, 
          error: 'Сервер блокирует автоматическую загрузку. Попробуйте:\n' +
                 '1. Скачать изображение вручную и загрузить через "Выбрать файл"\n' +
                 '2. Использовать другой источник (Unsplash, Picsum, Imgur)\n' +
                 '3. Использовать прямую ссылку на изображение без защиты'
        };
      }
      
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error(`❌ Ошибка в downloadImageFromUrl:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
}
