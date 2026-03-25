/**
 * @fileoverview API handler для генерации Python кода бота
 * 
 * Обрабатывает POST /api/projects/:id/generate запросы
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

    // Генерируем код
    const generatePythonCode = await loadGenerator();
    const code = generatePythonCode(botDataForGenerator, {
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
