/** @fileoverview Проверка ботов с постоянной историей и подписчиками безопасного прогресса. */
import { randomUUID } from 'node:crypto';
import type { BotToken } from '@shared/schema';
import type { TelegramBotCheckResult } from '@shared/telegram-bot-check';
import { checkTelegramBots } from './check-telegram-bots';
import { telegramBotHistoryStore, type BotHistoryRun } from './telegram-bot-history-store';
/** Публичное состояние задачи не содержит секретов. */
interface CheckTask {
  /** Последний сохранённый запуск. */ run: BotHistoryRun;
  /** Последний сохранённый итог. */ result: TelegramBotCheckResult;
  /** Размер области. */ total: number;
  /** Подписчики прогресса. */ listeners: Set<(result: TelegramBotCheckResult) => void>;
  /** Завершение с сохранением результата. */ promise: Promise<TelegramBotCheckResult>;
}
/** Уникальный владелец записей и продления аренды текущего процесса. */
const workerId = randomUUID();
/** Обещание резервируется до первого обращения к базе, исключая локальную гонку POST. */
const tasks = new Map<string, Promise<CheckTask>>();
/** Ожидает небольшую паузу перед чтением удалённого процесса. @returns Завершение паузы. */
function pollDelay() { return new Promise<void>(resolve => setTimeout(resolve, 500)); }
/** Публикует только сохранённые данные; ошибка клиента не влияет на задачу. @param task - Проверка. @param run - Сохранённое состояние. */
function publish(task: CheckTask, run: BotHistoryRun) {
  task.run = run; task.result = run.result;
  for (const listener of task.listeners) { try { listener(task.result); } catch { /* Отсоединённый клиент не мешает проверке. */ } }
}
/** Присоединяется к запуску другого процесса без повторного обращения к Telegram. @param task - Активный запуск. @returns Его сохранённый итог. */
async function followRemote(task: CheckTask): Promise<TelegramBotCheckResult> {
  while (task.run.status === 'running') {
    await pollDelay();
    await telegramBotHistoryStore.interruptExpired(task.run.projectId);
    const run = await telegramBotHistoryStore.get(task.run.projectId, task.run.id);
    if (!run) throw new Error('Не удалось получить сохранённую проверку');
    publish(task, run);
  }
  return task.result;
}
/** Создаёт постоянный запуск до первого запроса Telegram. @param projectId - Проект. @param tokenId - Область. @param tokens - Разрешённые боты. @returns Общая задача. */
async function createTask(projectId: number, tokenId: number | null, tokens: BotToken[]): Promise<CheckTask> {
  await telegramBotHistoryStore.interruptExpired(projectId);
  const { run, created } = await telegramBotHistoryStore.create({ projectId, scopeTokenId: tokenId, workerId,
    scopeName: tokenId === null ? 'Все боты' : tokens[0]?.botFirstName || tokens[0]?.name || null,
    tokens: tokens.map(bot => ({ id: bot.id, name: bot.name, botUsername: bot.botUsername })) });
  const task: CheckTask = { run, result: run.result, total: run.total, listeners: new Set(), promise: Promise.resolve(run.result) };
  if (!created) { task.promise = followRemote(task); return task; }
  /** Ошибка продления аренды завершает запуск ошибкой, не давая публиковать неподтверждённую запись. */
  let leaseError: Error | undefined;
  const heartbeat = setInterval(() => {
    void telegramBotHistoryStore.heartbeat(projectId, run.id, workerId).then(ok => {
      if (!ok) leaseError = new Error('Аренда проверки завершена');
    }).catch(() => { leaseError = new Error('Не удалось продлить проверку'); });
  }, 20_000);
  task.promise = (async () => {
    try {
      await checkTelegramBots(tokens, undefined, async item => {
        if (leaseError) throw leaseError;
        publish(task, await telegramBotHistoryStore.saveItem(projectId, run.id, workerId, item));
      });
      const finished = await telegramBotHistoryStore.finish(projectId, run.id, workerId);
      if (!finished) throw new Error('Не удалось сохранить завершение проверки');
      publish(task, finished); return finished.result;
    } catch (error) {
      const failed = await telegramBotHistoryStore.finish(projectId, run.id, workerId, 'internal_error');
      if (failed) publish(task, failed);
      throw error;
    } finally { clearInterval(heartbeat); }
  })();
  return task;
}
/** Возвращает текущую либо резервирует новую проверку выбранной области. @param projectId - Проект. @param tokenId - Бот или все. @param tokens - Проверенная область. @returns Проверка без секретов. */
export function telegramBotCheckTask(projectId: number, tokenId: number | null, tokens: BotToken[]): Promise<CheckTask> {
  const key = `${projectId}:${tokenId ?? 'all'}`;
  const active = tasks.get(key);
  if (active) return active;
  const pending = createTask(projectId, tokenId, tokens);
  tasks.set(key, pending);
  void pending.then(task => task.promise).finally(() => { if (tasks.get(key) === pending) tasks.delete(key); }).catch(() => undefined);
  return pending;
}
