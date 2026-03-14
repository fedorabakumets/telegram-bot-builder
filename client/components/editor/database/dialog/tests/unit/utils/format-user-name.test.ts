/**
 * @fileoverview Тесты для утилиты форматирования имени пользователя
 * Проверяет корректность объединения имени, фамилии и username
 * @module tests/unit/utils/format-user-name.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatUserName } from '../../../utils/format-user-name';

describe('formatUserName', () => {
  it('должен возвращать пустую строку для null', () => {
    const result = formatUserName(null);
    assert.strictEqual(result, '');
  });

  it('должен возвращать пустую строку для undefined', () => {
    const result = formatUserName(undefined);
    assert.strictEqual(result, '');
  });

  it('должен форматировать только имя', () => {
    const userData = {
      userId: 123,
      firstName: 'Иван',
      lastName: null,
      userName: null,
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'Иван');
  });

  it('должен форматировать имя и фамилию', () => {
    const userData = {
      userId: 123,
      firstName: 'Иван',
      lastName: 'Иванов',
      userName: null,
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'Иван Иванов');
  });

  it('должен форматировать имя, фамилию и username', () => {
    const userData = {
      userId: 123,
      firstName: 'Иван',
      lastName: 'Иванов',
      userName: 'ivanov',
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'Иван Иванов @ivanov');
  });

  it('должен форматировать только username', () => {
    const userData = {
      userId: 123,
      firstName: null,
      lastName: null,
      userName: 'ivanov',
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, '@ivanov');
  });

  it('должен возвращать ID если нет имени, фамилии и username', () => {
    const userData = {
      userId: 123,
      firstName: null,
      lastName: null,
      userName: null,
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'ID: 123');
  });

  it('должен форматировать только фамилию', () => {
    const userData = {
      userId: 123,
      firstName: null,
      lastName: 'Иванов',
      userName: null,
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'Иванов');
  });

  it('должен форматировать фамилию и username', () => {
    const userData = {
      userId: 123,
      firstName: null,
      lastName: 'Иванов',
      userName: 'ivanov',
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'Иванов @ivanov');
  });

  it('должен обрабатывать пустые строки как отсутствующие значения', () => {
    const userData = {
      userId: 123,
      firstName: '',
      lastName: '',
      userName: '',
    } as any;

    const result = formatUserName(userData);
    assert.strictEqual(result, 'ID: 123');
  });
});
