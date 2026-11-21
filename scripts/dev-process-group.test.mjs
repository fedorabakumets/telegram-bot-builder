/** @fileoverview Проверки жизненного цикла dev-группы на имитациях процессов без сети. */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { startDevProcessGroup } from './dev-process-group.mjs';

/** Создаёт полностью поддельные процессы и фиксирует порядок управления ими. */
function fixture(ready = true) {
  const children = [], events = [];
  let callback;
  const group = startDevProcessGroup({
    services: ['broker', 'api', 'runtime', 'frontend'].map(name => ({ name, command: name, args: [], env: {} })),
    root: '/workspace', env: {}, platform: 'win32',
    spawnProcess(command, args, options) {
      const child = new EventEmitter();
      child.pid = children.length + 10;
      child.stdin = new EventEmitter();
      child.stdin.end = value => events.push(['stdin', command, value]);
      child.stdout = new EventEmitter();
      child.options = options;
      children.push(child);
      return child;
    },
    killWindows(command, args) { events.push(['kill', command, args]); },
    setTimer(action, delay) { callback = action; events.push(['deadline', delay]); return 1; },
    clearTimer() { events.push(['clear']); },
    onExitCode(code) { events.push(['exitCode', code]); },
    forceExit(code) { events.push(['forceExit', code]); },
    report(message) { events.push(['report', message]); },
    forwardOutput() {},
  });
  if (ready) {
    children[0].stdout.emit('data', Buffer.from('TELETHON_BROKER_READY\n'));
    events.length = 0;
  }
  return { group, children, events, expire: () => callback() };
}

test('Штатная остановка завершает потребителей перед stdin-командой брокеру', () => {
  const { group, children, events } = fixture();
  assert.equal(children[0].options.env.TELETHON_BROKER_STDIN_CONTROL, '1');
  assert.deepEqual(children[0].options.stdio, ['pipe', 'pipe', 'inherit']);
  group.stop();
  assert.equal(events.filter(event => event[0] === 'kill').length, 3);
  assert.deepEqual(events[4], ['stdin', 'broker', 'shutdown\n']);
  assert.deepEqual(events[5], ['deadline', 75000]);
  children.forEach(child => child.emit('exit', 0));
  assert.deepEqual(events.at(-1), ['clear']);
  group.stop();
  assert.equal(events.filter(event => event[0] === 'stdin').length, 1);
});

test('API и runtime ждут маркера успешного запуска брокера', () => {
  const { children } = fixture(false);
  assert.equal(children.length, 1);
  children[0].stdout.emit('data', Buffer.from('Служебный журнал\nTELETHON_BROKER_'));
  assert.equal(children.length, 1);
  children[0].stdout.emit('data', Buffer.from('READY\n'));
  assert.equal(children.length, 4);
  children[0].stdout.emit('data', Buffer.from('TELETHON_BROKER_READY\n'));
  assert.equal(children.length, 4);
});

test('Ошибка ownership или раннее завершение брокера не запускает потребителей', () => {
  const { children, events } = fixture(false);
  children[0].emit('exit', 1);
  children[0].stdout.emit('data', Buffer.from('TELETHON_BROKER_READY\n'));
  assert.equal(children.length, 1);
  assert.deepEqual(events.find(event => event[0] === 'exitCode'), ['exitCode', 1]);
});

test('Таймаут готовности брокера не запускает API и runtime', () => {
  const { children, expire, events } = fixture(false);
  expire();
  assert.equal(children.length, 1);
  assert.ok(events.some(event => event[0] === 'report' && event[1].includes('не подтвердил готовность')));
});

test('Падение сервиса останавливает соседей и не убивает брокер до таймаута', () => {
  const { children, events, expire } = fixture();
  children[2].emit('exit', 2);
  assert.deepEqual(events.find(event => event[0] === 'exitCode'), ['exitCode', 2]);
  assert.equal(events.filter(event => event[0] === 'kill').length, 2);
  expire();
  assert.equal(events.filter(event => event[0] === 'kill').length, 5);
  assert.deepEqual(events.at(-1), ['forceExit', 2]);
});
