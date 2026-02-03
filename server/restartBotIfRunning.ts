import { findActiveProcessForProject } from "./findActiveProcessForProject";
import { botProcesses } from "./routes";
import { startBot } from "./startBot";
import { stopBot } from "./stopBot";
import { storage } from "./storage";

/**
 * Асинхронная функция для перезапуска Telegram-бота, если он запущен
 *
 * @param projectId - Уникальный идентификатор проекта бота
 * @returns Объект с результатом операции:
 *          - success: boolean - успешность выполнения операции
 *          - error?: string - текст ошибки при наличии
 *
 * @description
 * Эта функция проверяет статус бота по projectId. Если бот запущен, то:
 * 1. Останавливает текущий экземпляр бота
 * 2. Ждет полного завершения процесса
 * 3. Проверяет, что процесс действительно завершен
 * 4. Запускает бота снова с теми же параметрами
 *
 * В случае ошибки при остановке бота, функция возвращает success: true,
 * чтобы не блокировать сохранение проекта. При других ошибках возвращается
 * объект с success: false и описанием ошибки.
 */
export async function restartBotIfRunning(projectId: number): Promise<{ success: boolean; error?: string; }> {
  try {
    // Получаем информацию об экземпляре бота из хранилища
    const instance = await storage.getBotInstance(projectId);

    // Если бот не существует или не запущен, возвращаем успех без действий
    if (!instance || instance.status !== 'running') {
      return { success: true }; // Бот не запущен, ничего не делаем
    }

    console.log(`Перезапускаем бота ${projectId} из-за обновления кода...`);

    // Останавливаем текущий бот
    const stopResult = await stopBot(projectId, instance.tokenId);
    if (!stopResult.success) {
      console.error(`Ошибка перезапуска бота ${projectId}:`, stopResult.error);
      return { success: true }; // Возвращаем true, чтобы не блокировать сохранение проекта
    }

    // Ждем дольше для полного завершения процесса и избежания конфликтов
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Проверяем, что процесс действительно завершен
    const activeProcessInfo = findActiveProcessForProject(projectId);
    if (activeProcessInfo) {
      console.log(`Процесс бота ${projectId} еще не завершен, принудительно удаляем из памяти`);
      botProcesses.delete(activeProcessInfo.processKey);
    }

    // Запускаем заново с тем же токеном
    const startResult = await startBot(projectId, instance.token, instance.tokenId);
    return startResult;
  } catch (error) {
    console.error('Ошибка перезапуска бота:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Неизвестная ошибка' };
  }
}
