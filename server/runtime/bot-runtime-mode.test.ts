/**
 * @fileoverview Проверки режима владения ботами HTTP-сервером.
 * @module server/runtime/bot-runtime-mode.test
 */
import { describe, expect, it } from 'vitest';
import { assertBotRuntimeMode, resolveBotRuntimeMode } from './bot-runtime-mode';

describe('режим владения ботами', () => {
  /** Проверяет прежнее поведение без настройки режима. */
  it('сохраняет совместный запуск по умолчанию', () => {
    expect(resolveBotRuntimeMode(undefined)).toBe('combined');
    assertBotRuntimeMode('combined', 'process', undefined);
  });

  /** Не допускает незаметный локальный запуск воркеров в отдельном API. */
  it('требует удалённый исполнитель и Redis', () => {
    expect(resolveBotRuntimeMode('api')).toBe('api');
    expect(() => assertBotRuntimeMode('api', 'process', 'redis://localhost')).toThrow('WORKER_RUNTIME=remote');
    expect(() => assertBotRuntimeMode('api', 'remote', undefined)).toThrow('REDIS_URL');
    expect(() => assertBotRuntimeMode('api', 'remote', 'redis://localhost', '12')).toThrow('WORKER_RAILWAY_PROJECTS');
    assertBotRuntimeMode('api', 'remote', 'redis://localhost');
  });

  /** Отклоняет опечатки в режиме запуска. */
  it('отклоняет неизвестный режим', () => {
    expect(() => resolveBotRuntimeMode('runtime')).toThrow('BOT_RUNTIME_MODE');
  });
});
