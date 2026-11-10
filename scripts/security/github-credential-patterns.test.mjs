/** @fileoverview Проверяет обнаружение GitHub-токенов на искусственных данных. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { credentialLines } from './github-credential-patterns.mjs';

test('находит классический и детализированный токены по номеру строки', () => {
  const classic = ['gh', 'p_'].join('') + 'x'.repeat(36);
  const granular = ['github', '_pat_'].join('') + 'y'.repeat(82);
  assert.deepEqual(credentialLines(`первая строка\n${classic}\r\n${granular}`), [2, 3]);
});

test('не считает переменные окружения и регулярные выражения секретами', () => {
  assert.deepEqual(credentialLines('process.env.GITHUB_TOKEN\n<YOUR_GITHUB_TOKEN>\ngh[pousr]_[A-Za-z0-9_]{30,}'), []);
});

test('возвращает номер строки один раз при нескольких секретах', () => {
  const token = ['gh', 's_'].join('') + 'z'.repeat(36);
  assert.deepEqual(credentialLines(`${token} ${token}`), [1]);
});
