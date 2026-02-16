/**
 * Модуль для выполнения системных команд
 * @external child_process
 */
import { execSync } from "node:child_process";

/**
 * Глобальная коллекция активных процессов ботов
 * @external botProcesses
 * @see {@link ./routes}
 */
import { botProcesses } from "../routes/routes";

/**
 * Модуль для взаимодействия с хранилищем данных
 * @external storage
 * @see {@link ./storage}
 */
import { storage } from '../storages/storage';

/**
 * Останавливает запущенный экземпляр Telegram-бота по идентификатору проекта и токена
 *
 * @param {number} projectId - Идентификатор проекта, к которому относится бот
 * @param {number} tokenId - Идентификатор токена, используемого для запуска бота
 *
 * @returns {Promise<{ success: boolean; error?: string; }>} Объект с результатом операции:
 *   - success: true если бот успешно остановлен, false в случае ошибки
 *   - error: строка с описанием ошибки, если она произошла
 *
 * @description
 * Функция выполняет следующие действия:
 * 1. Формирует ключ в формате "projectId_tokenId" для поиска соответствующего процесса
 * 2. Проверяет наличие процесса бота в глобальной коллекции botProcesses
 * 3. Убивает все Python-процессы, связанные с этим проектом (включая зависшие)
 * 4. Мягко завершает процесс бота, если он найден в памяти (сигнал SIGTERM)
 * 5. При необходимости принудительно завершает процесс (сигнал SIGKILL) спустя 2 секунды
 * 6. Удаляет все процессы, связанные с проектом, из коллекции botProcesses
 * 7. Останавливает экземпляр бота в хранилище
 *
 * @example
 * ```typescript
 * const result = await stopBot(123, 456);
 * if (result.success) {
 *   console.log('Бот успешно остановлен');
 * } else {
 *   console.error('Ошибка при остановке бота:', result.error);
 * }
 * ```
 */
export async function stopBot(projectId: number, tokenId: number): Promise<{ success: boolean; error?: string; }> {
  try {
    const processKey = `${projectId}_${tokenId}`;
    const botProcess = botProcesses.get(processKey);

    // Убиваем ВСЕ Python процессы для этого проекта (включая старые/зависшие)
    try {
      const botFileName = `bot_${projectId}.py`;

      // Находим все процессы с этим файлом
      try {
        const psCommand = global.process.platform === 'win32'
          ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV | findstr "${botFileName}"`
          : `ps aux | grep python | grep "${botFileName}" | grep -v grep`;
        const allPythonProcesses = execSync(psCommand, { encoding: 'utf8' }).trim();

        if (allPythonProcesses) {
          const lines = allPythonProcesses.split('\n').filter((line: string) => line.trim());
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[1]);
            if (pid && !isNaN(pid)) {
              try {
                console.log(`Убиваем процесс ${pid} для бота ${projectId}`);
                execSync(`kill -TERM ${pid}`, { encoding: 'utf8' });
              } catch (killError) {
                console.log(`Процесс ${pid} уже завершен или недоступен`);
              }
            }
          }
        }
      } catch (grepError) {
        // Процессы не найдены - это нормально
        console.log(`Процессы для бота ${projectId} не найдены`);
      }
    } catch (error) {
      console.log(`Ошибка при поиске процессов для бота ${projectId}:`, error);
    }

    // Если процесс был в памяти - завершаем его мягко
    if (botProcess) {
      try {
        // Сначала пытаемся мягко завершить
        botProcess.kill('SIGTERM');

        // Даем время на корректное завершение
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Если процесс все еще работает, принудительно завершаем
        try {
          botProcess.kill('SIGKILL');
        } catch (e) {
          // Процесс уже завершен
        }
      } catch (e) {
        // Процесс уже завершен
      }
      botProcesses.delete(processKey);
    }

    // Удаляем ВСЕ процессы для этого проекта из памяти
    const keysToDelete: string[] = [];
    for (const [key] of Array.from(botProcesses.entries())) {
      if (key.startsWith(`${projectId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => botProcesses.delete(key));

    await storage.stopBotInstance(projectId);

    return { success: true };
  } catch (error) {
    console.error('Ошибка остановки бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
