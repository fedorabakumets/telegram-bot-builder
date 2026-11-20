/** @fileoverview Фоновая проверка сроков расписаний; резервация в БД исключает дубли между процессами. */
import { checkScheduleStore, type CheckScheduleScope } from './schedule-store';
import { runScheduledCheck } from './run-scheduled-check';
/** Немедленно резервирует и запускает только сохранённую область через тот же механизм, что фоновый таймер. @param scope - Область. @param store - Хранилище. @param execute - Запуск очереди. @returns Была ли наступившая попытка. */
export async function runDueCheckScope(scope: CheckScheduleScope, store = checkScheduleStore, execute = runScheduledCheck): Promise<boolean> {
  const row = await store.claim(new Date(),scope);
  if (!row) return false;
  try { await store.outcome(row.id,row.claim_id,await execute(row)); }
  catch { await store.outcome(row.id,row.claim_id,'error'); }
  return true;
}
/** Запускает не более четырёх запланированных очередей за один проход. @param store - Изолируемое хранилище. @param execute - Запуск существующей очереди. @returns Завершение прохода. */
export async function tickCheckSchedules(store = checkScheduleStore, execute = runScheduledCheck) {
  await Promise.all(Array.from({ length: 4 }, async () => {
    const row = await store.claim();
    if (!row) return;
    try { await store.outcome(row.id,row.claim_id,await execute(row)); }
    catch { await store.outcome(row.id,row.claim_id,'error'); }
  }));
}
/** Запускает опрос после готовности сервера и возвращает его остановку. @returns Освобождение таймера. */
export function startCheckScheduleWorker(): () => void {
  let running = false;
  /** Ошибка одной БД-проверки не останавливает будущие проходы и не раскрывает секреты. */
  const tick = () => {
    if (running) return;
    running = true;
    void tickCheckSchedules().catch(() => console.warn('[CheckSchedules] Не удалось обработать расписание')).finally(() => { running = false; });
  };
  const timer = setInterval(tick,15_000); timer.unref(); tick();
  return () => clearInterval(timer);
}
