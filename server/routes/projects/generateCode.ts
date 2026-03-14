/**
 * @fileoverview API handler для генерации Python кода бота
 * 
 * Обрабатывает POST /api/projects/:id/generate запросы
 * 
 * @module server/routes/projects/generateCode
 */

import type { Request, Response } from 'express';
import { storage } from '../../storages/storage';
import { generatePythonCode } from '../../../lib/bot-generator';

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

    // Генерируем код
    const code = generatePythonCode(project.data as any, {
      botName: project.name,
      userDatabaseEnabled,
      enableComments,
      enableLogging,
      projectId,
    });

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
