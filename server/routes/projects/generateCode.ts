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

    // Конвертируем многолистовую структуру в простую для генератора
    const convertSheetsToSimpleBotData = (data: any) => {
      if (data.nodes) return data;
      if (data.sheets && Array.isArray(data.sheets)) {
        let allNodes: any[] = [];
        data.sheets.forEach((sheet: any) => {
          if (sheet.nodes) allNodes.push(...sheet.nodes);
        });
        return { nodes: allNodes };
      }
      return { nodes: [] };
    };

    const simpleBotData = convertSheetsToSimpleBotData(project.data as any);

    // Логирование для отладки
    console.log(`[Generate] Project ${projectId}:`);
    console.log(`  - project.data keys:`, Object.keys(project.data || {}));
    console.log(`  - Has sheets:`, Array.isArray((project.data as any)?.sheets));
    console.log(`  - Has nodes:`, Array.isArray((project.data as any)?.nodes));
    console.log(`  - simpleBotData.nodes count:`, simpleBotData.nodes?.length || 0);
    if (simpleBotData.nodes && simpleBotData.nodes.length > 0) {
      console.log(`  - First node:`, {
        id: simpleBotData.nodes[0].id,
        type: simpleBotData.nodes[0].type,
        hasData: !!simpleBotData.nodes[0].data
      });
    }

    // Генерируем код
    const code = generatePythonCode(simpleBotData, {
      botName: project.name,
      userDatabaseEnabled,
      enableComments,
      enableLogging,
      projectId,
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
