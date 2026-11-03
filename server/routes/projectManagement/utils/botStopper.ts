/**
 * @fileoverview Подтверждённая отмена запусков и остановка экземпляров до удаления проекта.
 */
import { stopBot } from '../../../bots/stopBot';
import { storage } from '../../../storages/storage';
/**
 * Останавливает все токены, включая queued/starting/offline, и известные orphan-экземпляры.
 * Отказ любого stop/cancel прерывает последующее удаление данных проекта.
 * @param projectId - Проект удаления
 * @returns Подтверждение backend для всех найденных токенов и экземпляров
 */
export async function stopProjectBot(projectId: number): Promise<void> {
 const instances = await storage.getBotInstancesByProject(projectId);
 const tokens = await storage.getBotTokensByProject(projectId);
 const tokenIds = new Set(tokens.map((token) => token.id));
 for (const instance of instances) {
  if (instance.tokenId != null) tokenIds.add(instance.tokenId);
  else if (instance.status === 'running') {
   const defaultId = tokens.find((token) => token.isDefault === 1)?.id;
   if (defaultId == null) throw new Error('Не найден токен запущенного экземпляра; удаление проекта остановлено');
   tokenIds.add(defaultId);
  }
 }
 for (const tokenId of tokenIds) {
  // Backend под token lock удаляет pending startArgs и ждёт подтверждения остановки.
  const result = await stopBot(projectId, tokenId);
  if (!result.success) throw new Error('Остановка или отмена запуска не подтверждена; данные проекта не удалены');
 }
}
