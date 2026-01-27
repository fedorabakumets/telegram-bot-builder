import { findActiveProcessForProject } from "./findActiveProcessForProject";
import { botProcesses } from "./routes";
import { startBot } from "./startBot";
import { stopBot } from "./stopBot";
import { storage } from "./storage";

// Функция для перезапуска бота (если он запущен)
export async function restartBotIfRunning(projectId: number): Promise<{ success: boolean; error?: string; }> {
  try {
    const instance = await storage.getBotInstance(projectId);
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
