/** @fileoverview Лёгкий polling с сохранением пакета до подтверждения смещения Telegram. */
import { setTimeout as sleep } from "node:timers/promises";
import { requestUpdates, type PollResponse } from "./transport";

/** Событие Telegram с обязательным идентификатором. */
export interface PollUpdate {
  /** Идентификатор обновления для подтверждения Telegram. */
  update_id: number;
  /** Остальные поля Telegram. */
  [key: string]: unknown;
}

/** Зависимости приёмника; владение lease обеспечивает вызывающая сторона. */
export interface PollingReceiverOptions {
  /** Секретный токен Telegram. */
  token: string;
  /** Остановка запроса и всех повторов. */
  signal: AbortSignal;
  /** Надёжная очередь с атомарной записью смещения. */
  queue: {
    /** Читает только подтверждённое сохранением смещение. */
    offset(): Promise<number | null>;
    /** Сохраняет весь пакет атомарно либо отклоняет его целиком. */
    enqueue(updates: PollUpdate[]): Promise<void>;
  };
  /** Пробуждает обработчик после сохранения пакета. */
  onUpdates(): Promise<void>;
  /** Заменяемый транспорт для адресных тестов. */
  request?: (token: string, payload: object, signal: AbortSignal) => Promise<PollResponse>;
  /** Заменяемое ожидание повторов для адресных тестов. */
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

/** Полный список Python-приёмника для сброса ранее сохранённого фильтра Telegram. */
export const ALLOWED_UPDATES = ["message", "edited_message", "channel_post", "edited_channel_post",
  "business_connection", "business_message", "edited_business_message", "deleted_business_messages",
  "guest_message", "message_reaction", "message_reaction_count", "inline_query", "chosen_inline_result",
  "callback_query", "shipping_query", "pre_checkout_query", "purchased_paid_media", "poll", "poll_answer",
  "my_chat_member", "chat_member", "chat_join_request", "chat_boost", "removed_chat_boost", "managed_bot",
  "subscription", "stopped_message_generation"];

/** Обозначает окончательный отказ Telegram, включая конфликт владельцев токена. */
export class PollingRejected extends Error {}

/** Проверяет пакет до записи, исключая подтверждение некорректного обновления. */
function parseUpdates(value: unknown): PollUpdate[] {
  if (!Array.isArray(value) || value.some((item) => !item || !Number.isSafeInteger(item.update_id)
    || item.update_id < 0)) throw new Error("Некорректный пакет обновлений Telegram");
  return value;
}

/** Получает пакеты до отмены; при сбое записи удерживает пакет и не вызывает новый getUpdates. */
export async function runPollingReceiver(options: PollingReceiverOptions): Promise<void> {
  const { signal, token, queue, onUpdates } = options;
  const request = options.request ?? requestUpdates;
  const wait = options.wait ?? ((milliseconds, abort) => sleep(milliseconds, undefined, { signal: abort }));
  let delay = 1_000;
  while (!signal.aborted) {
    try {
      const offset = await queue.offset();
      const response = await request(token, { ...(offset === null ? {} : { offset }), timeout: 25,
        limit: 100, allowed_updates: ALLOWED_UPDATES }, signal);
      if (response.body.ok !== true) {
        const code = Number(response.body.error_code ?? response.status);
        if ([400, 401, 403, 404, 409].includes(code)) throw new PollingRejected(`Telegram отклонил polling: код ${code}`);
        const retry = Number((response.body.parameters as { retry_after?: unknown } | undefined)?.retry_after);
        await wait(Number.isFinite(retry) ? Math.min(Math.max(retry, 1), 60) * 1_000 : delay, signal);
        continue;
      }
      const updates = parseUpdates(response.body.result);
      if (updates.length) {
        while (!signal.aborted) {
          try { await queue.enqueue(updates); await onUpdates(); break; }
          catch { if (!signal.aborted) await wait(1_000, signal); }
        }
      }
      delay = 1_000;
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof PollingRejected) throw error;
      await wait(delay, signal).catch(() => {});
      delay = Math.min(delay * 2, 30_000);
    }
  }
}
