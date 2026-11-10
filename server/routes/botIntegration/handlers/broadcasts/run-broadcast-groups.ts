/**
 * @fileoverview Последовательная доставка группам с единым учётом результата и остановкой.
 */
import { isBotUnauthorized } from "@shared/broadcast-unauthorized";
import { parseBroadcastSendError } from "./parse-broadcast-send-error";

/** Результат одной попытки доставки Telegram. */
export interface GroupSendResult {
  /** Признак успешной доставки. */
  ok: boolean;
  /** Идентификатор доставленного сообщения. */
  messageId?: number;
  /** Пауза ограничения Telegram в секундах. */
  retryAfter?: number;
  /** Код ошибки Telegram. */
  errorCode?: number;
  /** Описание ошибки доставки. */
  description?: string;
}

/** Зависимости групповой очереди, отделённые для проверки без реальной отправки. */
export interface GroupQueueActions {
  /** Проверяет запрос остановки. */
  stopped: () => boolean;
  /** Отправляет сообщение одной группе. */
  send: (groupId: string) => Promise<GroupSendResult>;
  /** Устанавливает общую паузу токена. */
  pause: (seconds: number) => Promise<unknown>;
  /** Отмечает отозванный токен и останавливает рассылку. */
  unauthorized: (description?: string) => Promise<void>;
  /** Учитывает и сохраняет единственный окончательный результат. */
  record: (groupId: string, result: GroupSendResult) => Promise<void>;
  /** Записывает историю после успешной доставки. */
  history: (groupId: string) => Promise<void>;
  /** Сохраняет счётчики и публикует актуальный прогресс. */
  progress: () => Promise<void>;
  /** Записывает ошибку побочного действия. */
  log: (error: unknown) => void;
}

/**
 * Отправляет группам последовательно, не повторяя доставку при ошибках записи истории.
 * @param groupIds - Уникальные идентификаторы групп.
 * @param actions - Доставка, сохранение и публикация прогресса.
 */
export async function runBroadcastGroups(groupIds: readonly string[], actions: GroupQueueActions): Promise<void> {
  for (const groupId of groupIds) {
    if (actions.stopped()) break;
    let result: GroupSendResult;
    while (true) {
      try {
        result = await actions.send(groupId);
      } catch (error) {
        result = parseBroadcastSendError(error);
      }
      if (result.ok || result.errorCode !== 429) break;
      if (actions.stopped()) return;
      await actions.pause(result.retryAfter ?? 1);
      if (actions.stopped()) return;
    }
    // Отзыв токена прекращает очередь, а не отмечает остальные группы ошибочными.
    if (!result.ok && isBotUnauthorized(result.errorCode, result.description)) {
      await actions.unauthorized(result.description);
      return;
    }
    try {
      await actions.record(groupId, result);
    } catch (error) {
      actions.log(error);
    }
    if (result.ok) {
      try {
        await actions.history(groupId);
      } catch (error) {
        actions.log(error);
      }
    }
    await actions.progress();
  }
}
