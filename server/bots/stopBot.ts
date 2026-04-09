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
 * Хранилище cleanup-функций для удаления слушателей stdout/stderr
 * @external processCleanups
 * @see {@link ../terminal/setupBotProcessListeners}
 */
import { processCleanups } from "../terminal/setupBotProcessListeners";

/**
 * Модуль для взаимодействия с хранилищем данных
 * @external storage
 * @see {@link ./storage}
 */
import { storage } from '../storages/storage';
import { flushBuffer } from '../terminal/botLogsBuffer';
import { broadcastProjectEvent } from '../terminal/broadcastProjectEvent';

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

    // Убиваем ТОЛЬКО Python процесс для этого токена
    try {
      // Находим процессы с этим projectId и tokenId
      try {
        const psCommand = global.process.platform === 'win32'
          ? `tasklist /FI "IMAGENAME eq python.exe" /FO CSV`
          : `ps aux | grep python`;
        const allPythonProcesses = execSync(psCommand, { encoding: 'utf8' }).trim();

        if (allPythonProcesses) {
          // Фильтруем только процессы с этим projectId И tokenId
          const lines = allPythonProcesses.split('\n').filter((line: string) => {
            const hasProjectId = line.includes(`PROJECT_ID=${projectId}`);
            const hasTokenId = line.includes(`TOKEN_ID=${tokenId}`);
            return line.trim() && hasProjectId && hasTokenId;
          });
          
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            const pid = parseInt(parts[1]);
            if (pid && !isNaN(pid)) {
              try {
                console.log(`Убиваем процесс ${pid} для бота ${projectId} (токен ${tokenId})`);
                execSync(`kill -TERM ${pid}`, { encoding: 'utf8' });
              } catch (killError) {
                console.log(`Процесс ${pid} уже завершен или недоступен`);
              }
            }
          }
        }
      } catch (grepError) {
        // Процессы не найдены - это нормально
        console.log(`Процессы для бота ${projectId} (токен ${tokenId}) не найдены`);
      }
    } catch (error) {
      console.log(`Ошибка при поиске процессов для бота ${projectId} (токен ${tokenId}):`, error);
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
      // Удаляем слушатели процесса перед удалением из памяти
      const cleanup = processCleanups.get(processKey);
      if (cleanup) {
        cleanup();
        processCleanups.delete(processKey);
      }
      botProcesses.delete(processKey);
    }

    // Удаляем ТОЛЬКО процесс для этого токена из памяти
    botProcesses.delete(processKey);

    await flushBuffer(processKey);

    // Получаем последний активный запуск для этого токена и закрываем его
    const activeHistory = await storage.getActiveLaunchHistory(tokenId);
    if (activeHistory) {
      await storage.updateLaunchHistory(activeHistory.id, {
        status: 'stopped',
        stoppedAt: new Date(),
        errorMessage: null,
      });
    }

    await storage.stopBotInstanceByToken(tokenId);

    // Рассылаем событие об остановке бота всем клиентам проекта
    void broadcastProjectEvent(projectId, {
      type: 'bot-stopped',
      projectId,
      tokenId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error('Ошибка остановки бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
