/**
 * @fileoverview Обработчик загрузки изображений по URL
 * 
 * API endpoint для загрузки изображений из интернета и сохранения
 * их на сервере для последующего использования в боте.
 * 
 * @module uploadImageHandler
 */

import { Request, Response } from "express";
import { downloadImageFromUrl } from "../../../files/downloadImageFromUrl";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { writeFileSync } from "node:fs";

/**
 * Тип данных запроса загрузки изображения
 */
interface UploadImageRequest {
  /** URL изображения для загрузки */
  imageUrl: string;
  /** ID проекта */
  projectId: number;
  /** Имя узла для формирования имени файла */
  nodeName: string;
  /** Base64 изображение (опционально) */
  imageBase64?: string;
}

/**
 * Обработчик POST запроса для загрузки изображения по URL
 * 
 * @param req - Express request объект
 * @param res - Express response объект
 * @returns JSON ответ с результатом загрузки
 * 
 * @example
 * POST /api/media/upload-from-url
 * Body: { imageUrl: 'https://...', projectId: 47, nodeName: 'start' }
 */
export async function uploadImageHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { imageUrl, projectId, nodeName, imageBase64 }: UploadImageRequest = req.body;

    // Валидация входных данных
    if (!projectId || typeof projectId !== 'number') {
      res.status(400).json({
        success: false,
        error: 'Необходимо указать projectId'
      });
      return;
    }

    if (!nodeName || typeof nodeName !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Необходимо указать nodeName'
      });
      return;
    }

    // Если передан base64, сохраняем его напрямую
    if (imageBase64) {
      console.log(`📥 Загрузка изображения из base64`);
      
      // Создаём путь в формате uploads/{projectId}/{date}/
      const date = new Date().toISOString().split('T')[0];
      const uploadDir = path.join(process.cwd(), 'uploads', String(projectId), date);
      
      // Создаём директорию
      mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 Директория создана: ${uploadDir}`);

      // Генерируем имя файла
      const timestamp = Date.now();
      const safeNodeName = nodeName.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
      const fileName = `${timestamp}-${safeNodeName}-image.jpg`;
      const localFilePath = path.join(uploadDir, fileName);
      const localPath = `/uploads/${projectId}/${date}/${fileName}`;

      // Декодируем base64 и сохраняем
      const buffer = Buffer.from(imageBase64, 'base64');
      writeFileSync(localFilePath, buffer);

      console.log(`✅ Изображение загружено: ${localPath}`);

      res.json({
        success: true,
        localPath,
        message: 'Изображение успешно загружено'
      });
      return;
    }

    // Если base64 не передан, пробуем загрузить по URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Необходимо указать imageUrl или imageBase64'
      });
      return;
    }

    // Загружаем изображение по URL
    const result = await downloadImageFromUrl(imageUrl, projectId, nodeName);

    if (result.success && result.localPath) {
      res.json({
        success: true,
        localPath: result.localPath,
        message: 'Изображение успешно загружено'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Ошибка загрузки изображения'
      });
    }
  } catch (error) {
    console.error('Ошибка в uploadImageHandler:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
}
