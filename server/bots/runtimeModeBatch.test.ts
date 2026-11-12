/** @fileoverview Адресные проверки пакета настроек без подключения к базе. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateRuntimeModeBatch } from './runtimeModeBatch';

/** Сохранённая индивидуальная настройка тестового бота. */
const rows = [{ id: 7, key: 'BOT_POLLING_MODE', value: 'ondemand' }];

test('проверяет конечное сочетание независимо от порядка полей', () => {
  assert.equal(validateRuntimeModeBatch([
    { action: 'update', key: 'BOT_POLLING_MODE', value: 'direct' },
    { action: 'update', key: 'LAUNCH_MODE', value: 'webhook' },
  ], rows, 'polling'), true);
  assert.equal(validateRuntimeModeBatch([
    { action: 'update', key: 'BOT_POLLING_MODE', value: 'process' },
    { action: 'update', key: 'LAUNCH_MODE', value: 'polling' },
  ], [], 'webhook'), true);
});

test('отклоняет сон с вебхуком до применения остальных настроек', () => {
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'update', key: 'LOG_LEVEL', value: 'debug' },
    { action: 'update', key: 'LAUNCH_MODE', value: 'webhook' },
  ], rows, 'polling'), /polling/);
});

test('не разрешает неизвестный режим и изменение чужой переменной', () => {
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'create', key: 'BOT_POLLING_MODE', value: 'typo' },
  ], [], 'polling'));
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'delete', key: 'OTHER', id: 99 },
  ], rows, 'polling'), /не принадлежит/);
});

test('проверяет изменение по идентификатору и запрещает переименование режима', () => {
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'update', id: 7, value: 'bad' },
  ], rows, 'polling'));
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'update', id: 7, key: 'OTHER', value: 'direct' },
  ], rows, 'polling'), /переименовать/);
});

test('при удалении учитывает наследуемый режим и запрещает неоднозначный пакет', () => {
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'delete', id: 7 },
  ], rows, 'webhook', 'process'), /polling/);
  assert.throws(() => validateRuntimeModeBatch([
    { action: 'update', key: 'BOT_POLLING_MODE', value: 'direct' },
    { action: 'update', key: 'BOT_POLLING_MODE', value: 'process' },
  ], rows, 'polling'), /один раз/);
});
