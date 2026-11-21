/** @fileoverview Проверки порядка остановки незавершённого runtime без процессов и Telegram. */
import { expect, it } from 'vitest';
import { createRunnerStartupCleanup } from './runner-startup-cleanup';

it('при ошибке запуска закрывает потребителей перед брокером и Redis', async () => {
  const cleanup = createRunnerStartupCleanup();
  const closed: string[] = [];
  for (const name of ['redis', 'lease', 'broker', 'workers', 'webhook', 'commands']) {
    cleanup.add(async () => { closed.push(name); });
  }
  await cleanup.close();
  await cleanup.close();
  expect(closed).toEqual(['commands', 'webhook', 'workers', 'broker', 'lease', 'redis']);
});

it('дожидается остановки потребителей и закрывает брокер даже при ошибке другого ресурса', async () => {
  const cleanup = createRunnerStartupCleanup();
  const closed: string[] = [];
  let finish!: () => void;
  cleanup.add(() => { closed.push('broker'); });
  cleanup.add(async () => { await new Promise<void>(resolve => { finish = resolve; }); closed.push('workers'); });
  cleanup.add(() => { throw new Error('Не удалось закрыть HTTP'); });
  const result = cleanup.close();
  expect(closed).toEqual([]);
  finish();
  await expect(result).rejects.toThrow('Не все ресурсы исполнителя закрылись');
  expect(closed).toEqual(['workers', 'broker']);
});
