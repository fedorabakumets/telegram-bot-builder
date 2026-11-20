/** @fileoverview Сохранение сообщения рассылки и публикация фактической записи истории. */
import { storage } from "../../../../storages/storage";
import { broadcastProjectEvent } from "../../../../terminal/broadcastProjectEvent";

/**
 * Сохраняет доставленное сообщение и передаёт клиентам его настоящий идентификатор и данные.
 * @param input - Полная запись истории с идентификатором сообщения Telegram.
 * @returns Завершение сохранения и уведомления.
 */
export async function saveBroadcastHistory(input: Parameters<typeof storage.createBotMessage>[0]): Promise<void> {
  const message = await storage.createBotMessage(input);
  await broadcastProjectEvent(input.projectId, {
    type: "new-message",
    projectId: input.projectId,
    tokenId: input.tokenId ?? undefined,
    data: { ...message, createdAt: message.createdAt?.toISOString() ?? null },
    timestamp: new Date().toISOString(),
  });
}
