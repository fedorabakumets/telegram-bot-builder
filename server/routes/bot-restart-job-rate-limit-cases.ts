/** @fileoverview Регрессии авторизации и квоты опроса фоновых заданий перезапуска. */
import { expect, it } from 'vitest';

/** Счётчики изолированных middleware и обработчика. */
interface JobAccessCounters {
  /** Число проверок членства проекта. */
  projectCalls: number;
  /** Число обращений к обработчику задания. */
  jobCalls: number;
}

/** Регистрирует проверки на общем изолированном HTTP-сервере lifecycle-маршрутов. */
export function registerRestartJobRateLimitCases(
  withRuntimeApi: (check: (url: string) => Promise<void>) => Promise<void>,
  ownership: JobAccessCounters,
): void {
  it('проверяет членство проекта до чтения задания перезапуска', async () => {
    await withRuntimeApi(async url => {
      ownership.projectCalls = 0;
      ownership.jobCalls = 0;
      const jobUrl = `${new URL(url).origin}/api/projects/1/bot/restart-all/jobs/test-job`;
      expect((await fetch(jobUrl)).status).toBe(403);
      expect(ownership.jobCalls).toBe(0);
      expect((await fetch(jobUrl, { headers: { 'x-test-project-member': 'yes' } })).status).toBe(200);
      expect(ownership.projectCalls).toBe(2);
      expect(ownership.jobCalls).toBe(1);
    });
  });

  it('ограничивает опрос заданий до проверки доступа даже при смене UUID и проекта', async () => {
    await withRuntimeApi(async url => {
      ownership.projectCalls = 0;
      ownership.jobCalls = 0;
      const origin = new URL(url).origin;
      for (let index = 0; index < 120; index++) {
        expect((await fetch(`${origin}/api/projects/1/bot/restart-all/jobs/job-${index}`)).status).toBe(403);
      }
      const response = await fetch(`${origin}/api/projects/2/bot/restart-all/jobs/another-job`,
        { headers: { 'x-test-project-member': 'yes' } });
      expect(response.status).toBe(429);
      expect(ownership.projectCalls).toBe(120);
      expect(ownership.jobCalls).toBe(0);
      expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
      // Квота записи независима: частый опрос не блокирует изменение настроек владельцем.
      expect((await fetch(url, { method: 'PUT', headers: { 'x-test-owner': 'yes' } })).status).toBe(200);
    });
  });

}
