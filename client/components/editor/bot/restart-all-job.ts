/** @fileoverview Ограниченные HTTP-запросы и восстановление фонового перезапуска проекта. */

/** Снимок серверного задания перезапуска. */
export interface RestartAllJob {
  /** Идентификатор задания. */
  jobId: string;
  /** Проект задания. */
  projectId: number;
  /** Состояние выполнения. */
  status: 'queued' | 'running' | 'completed' | 'failed';
  /** Текущий этап и счётчики. */
  progress?: { phase: string; total: number; completed: number; stopped?: number; stopFailed?: number;
    attempted?: number; restarted: number; failed: number };
  /** Подтверждённый итог сервера. */
  result?: { ok: boolean; restarted: number; failed: number; message?: string; results: { tokenId: number; success: boolean; error?: string }[] };
  /** Ошибка всего задания. */
  error?: string;
}

/** Ключ общего прогресса для кнопок и панелей проекта. */
export const restartAllProgressKey = (pid: number) => ['restart-all-progress', pid];
/** Короткая подпись текущей фазы без предположения об успешном запуске. */
export function restartAllProgressLabel(job?: RestartAllJob): string {
  const progress = job?.progress;
  if (!progress) return 'Перезапуск…';
  if (progress.phase === 'queued') return 'В очереди';
  if (progress.phase === 'cooldown') return 'Пауза перед запуском';
  if (progress.phase === 'stopping') return `Остановка ${(progress.stopped || 0) + (progress.stopFailed || 0)}/${progress.total}`;
  return `Перезапуск ${progress.completed}/${progress.total}`;
}
const storageKey = 'bot-restart-all-active';
const inFlight = new Map<number, Promise<NonNullable<RestartAllJob['result']>>>();

/** Прочитать сохранённое задание без повторного запуска ботов. */
export function savedRestartJob(): { projectId: number; jobId: string } | null {
  try { return JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch { return null; }
}

/** Выполнить один короткий запрос вместо долгого HTTP-перезапуска. */
async function requestJob(url: string, method = 'GET'): Promise<RestartAllJob> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { method, credentials: 'include', signal: controller.signal });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.error || `HTTP ${response.status}: статус перезапуска не получен`);
    return body;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Сервер не ответил за 10 секунд. Перезапуск мог продолжиться; повторите проверку статуса.');
    throw error;
  } finally { clearTimeout(timeout); }
}

/** Дождаться результата; после обновления страницы выполнять только GET сохранённого задания. */
export function runRestartAllJob(pid: number, progress: (job: RestartAllJob) => void) {
  const existing = inFlight.get(pid);
  if (existing) return existing;
  const operation = (async () => {
    const saved = savedRestartJob();
    let job: RestartAllJob;
    if (saved?.projectId === pid) {
      job = await requestJob(`/api/projects/${pid}/bot/restart-all/jobs/${encodeURIComponent(saved.jobId)}`);
    } else {
      job = await requestJob(`/api/projects/${pid}/bot/restart-all/jobs`, 'POST');
    }
    if (!job.jobId) throw new Error('Сервер не вернул идентификатор задания. Проверьте состояние ботов перед повторным запуском.');
    sessionStorage.setItem(storageKey, JSON.stringify({ projectId: pid, jobId: job.jobId }));
    const deadline = Date.now() + 10 * 60 * 1000;
    while (true) {
      progress(job);
      if (job.status === 'failed') { sessionStorage.removeItem(storageKey); throw new Error(job.error || 'Не удалось перезапустить ботов'); }
      if (job.status === 'completed') {
        sessionStorage.removeItem(storageKey);
        if (!job.result) throw new Error('Сервер завершил задание без результата');
        return job.result;
      }
      if (Date.now() >= deadline) throw new Error('Ожидание статуса завершено. Задание могло продолжиться; повторите проверку статуса.');
      await new Promise(resolve => setTimeout(resolve, 1500));
      job = await requestJob(`/api/projects/${pid}/bot/restart-all/jobs/${encodeURIComponent(job.jobId)}`);
    }
  })().finally(() => inFlight.delete(pid));
  inFlight.set(pid, operation);
  return operation;
}
