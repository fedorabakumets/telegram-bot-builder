/** @fileoverview Фоновые задания массового перезапуска с отдельным опросом результата. */
import { randomUUID } from 'node:crypto';
import { restartAllRunningBots, isRestartAllRunning, RestartAllInProgressError, type RestartAllProgress, type RestartAllRunningBotsResult } from '../../bots/restartAllRunningBots';

/** Снимок задания без токенов и содержимого сценариев. */
export interface RestartAllJob {
  /** Непредсказуемый идентификатор. */
  jobId: string;
  /** Проект с проверкой доступа на каждом запросе. */
  projectId: number;
  /** Состояние фонового выполнения. */
  status: 'queued' | 'running' | 'completed' | 'failed';
  /** Последний этап перезапуска. */
  progress: Omit<RestartAllProgress, 'phase'> & { phase: RestartAllProgress['phase'] | 'queued' };
  /** Время принятия. */
  createdAt: string;
  /** Время последнего изменения. */
  updatedAt: string;
  /** Итог, включая ошибки отдельных ботов. */
  result?: RestartAllRunningBotsResult;
  /** Безопасное пояснение отказа всего задания. */
  error?: string;
}

/** Очередь одного процесса; после перезапуска панели старые ID недоступны. */
export class RestartAllJobs {
  /** Результаты хранятся час после завершения. */
  private readonly jobs = new Map<string, RestartAllJob>();
  /** Одно активное задание на проект. */
  private readonly active = new Map<number, string>();
  /** @param run - Исполнитель с сообщениями о прогрессе. */
  constructor(private readonly run = restartAllRunningBots) {}

  /** Удаляет старые результаты, не прерывая активную работу. */
  private prune(): void {
    for (const [id, job] of this.jobs) {
      if (job.status !== 'queued' && job.status !== 'running'
          && Date.now() - Date.parse(job.updatedAt) > 3_600_000) this.jobs.delete(id);
    }
    for (const [id, job] of this.jobs) {
      if (this.jobs.size < 200) break;
      if (job.status === 'completed' || job.status === 'failed') this.jobs.delete(id);
    }
  }

  /** Возвращает активное задание либо принимает новое без ожидания остановки ботов. */
  start(projectId: number): RestartAllJob {
    this.prune();
    const activeId = this.active.get(projectId);
    if (activeId) return structuredClone(this.jobs.get(activeId)!);
    if (isRestartAllRunning(projectId)) throw new RestartAllInProgressError(projectId);
    if (this.jobs.size >= 200) throw new Error('Очередь перезапусков заполнена. Повторите позже.');
    const now = new Date().toISOString();
    const job: RestartAllJob = { jobId: randomUUID(), projectId, status: 'queued',
      createdAt: now, updatedAt: now, progress: { phase: 'queued', total: 0,
        completed: 0, stopped: 0, stopFailed: 0, attempted: 0, restarted: 0, failed: 0, results: [] } };
    this.jobs.set(job.jobId, job);
    this.active.set(projectId, job.jobId);
    // HTTP-ответ не ждёт долгой операции; execute обрабатывает любой отказ.
    setImmediate(() => { void this.execute(job); });
    return structuredClone(job);
  }

  /** Возвращает копию только для проекта авторизованного маршрута. */
  get(projectId: number, jobId: string): RestartAllJob | undefined {
    this.prune();
    const job = this.jobs.get(jobId);
    return job?.projectId === projectId ? structuredClone(job) : undefined;
  }

  /** Выполняет работу и освобождает проект при любом исходе. */
  private async execute(job: RestartAllJob): Promise<void> {
    job.status = 'running';
    job.updatedAt = new Date().toISOString();
    try {
      job.result = await this.run(job.projectId, { onProgress: progress => {
        job.progress = structuredClone(progress);
        job.updatedAt = new Date().toISOString();
      } });
      job.status = job.result.ok ? 'completed' : 'failed';
      if (!job.result.ok) job.error = 'Не удалось перезапустить ботов проекта';
    } catch {
      job.status = 'failed';
      job.error = 'Не удалось завершить перезапуск. Проверьте состояние ботов перед повтором.';
    } finally {
      job.updatedAt = new Date().toISOString();
      this.active.delete(job.projectId);
    }
  }
}

/** Общая очередь текущей панели. */
export const restartAllJobs = new RestartAllJobs();
