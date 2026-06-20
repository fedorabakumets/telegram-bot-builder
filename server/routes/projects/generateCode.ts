/**
 * @fileoverview API handler для генерации Python кода бота
 * 
 * Обрабатывает POST /api/projects/:id/generate запросы.
 * Проверка доступа выполняется middleware requireProjectAccess.
 * 
 * @module server/routes/projects/generateCode
 */

import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

/**
 * Загружает generatePythonCode.
 * В dev режиме использует динамический импорт с cache-busting timestamp,
 * чтобы изменения в renderer файлах подхватывались без перезапуска сервера.
 */
async function loadGenerator(): Promise<(data: any, opts: any) => string> {
  if (isDev) {
    const generatorPath = resolve(__dirname, '../../../lib/bot-generator.ts');
    const modUrl = new URL(`file://${generatorPath}`);
    modUrl.searchParams.set('t', Date.now().toString());
    const mod = await import(modUrl.href);
    return mod.generatePythonCode;
  }
  const { generatePythonCode } = await import('../../../lib/bot-generator.js');
  return generatePythonCode;
}

/**
 * Генерирует Python код для проекта
 * 
 * @param req - Express request с projectId в params
 * @param res - Express response с сгенерированным кодом
 * 
 * @example
 * POST /api/projects/60/generate
 * Body: { userDatabaseEnabled: true, enableComments: true }
 * 
 * Response: { code: "...", lines: 2157, generatedAt: 1234567890 }
 */
export async function handleGenerateCode(req: Request, res: Response): Promise<void> {
  try {
    const projectId = parseInt(req.params.id, 10);

    const { userDatabaseEnabled = false, enableComments = true, enableLogging = false } = req.body;

    // Получаем проект из БД
    const project = await storage.getBotProject(projectId);
    if (!project) {
      res.status(404).json({ error: 'Project not found', message: `Project ${projectId} not found` });
      return;
    }

    // Читаем настройку catch-all обработчиков из первого токена проекта.
    // Если токен недоступен — дефолт true (catch-all включены).
    let catchAllHandlers = true;
    // Защита контента из первого токена проекта (дефолт false — защита выключена).
    let protectContent = false;
    // Живое обновление контента из первого токена проекта (дефолт true).
    let contentCache = true;
    try {
      const tokens = await storage.getBotTokensByProject(projectId);
      if (tokens.length > 0) {
        catchAllHandlers = tokens[0].catchAllHandlers !== 0;
        protectContent = tokens[0].protectContent === 1;
        contentCache = tokens[0].contentCache !== 0;
      }
    } catch {
      // ignore — остаётся дефолт true
    }

    const botDataForGenerator = project.data as any;

    // Логирование для отладки
    console.log(`[Generate] Project ${projectId}:`);
    console.log(`  - project.data keys:`, Object.keys(project.data || {}));
    console.log(`  - Has sheets:`, Array.isArray((project.data as any)?.sheets));
    console.log(`  - Has nodes:`, Array.isArray((project.data as any)?.nodes));
    console.log(`  - direct nodes count:`, botDataForGenerator.nodes?.length || 0);
    console.log(
      `  - sheet nodes count:`,
      Array.isArray(botDataForGenerator.sheets)
        ? botDataForGenerator.sheets.reduce((sum: number, sheet: any) => {
            return sum + (Array.isArray(sheet?.nodes) ? sheet.nodes.length : 0);
          }, 0)
        : 0
    );
    if (Array.isArray(botDataForGenerator.nodes) && botDataForGenerator.nodes.length > 0) {
      console.log(`  - First node:`, {
        id: botDataForGenerator.nodes[0].id,
        type: botDataForGenerator.nodes[0].type,
        hasData: !!botDataForGenerator.nodes[0].data
      });
    } else if (Array.isArray(botDataForGenerator.sheets) && botDataForGenerator.sheets.length > 0) {
      const firstNode = botDataForGenerator.sheets.find((sheet: any) => Array.isArray(sheet?.nodes) && sheet.nodes.length > 0)?.nodes?.[0];
      if (firstNode) {
        console.log(`  - First sheet node:`, {
          id: firstNode.id,
          type: firstNode.type,
          hasData: !!firstNode.data,
        });
      }
    }

    // Собираем все URL медиафайлов из узлов проекта для получения кэшированных file_id
    const allNodes: any[] = [];
    if (Array.isArray(botDataForGenerator.sheets)) {
      for (const sheet of botDataForGenerator.sheets) {
        if (Array.isArray(sheet?.nodes)) allNodes.push(...sheet.nodes);
      }
    } else if (Array.isArray(botDataForGenerator.nodes)) {
      allNodes.push(...botDataForGenerator.nodes);
    }

    const mediaUrls = new Set<string>();
    for (const node of allNodes) {
      const data = node?.data;
      if (!data) continue;
      // media-нода: attachedMedia
      if (Array.isArray(data.attachedMedia)) {
        for (const url of data.attachedMedia) {
          if (typeof url === 'string' && url.startsWith('/uploads/')) mediaUrls.add(url);
        }
      }
      // message-нода: imageUrl, videoUrl, audioUrl, documentUrl
      for (const field of ['imageUrl', 'videoUrl', 'audioUrl', 'documentUrl']) {
        const url = data[field];
        if (typeof url === 'string' && url.startsWith('/uploads/')) mediaUrls.add(url);
      }
    }

    // Получаем кэшированные Telegram file_id из БД
    const telegramFileIds: Record<string, string> = {};
    if (mediaUrls.size > 0) {
      try {
        const mediaFilesWithIds = await storage.getMediaFilesByUrls(Array.from(mediaUrls), projectId);
        for (const mf of mediaFilesWithIds) {
          if (mf.telegramFileId) {
            telegramFileIds[mf.url] = mf.telegramFileId;
          }
        }
        console.log(`[Generate] Найдено ${Object.keys(telegramFileIds).length} кэшированных file_id из ${mediaUrls.size} URL`);
      } catch (err) {
        console.warn('[Generate] Не удалось получить telegramFileIds:', err);
      }
    }

    // Собираем обложки видео (thumbnailMediaId → telegramFileId обложки)
    const thumbnailFileIds: Record<string, string> = {};
    const thumbnailUrls: Record<string, string> = {};
    if (mediaUrls.size > 0) {
      try {
        const mediaFilesWithIds = await storage.getMediaFilesByUrls(Array.from(mediaUrls), projectId);
        for (const mf of mediaFilesWithIds) {
          // Обложка через FK (thumbnailMediaId)
          if (mf.thumbnailMediaId) {
            const thumbFile = await storage.getMediaFile(mf.thumbnailMediaId);
            if (thumbFile?.telegramFileId) {
              // Есть file_id — используем напрямую
              thumbnailFileIds[mf.url] = thumbFile.telegramFileId;
            } else if (thumbFile?.url) {
              // Нет file_id — передаём URL обложки (FSInputFile или внешний URL)
              thumbnailUrls[mf.url] = thumbFile.url;
            }
          }
          // Обложка через прямой URL (thumbnailUrl — строка без FK)
          if (mf.thumbnailUrl && !thumbnailFileIds[mf.url] && !thumbnailUrls[mf.url]) {
            thumbnailUrls[mf.url] = mf.thumbnailUrl;
          }
        }
        const totalThumbs = Object.keys(thumbnailFileIds).length + Object.keys(thumbnailUrls).length;
        if (totalThumbs > 0) {
          console.log(`[Generate] Найдено обложек: ${Object.keys(thumbnailFileIds).length} file_id, ${Object.keys(thumbnailUrls).length} URL`);
        }
      } catch (err) {
        console.warn('[Generate] Не удалось получить обложки:', err);
      }
    }

    // Собираем attachedMediaThumbnails из нод как fallback
    const nodeThumbnailUrls: Record<string, string> = {};
    for (const node of allNodes) {
      const data = node?.data;
      if (!data?.attachedMediaThumbnails) continue;
      for (const [videoUrl, thumbUrl] of Object.entries(data.attachedMediaThumbnails)) {
        if (typeof thumbUrl === 'string') {
          nodeThumbnailUrls[videoUrl] = thumbUrl;
        }
      }
    }

    // Fallback из нод project.json (приоритет ниже БД)
    for (const [videoUrl, thumbUrl] of Object.entries(nodeThumbnailUrls)) {
      if (!thumbnailFileIds[videoUrl] && !thumbnailUrls[videoUrl]) {
        thumbnailUrls[videoUrl] = thumbUrl;
      }
    }

    // Апгрейд: если обложка из ноды уже есть в БД с telegramFileId — используем file_id
    const thumbUrlsToCheck = Object.values(nodeThumbnailUrls).filter(
      (url): url is string => typeof url === 'string' && url.startsWith('/uploads/')
    );
    if (thumbUrlsToCheck.length > 0) {
      try {
        const thumbFilesInDb = await storage.getMediaFilesByUrls(thumbUrlsToCheck, projectId);
        for (const thumbFile of thumbFilesInDb) {
          if (!thumbFile.telegramFileId) continue;
          // Находим videoUrl для этой обложки
          for (const [videoUrl, thumbUrl] of Object.entries(nodeThumbnailUrls)) {
            if (thumbUrl === thumbFile.url && !thumbnailFileIds[videoUrl]) {
              thumbnailFileIds[videoUrl] = thumbFile.telegramFileId;
              // Убираем из thumbnailUrls — теперь используем file_id
              delete thumbnailUrls[videoUrl];
              console.log(`[Generate] Обложка апгрейд до file_id для ${videoUrl.slice(-30)}: ${thumbFile.telegramFileId.slice(0, 20)}...`);
            }
          }
        }
      } catch (err) {
        console.warn('[Generate] Не удалось проверить file_id обложек из нод:', err);
      }
    }

    if (Object.keys(nodeThumbnailUrls).length > 0) {
      console.log(`[Generate] Fallback обложек из нод: ${Object.keys(nodeThumbnailUrls).length}`);
    }

    // Генерируем код
    const generatePythonCode = await loadGenerator();
    const code = generatePythonCode(botDataForGenerator, {
      botName: project.name,
      userDatabaseEnabled,
      enableComments,
      enableLogging,
      projectId,
      catchAllHandlers,
      protectContent,
      contentCache,
      telegramFileIds,
      thumbnailFileIds,
      thumbnailUrls,
    });

    // Логирование результата
    console.log(`[Generate] Result: ${code.split(/\r?\n/).length} lines generated`);

    // Возвращаем результат
    res.json({
      code,
      lines: code.split(/\r?\n/).length, // Правильный подсчёт строк
      generatedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('Generate code error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message || 'Unknown error',
    });
  }
}
