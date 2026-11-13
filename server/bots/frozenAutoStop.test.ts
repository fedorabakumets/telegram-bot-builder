/** @fileoverview Проверки отложенной остановки ограниченного запуска без загрузки БД. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createFrozenStopConfirmation, createFrozenAutoStop, type FrozenStopDependencies } from './frozenAutoStop';

/** Создаёт управляемую очередь и зависимости без реального процесса бота. */
function fixture() {
  let launch = 8;
  const deferred: Array<() => void> = [];
  const events: string[] = [];
  const deps: FrozenStopDependencies = {
    currentLaunch: () => launch, defer: (task) => { deferred.push(task); },
    persistStop: async () => { events.push('persist'); return 8; },
    stop: async () => { events.push('stop'); }, report: () => { events.push('error'); },
  };
  return { deps, deferred, events, setLaunch: (value: number) => { launch = value; } };
}
/** Пропускает завершение цепочки промисов отложенной задачи. */
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));

test('лог не ждёт остановку, повторные ошибки одного запуска объединяются', async () => {
  const state = fixture(); const schedule = createFrozenAutoStop(state.deps);
  const request = { projectId: 1, tokenId: 2, launchId: 8 };
  schedule(request); schedule(request);
  assert.deepEqual(state.events, []); assert.equal(state.deferred.length, 1);
  state.deferred[0]!(); await settle();
  assert.deepEqual(state.events, ['persist', 'stop']);
});

test('старый запуск не изменяет намерение нового бота', async () => {
  const state = fixture(); const schedule = createFrozenAutoStop(state.deps);
  schedule({ projectId: 1, tokenId: 2, launchId: 7 });
  assert.equal(state.deferred.length, 0);
  schedule({ projectId: 1, tokenId: 2, launchId: 8 });
  state.setLaunch(9); state.deferred[0]!(); await settle();
  assert.deepEqual(state.events, []);
});

test('новое намерение или отказ записи не вызывает остановку', async () => {
  const state = fixture(); state.deps.persistStop = async () => false;
  createFrozenAutoStop(state.deps)({ projectId: 1, tokenId: 2, launchId: 8 });
  state.deferred[0]!(); await settle(); assert.deepEqual(state.events, []);
});

test('смена запуска после записи не останавливает новый процесс', async () => {
  const state = fixture(); state.deps.persistStop = async () => { state.setLaunch(9); return 8; };
  createFrozenAutoStop(state.deps)({ projectId: 1, tokenId: 2, launchId: 8 });
  state.deferred[0]!(); await settle(); assert.deepEqual(state.events, []);
});

/** Проверяет сохранение намерения до выхода процесса без ожидания stop ACK. */
test('барьер ждёт только запись, остановка остаётся отложенной', async () => {
  const state = fixture(); let complete!: (value: number | false) => void;
  state.deps.persistStop = () => new Promise<number | false>((resolve) => { complete = resolve; });
  state.deps.stop = () => new Promise<void>(() => undefined);
  const confirm = createFrozenStopConfirmation(state.deps);
  const result = confirm({ projectId: 1, tokenId: 2, launchId: 8, expectedToken: '111:test' });
  assert.equal(state.deferred.length, 0);
  complete(8); assert.equal(await result, true);
  assert.equal(state.deferred.length, 1);
});

test('ограничение одного бота не останавливает соседний запуск', async () => {
  const launches = new Map([[2, 8], [3, 9]]);
  const state = fixture(); state.deps.currentLaunch = (id) => launches.get(id);
  const observed: number[] = [];
  state.deps.persistStop = async (request) => { observed.push(request.tokenId); return 8; };
  const confirm = createFrozenStopConfirmation(state.deps);
  assert.equal(await confirm({ projectId: 1, tokenId: 2, launchId: 8 }), true);
  state.deferred[0]!(); await settle();
  assert.deepEqual(observed, [2]); assert.equal(launches.get(3), 9);
});

test('ручная остановка между барьером и отложенным stop отменяет повторную команду', async () => {
  const state = fixture(); const confirm = createFrozenStopConfirmation(state.deps);
  assert.equal(await confirm({ projectId: 1, tokenId: 2, launchId: 8 }), true);
  state.setLaunch(0); state.deferred[0]!(); await settle();
  assert.deepEqual(state.events, ['persist']);
});

/** Повторы подтверждения до stop ACK не порождают новые версии намерения. */
test('повтор подтверждения до stop ACK использует одну запись и одну команду', async () => {
  const state = fixture(); let finish!: () => void;
  state.deps.stop = () => new Promise<void>((resolve) => { finish = resolve; });
  const confirm = createFrozenStopConfirmation(state.deps);
  const request = { projectId: 1, tokenId: 2, launchId: 8 };
  assert.equal(await confirm(request), true);
  assert.equal(await confirm(request), true);
  assert.deepEqual(state.events, ['persist']); assert.equal(state.deferred.length, 1);
  state.deferred[0]!(); await settle();
  assert.equal(await confirm(request), true); assert.deepEqual(state.events, ['persist']);
  finish(); await settle();
});

/** Передаёт в stop исходную версию, чтобы новое намерение не получило старую команду. */
test('отложенная команда сохраняет исходную версию, а новое намерение её отвергает', async () => {
  const state = fixture(); let currentGeneration = 8; let stopped = false;
  state.deps.stop = async (request) => {
    assert.equal(request.expectedDesiredGeneration, 8);
    if (request.expectedDesiredGeneration === currentGeneration) stopped = true;
  };
  const confirm = createFrozenStopConfirmation(state.deps);
  assert.equal(await confirm({ projectId: 1, tokenId: 2, launchId: 8 }), true);
  currentGeneration = 9; state.deferred[0]!(); await settle();
  assert.equal(stopped, false);
});
