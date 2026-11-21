/** @fileoverview Отказ по памяти завершает регистрацию без цикла пробуждений и допускает явный повтор. */
import { expect, it, vi } from 'vitest';
import { NodePollingDispatcher } from './dispatcher';
import type { DispatcherDependencies, PollingBot } from './dispatcherTypes';

/** Пропустить отложенное освобождение приёмника и публикацию ошибки. */
const settle = () => new Promise<void>(resolve => setImmediate(resolve));
/** Минимальная регистрация без настоящего токена или подключения к Telegram. */
const bot: PollingBot = { tokenId: 45, projectId: 12, token: 'test-only', botFile: 'test.py',
  env: {}, idleTimeout: 1, workerKey: '12', instance: 'qa' };

it('публикует единственный отказ до error и не повторяет старт по wake', async () => {
  const order: string[] = [];
  const pressure = Object.assign(new Error('Недостаточно памяти'), { code: 'memory_pressure' });
  const startChild = vi.fn<DispatcherDependencies['startChild']>(async () => { throw pressure; });
  const onError = vi.fn<NonNullable<DispatcherDependencies['onError']>>((_bot, error) => {
    expect(error).toBe(pressure); order.push('memory_pressure');
  });
  const dependencies: DispatcherDependencies = {
    hasPending: async () => true,
    receive: async (_bot, signal, _wake, ready) => {
      ready();
      await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true }));
    },
    startChild, onError,
    lifecycle: (_bot, state) => { order.push(state); },
  };
  const dispatcher = new NodePollingDispatcher(dependencies);
  await dispatcher.start(bot);
  await settle();
  for (let i = 0; i < 10; i++) dispatcher.wake(bot.tokenId);
  await settle();
  expect(startChild).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledTimes(1);
  expect(order).toEqual(['started', 'memory_pressure', 'error']);
  expect(dispatcher.counters()).toMatchObject({ registeredBots: 0, activeChildren: 0 });

  // Освобождение памяти не требует вечной блокировки бота после нового запроса пользователя.
  let finish!: () => void;
  const done = new Promise<void>(resolve => { finish = resolve; });
  startChild.mockImplementation(async () => ({ done, stop: async () => { finish(); } }));
  await dispatcher.start(bot);
  await settle();
  expect(startChild).toHaveBeenCalledTimes(2);
  expect(dispatcher.counters().registeredBots).toBe(1);
  await dispatcher.shutdown();
});
