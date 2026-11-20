/** @fileoverview Чтение постепенных результатов проверки ботов без ожидания общего HTTP-ответа. */
import type { TelegramBotCheckResult } from '@shared/telegram-bot-check';
/** Сохраняемые сервером времена текущей проверки. */
export interface TelegramBotCheckStreamMeta {
  /** Идентификатор проверки. */ runId: number;
  /** Начало проверки. */ startedAt: string;
  /** Завершение либо отсутствие завершения. */ finishedAt: string | null;
  /** Состояние выполнения. */ status: 'running' | 'completed' | 'failed';
}
/** Запускает проверку и передаёт каждый безопасный промежуточный итог. @param projectId - Проект. @param tokenId - Один бот или все. @param onProgress - Обновление интерфейса. @param signal - Отмена чтения при смене области. @returns Итог всей проверки. */
export async function streamTelegramBotCheck(projectId: number, tokenId: number | null,
  onProgress: (result: TelegramBotCheckResult, total: number, meta?: TelegramBotCheckStreamMeta) => void, signal: AbortSignal): Promise<TelegramBotCheckResult> {
  const response = await fetch(`/api/projects/${projectId}/telegram-bot-checks`, {
    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
    body: JSON.stringify({ tokenId }), signal,
  });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.message || 'Не удалось запустить проверку ботов'); }
  if (!response.body) throw new Error('Не удалось получить ход проверки');
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let buffer = '', final: TelegramBotCheckResult | undefined;
  /** Разбирает одну завершённую строку; неизвестные события не подменяют итог. */
  function consume(line: string) {
    if (!line.trim()) return;
    const event = JSON.parse(line);
    if (!['progress', 'complete'].includes(event.type) || !Array.isArray(event.result?.items)
      || !Number.isSafeInteger(event.total) || event.total < 0) throw new Error('Некорректный ответ проверки ботов');
    const meta = Number.isSafeInteger(event.runId) && typeof event.startedAt === 'string'
      && ['running', 'completed', 'failed'].includes(event.status)
      ? { runId: event.runId, startedAt: event.startedAt, finishedAt: typeof event.finishedAt === 'string' ? event.finishedAt : null, status: event.status } : undefined;
    onProgress(event.result, event.total, meta);
    if (event.type === 'complete') final = event.result;
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
      if (buffer.length > 1_000_000) throw new Error('Слишком большой ответ проверки');
      let split: number;
      while ((split = buffer.indexOf('\n')) >= 0) { consume(buffer.slice(0, split)); buffer = buffer.slice(split + 1); }
      if (done) break;
    }
    if (buffer.trim()) consume(buffer);
    if (!final) throw new Error('Соединение прервалось. Полученные результаты сохранены, повторите проверку остальных ботов');
    return final;
  } finally { reader.releaseLock(); }
}
