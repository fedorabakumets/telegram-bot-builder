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
    const { imageUrl, projectId, nodeName }: UploadImageRequest = req.body;

    // Валидация входных данных
    if (!imageUrl || typeof imageUrl !== 'string') {
      res.status(400).json({ 
        success: false, 
        error: 'Необходимо указать imageUrl' 
      });
      return;
    }

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

    // Загружаем изображение
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
