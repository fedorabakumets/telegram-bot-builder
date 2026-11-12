/** @fileoverview Проверка отличия унаследованных значений от явно сохранённых настроек воркеров. */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toWorkerFieldView } from './runtime-worker-view';

/** Поле режима без внешних зависимостей. */
const mode = { env: 'BOT_POLLING_MODE', label: 'Режим', kind: 'text' as const };
describe('источник настроек воркеров', () => {
  it('по умолчанию показывает ноль как отсутствие ограничения', () => {
    const field = { env: 'BOT_ON_DEMAND_MAX_ACTIVE', label: 'Лимит', kind: 'number' as const };
    assert.equal(toWorkerFieldView(field, undefined, {}).effectiveValue, '0');
    assert.equal(toWorkerFieldView(field, '4', {}).effectiveValue, '4');
  });
  it('наследование оставляет сохранённое значение пустым и показывает эффективное отдельно', () => {
    const data = toWorkerFieldView(mode, undefined, { BOT_POLLING_MODE: 'process' });
    assert.equal(data.savedValue, '');
    assert.equal(data.effectiveValue, 'process');
    assert.equal(data.source, 'environment');
  });
  it('сохранённое значение перекрывает окружение, сброс возвращает наследование', () => {
    const env = { BOT_POLLING_MODE: 'process' };
    const saved = toWorkerFieldView(mode, ' ondemand ', env);
    assert.equal(saved.savedValue, 'ondemand');
    assert.equal(saved.effectiveValue, 'ondemand');
    assert.equal(saved.source, 'database');
    const reset = toWorkerFieldView(mode, '', env);
    assert.equal(reset.savedValue, '');
    assert.equal(reset.effectiveValue, 'process');
    assert.equal(reset.source, 'environment');
  });
  it('без окружения показывает встроенные тридцать секунд без их сохранения', () => {
    const data = toWorkerFieldView({ env: 'BOT_ON_DEMAND_IDLE_SECONDS', label: 'Простой', kind: 'number' }, undefined, {});
    assert.equal(data.savedValue, '');
    assert.equal(data.effectiveValue, '30');
    assert.equal(data.source, 'default');
  });
  it('секрет никогда не попадает ни в сохранённое, ни в эффективное значение', () => {
    const data = toWorkerFieldView({ env: 'SECRET', label: 'Секрет', kind: 'secret' }, 'secret-db', { SECRET: 'secret-env' });
    assert.equal(data.value, '');
    assert.equal(data.savedValue, '');
    assert.equal(data.effectiveValue, '');
    assert.ok(!JSON.stringify(data).includes('secret-db'));
    assert.ok(!JSON.stringify(data).includes('secret-env'));
  });
});
