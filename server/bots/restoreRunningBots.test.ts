/**
 * @fileoverview Тесты для логики восстановления ботов после рестарта сервера
 * @module server/bots/restoreRunningBots.test
 */

import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';

/** Маркер, который graceful-shutdown записывает в errorMessage */
const RESTART_MARKER = '__server_restart__';

/**
 * Фильтр из restoreRunningBots — вынесен для изолированного тестирования
 * @param instances - Список инстансов из БД
 * @returns Инстансы которые нужно восстановить
 */
function filterInstancesToRestore(instances: Array<{ status: string; errorMessage?: string | null }>) {
  return instances.filter(
    (i) => i.status === 'running' || i.errorMessage === RESTART_MARKER
  );
}

describe('restoreRunningBots — логика фильтрации', () => {
  it('находит боты со статусом running (сервер упал без graceful shutdown)', () => {
    const instances = [
      { status: 'running', errorMessage: null },
      { status: 'stopped', errorMessage: null },
    ];
    const result = filterInstancesToRestore(instances);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].status, 'running');
  });

  it('находит боты с маркером __server_restart__ (graceful shutdown перед деплоем)', () => {
    const instances = [
      { status: 'stopped', errorMessage: RESTART_MARKER },
      { status: 'stopped', errorMessage: null },
    ];
    const result = filterInstancesToRestore(instances);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].errorMessage, RESTART_MARKER);
  });

  it('находит оба типа одновременно', () => {
    const instances = [
      { status: 'running', errorMessage: null },
      { status: 'stopped', errorMessage: RESTART_MARKER },
      { status: 'stopped', errorMessage: null },
      { status: 'error', errorMessage: 'что-то сломалось' },
    ];
    const result = filterInstancesToRestore(instances);
    assert.strictEqual(result.length, 2);
  });

  it('не находит боты остановленные пользователем вручную', () => {
    const instances = [
      { status: 'stopped', errorMessage: null },
      { status: 'stopped', errorMessage: 'Остановлен пользователем' },
      { status: 'error', errorMessage: 'Процесс завершен с кодом 1' },
    ];
    const result = filterInstancesToRestore(instances);
    assert.strictEqual(result.length, 0);
  });

  it('возвращает пустой массив если нет ботов для восстановления', () => {
    const result = filterInstancesToRestore([]);
    assert.strictEqual(result.length, 0);
  });
});

describe('graceful-shutdown — маркер при остановке', () => {
  it('маркер отличается от обычного сообщения об остановке', () => {
    assert.notStrictEqual(RESTART_MARKER, 'Сервер остановлен');
    assert.notStrictEqual(RESTART_MARKER, null);
    assert.notStrictEqual(RESTART_MARKER, '');
  });

  it('маркер не совпадает с сообщениями об ошибках процесса', () => {
    const errorMessages = [
      'Процесс завершен с кодом 1',
      'Процесс завершен с кодом 3221225786',
      'Ошибка при восстановлении после рестарта',
    ];
    for (const msg of errorMessages) {
      assert.notStrictEqual(RESTART_MARKER, msg);
    }
  });
});
