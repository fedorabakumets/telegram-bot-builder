/**
 * Модуль для пересоздания файлов бота при изменении имени проекта
 */

import { createCompleteBotFiles } from "./createBotFile";
import { storage } from "../storages/storage";
import { normalizeProjectNameToFile } from "./normalizeFileName";

/**
 * Пересоздает файлы бота при изменении имени проекта
 * 
 * @param {number} projectId - Идентификатор проекта
 * @returns {Promise<boolean>} Успешность операции
 */
export async function recreateBotFiles(projectId: number): Promise<boolean> {
  try {
    console.log(`🔄 Пересоздание файлов для проекта ${projectId}`);

    // Получаем проект из базы данных
    const project = await storage.getBotProject(projectId);
    if (!project) {
      console.error(`❌ Проект ${projectId} не найден`);
      return false;
    }

    // Получаем все токены для этого проекта
    const tokens = await storage.getBotTokensByProject(projectId);

    // Для каждого токена пересоздаем файлы
    for (const tokenRecord of tokens) {
      console.log(`🔄 Пересоздание файлов для токена ${tokenRecord.id} проекта ${projectId}`);

      // Генерируем код бота
      const convertSheetsToSimpleBotData = (data: any) => {
        // Если уже простая структура - возвращаем как есть
        if (data.nodes && data.connections) {
          return data;
        }

        // Если многолистовая структура - собираем все узлы и связи
        if (data.sheets && Array.isArray(data.sheets)) {
          let allNodes: any[] = [];
          let allConnections: any[] = [];

          data.sheets.forEach((sheet: any) => {
            if (sheet.nodes) allNodes.push(...sheet.nodes);
            if (sheet.connections) allConnections.push(...sheet.connections);
          });

          // Добавляем межлистовые связи
          if (data.interSheetConnections) {
            allConnections.push(...data.interSheetConnections);
          }

          return {
            nodes: allNodes,
            connections: allConnections
          };
        }

        // Если нет узлов вообще - возвращаем пустую структуру
        return {
          nodes: [],
          connections: []
        };
      };

      // Импортируем генератор кода
      const modUrl = new URL("../client/lib/bot-generator.ts", import.meta.url);
      modUrl.searchParams.set("t", Date.now().toString());
      const { generatePythonCode } = await import(modUrl.href);

      const simpleBotData = convertSheetsToSimpleBotData(project.data);
      const userDatabaseEnabled = project.userDatabaseEnabled === 1;
      // Получаем настройки генерации комментариев из переменной окружения (по умолчанию выключено)
      const enableComments = process.env.BOTCRAFT_COMMENTS_GENERATION === 'true';
      
      console.log(`📝 Генерация кода для проекта ${projectId}:`);
      console.log(`   project.userDatabaseEnabled:`, project.userDatabaseEnabled);
      console.log(`   userDatabaseEnabled (boolean):`, userDatabaseEnabled);
      
      const botCode = generatePythonCode(simpleBotData as any, project.name, [], userDatabaseEnabled, projectId, false, false, enableComments);

      // TODO: В будущем можно добавить поддержку кастомных имен файлов
      // Нормализуем имя проекта для использования в качестве имени файла
      const customFileName = normalizeProjectNameToFile(project.name);

      // Если бот запущен, нужно сначала его остановить
      const existingBotInstance = await storage.getBotInstance(projectId);
      let wasRunning = false;
      if (existingBotInstance && existingBotInstance.status === 'running') {
        wasRunning = true;
        console.log(`⚠️ Бот для проекта ${projectId} запущен, останавливаем перед пересозданием файлов...`);

        // Импортируем функцию остановки бота
        const { stopBot } = await import('../bots/stopBot');
        await stopBot(projectId, tokenRecord.id);
      }

      // Пересоздаем все файлы бота с кастомным именем
      const { mainFile, assets } = await createCompleteBotFiles(botCode, project.name, project.data, projectId, tokenRecord.id, customFileName);

      // Если бот был запущен, запускаем его снова с новыми файлами
      if (wasRunning) {
        console.log(`🔄 Бот для проекта ${projectId} был запущен, перезапускаем после пересоздания файлов...`);

        // Импортируем функцию запуска бота
        const { startBot } = await import('../bots/startBot');
        // Получаем токен из существующего экземпляра
        if (existingBotInstance) {
          await startBot(projectId, existingBotInstance.token, tokenRecord.id);
        }
      }

      console.log(`📁 Пересозданы файлы бота для токена ${tokenRecord.id}:`);
      console.log(`   - Основной файл: ${mainFile}`);
      console.log(`   - Дополнительные файлы: ${assets.length} шт.`);
      assets.forEach((asset: string) => console.log(`     * ${asset}`));
    }

    console.log(`✅ Файлы для проекта ${projectId} пересозданы`);
    return true;
  } catch (error) {
    console.error('❌ Ошибка пересоздания файлов бота:', error);
    return false;
  }
}