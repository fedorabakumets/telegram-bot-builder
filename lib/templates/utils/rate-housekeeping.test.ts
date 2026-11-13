/**
 * @fileoverview Проверка фоновой очистки счётчиков без новых сообщений и изменения TTL пользователей.
 */
import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';
import { generateUtils } from './utils-template.renderer';
import { validParamsDisabled } from './utils-template.fixture';
import { generateRateCounter } from '../rate-counter/rate-counter.renderer';
import { validParamsSingle } from '../rate-counter/rate-counter.fixture';

/** Выполняет сгенерированную очистку с управляемым временем без Telegram и реального ожидания. */
it('очищает просроченные ключи порциями каждую секунду, сохраняя события и пользовательский TTL', () => {
  const utils = generateUtils(validParamsDisabled);
  const cleanup = utils.slice(utils.indexOf('async def cleanup_user_data'), utils.indexOf('def get_user_variables'));
  const rates = generateRateCounter(validParamsSingle);
  const helper = rates.slice(0, rates.indexOf('# Обработчики узлов rate_counter'));
  const script = `import asyncio, logging, time
from collections import deque
from unittest.mock import patch
USER_DATA_TTL = 3600
_rate_counter_deques = {}
user_data = {1: {'saved': 'значение'}}
_user_last_seen = {1: -1.0}
${helper}
${cleanup}
for key in range(600):
    _rate_counter_deques[key] = deque([1.0])
    _rate_counter_windows[key] = 60.0
    _rate_counter_cleanup_keys.append(key)
_rate_counter_deques['fresh'] = deque([time.time()] * 10000)
_rate_counter_windows['fresh'] = 60000.0
_rate_counter_cleanup_keys.append('fresh')
clock = [0.0]
ticks = [1.0, 2.0, 3.0, 3600.0]
counts = []
async def sleep(delay):
    if not ticks:
        raise asyncio.CancelledError()
    assert delay == 1.0
    if clock[0] < 3600:
        assert user_data[1]['saved'] == 'значение'
    counts.append(len(_rate_counter_deques))
    clock[0] = ticks.pop(0)
async def run():
    try:
        await cleanup_user_data()
    except asyncio.CancelledError:
        pass
with patch('asyncio.sleep', sleep), patch('time.monotonic', lambda: clock[0]):
    asyncio.run(run())
assert counts == [601, 345, 89, 1], counts
assert list(_rate_counter_deques) == ['fresh']
assert len(_rate_counter_deques['fresh']) == 10000
assert not user_data and not _user_last_seen
`;
  expect(() => execFileSync('python', ['-c', script], { stdio: 'pipe' })).not.toThrow();
});
