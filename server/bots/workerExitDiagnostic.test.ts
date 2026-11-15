/** @fileoverview Проверка доверенного происхождения аварии общего обработчика и сообщений истории. */
import { describe, expect, it } from 'vitest';
import { HOST_CRASH_PREFIX, isInfrastructureHostCrash, resolveWorkerExitError } from './workerExitDiagnostic';

describe('диагностика завершения воркера', () => {
  const crash = `${HOST_CRASH_PREFIX}Общий обработчик завершился: code=null, signal=SIGKILL`;

  it('сохраняет подтверждённую причину общей аварии для восстановления', () => {
    expect(isInfrastructureHostCrash(crash, true)).toBe(true);
    expect(resolveWorkerExitError('error', crash, true)).toBe(crash);
    expect(resolveWorkerExitError('null', crash, true)).toBe(crash);
  });

  it('не принимает поддельный префикс из stderr за подтверждённую аварию процесса', () => {
    expect(isInfrastructureHostCrash(crash, false)).toBe(false);
    expect(resolveWorkerExitError('error', crash, false)).toMatch(/^Ошибка выполнения:/);
  });

  it('не классифицирует обычную ошибку бота как аварию инфраструктуры', () => {
    expect(isInfrastructureHostCrash('ValueError: неверное значение', true)).toBe(false);
    expect(resolveWorkerExitError('error', 'ValueError: неверное значение')).toBe('Ошибка выполнения: ValueError: неверное значение');
  });

  it('не приписывает штатной остановке старую причину аварии', () => {
    expect(resolveWorkerExitError('stopped', crash, true)).toBeNull();
    expect(resolveWorkerExitError(0, crash, true)).toBeNull();
  });

  it('не называет завершение работавшего процесса ошибкой запуска', () => {
    expect(resolveWorkerExitError('error', 'Ошибка бота: ошибка обработки')).toBe('Ошибка выполнения: ошибка обработки');
    expect(resolveWorkerExitError(137)).toBe('Бот завершился: 137');
  });
});
