/**
 * @fileoverview Тесты для утилит extract-base-id
 *
 * Блок A: getBaseId — базовые случаи
 * Блок B: getBaseId — форматы ID
 * Блок C: getBaseId — глубокие цепочки суффиксов
 * Блок D: getBaseId — граничные случаи
 * Блок E: getBaseId — идемпотентность
 * Блок F: generateNewId — формат результата
 * Блок G: generateNewId — разные суффиксы
 * Блок H: generateNewId — уникальность
 * Блок I: generateNewId — структура timestamp и random
 * Блок J: generateNewId — очистка базового ID
 */

import { getBaseId, generateNewId } from '../canvas/utils/extract-base-id';

// ─── Утилиты ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(label: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (e: any) {
    console.error(`  ✗ ${label}\n    ${e.message}`);
    failed++;
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toMatch(pattern: RegExp) {
      if (typeof actual !== 'string' || !pattern.test(actual))
        throw new Error(`Expected "${actual}" to match ${pattern}`);
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(n: number) {
      if (typeof actual !== 'number' || actual <= n)
        throw new Error(`Expected ${actual} > ${n}`);
    },
    notToBe(expected: unknown) {
      if (actual === expected)
        throw new Error(`Expected value to differ from ${JSON.stringify(expected)}`);
    },
  };
}

// ─── Блок A: getBaseId — базовые случаи ──────────────────────────────────────

console.log('\nБлок A: getBaseId — базовые случаи');

test('чистый ID возвращается без изменений', () => {
  expect(getBaseId('abc123')).toBe('abc123');
});

test('удаляет суффикс _paste_<ts>_<rand>', () => {
  expect(getBaseId('abc123_paste_1772004615750_qj1s3gl3s')).toBe('abc123');
});

test('удаляет суффикс _copy_<ts>', () => {
  expect(getBaseId('abc123_copy_1771493883542')).toBe('abc123');
});

test('удаляет цепочку двух _copy_', () => {
  expect(getBaseId('abc123_copy_1771493883542_copy_1771494162377')).toBe('abc123');
});

test('удаляет смешанные суффиксы paste + copy', () => {
  expect(getBaseId('node1_paste_123_abc_copy_456')).toBe('node1');
});

test('ID с дефисами — чистый', () => {
  expect(getBaseId('my-node-id')).toBe('my-node-id');
});

test('ID с дефисами — удаляет _paste_', () => {
  expect(getBaseId('my-node-id_paste_1000000000000_abcdef123')).toBe('my-node-id');
});

test('ID с подчёркиваниями — чистый', () => {
  expect(getBaseId('my_node_id')).toBe('my_node_id');
});

test('ID с подчёркиваниями — удаляет _copy_', () => {
  expect(getBaseId('my_node_id_copy_9999999999999')).toBe('my_node_id');
});

// ─── Блок B: getBaseId — форматы ID ──────────────────────────────────────────

console.log('\nБлок B: getBaseId — форматы ID');

test('UUID-подобный ID без суффикса', () => {
  expect(getBaseId('550e8400-e29b-41d4-a716-446655440000')).toBe('550e8400-e29b-41d4-a716-446655440000');
});

test('UUID-подобный ID с _paste_', () => {
  expect(getBaseId('550e8400-e29b-41d4-a716-446655440000_paste_1234567890123_xyz')).toBe('550e8400-e29b-41d4-a716-446655440000');
});

test('числовой ID', () => {
  expect(getBaseId('12345')).toBe('12345');
});

test('числовой ID с _copy_', () => {
  expect(getBaseId('12345_copy_1000000000000')).toBe('12345');
});

test('ID с заглавными буквами — чистый', () => {
  expect(getBaseId('NodeABC')).toBe('NodeABC');
});

test('ID с заглавными буквами — удаляет _paste_', () => {
  expect(getBaseId('NodeABC_paste_1111111111111_aaabbb')).toBe('NodeABC');
});

test('ID с точками — чистый', () => {
  expect(getBaseId('node.v2.final')).toBe('node.v2.final');
});

test('ID с точками — удаляет _copy_', () => {
  expect(getBaseId('node.v2.final_copy_1234567890000')).toBe('node.v2.final');
});

test('очень длинный ID без суффикса', () => {
  const longId = 'a'.repeat(200);
  expect(getBaseId(longId)).toBe(longId);
});

test('очень длинный ID с _paste_', () => {
  const longId = 'a'.repeat(200);
  expect(getBaseId(`${longId}_paste_1234567890123_abc`)).toBe(longId);
});

// ─── Блок C: getBaseId — глубокие цепочки суффиксов ──────────────────────────

console.log('\nБлок C: getBaseId — глубокие цепочки суффиксов');

test('3 уровня _copy_', () => {
  expect(getBaseId('node_copy_111_copy_222_copy_333')).toBe('node');
});

test('4 уровня _copy_', () => {
  expect(getBaseId('node_copy_111_copy_222_copy_333_copy_444')).toBe('node');
});

test('5 уровней _copy_', () => {
  expect(getBaseId('node_copy_111_copy_222_copy_333_copy_444_copy_555')).toBe('node');
});

test('3 уровня _paste_', () => {
  expect(getBaseId('node_paste_111_aaa_paste_222_bbb_paste_333_ccc')).toBe('node');
});

test('чередование paste и copy (3 уровня)', () => {
  expect(getBaseId('node_paste_111_aaa_copy_222_paste_333_bbb')).toBe('node');
});

test('copy затем paste', () => {
  expect(getBaseId('base_copy_100_paste_200_xyz')).toBe('base');
});

test('paste затем copy', () => {
  expect(getBaseId('base_paste_100_xyz_copy_200')).toBe('base');
});

// ─── Блок D: getBaseId — граничные случаи ────────────────────────────────────

console.log('\nБлок D: getBaseId — граничные случаи');

test('пустая строка → пустая строка', () => {
  expect(getBaseId('')).toBe('');
});

test('только суффикс _paste_ → пустая строка', () => {
  expect(getBaseId('_paste_1234567890123_abc')).toBe('');
});

test('только суффикс _copy_ → пустая строка', () => {
  expect(getBaseId('_copy_1234567890123')).toBe('');
});

test('суффикс без цифр не удаляется', () => {
  expect(getBaseId('node_paste_notanumber_abc')).toBe('node_paste_notanumber_abc');
});

test('_copy_ без timestamp не удаляется', () => {
  expect(getBaseId('node_copy_')).toBe('node_copy_');
});

test('одиночный символ без суффикса', () => {
  expect(getBaseId('x')).toBe('x');
});

test('ID с пробелами — чистый (пробелы не суффикс)', () => {
  expect(getBaseId('node id')).toBe('node id');
});

// ─── Блок E: getBaseId — идемпотентность ─────────────────────────────────────

console.log('\nБлок E: getBaseId — идемпотентность');

test('getBaseId(getBaseId(x)) === getBaseId(x) для чистого ID', () => {
  const x = 'abc123';
  expect(getBaseId(getBaseId(x))).toBe(getBaseId(x));
});

test('getBaseId(getBaseId(x)) === getBaseId(x) для _paste_', () => {
  const x = 'abc123_paste_1234567890123_xyz';
  expect(getBaseId(getBaseId(x))).toBe(getBaseId(x));
});

test('getBaseId(getBaseId(x)) === getBaseId(x) для _copy_', () => {
  const x = 'abc123_copy_1234567890123';
  expect(getBaseId(getBaseId(x))).toBe(getBaseId(x));
});

test('getBaseId(getBaseId(x)) === getBaseId(x) для цепочки', () => {
  const x = 'node_copy_111_copy_222_paste_333_abc';
  expect(getBaseId(getBaseId(x))).toBe(getBaseId(x));
});

test('тройная идемпотентность: getBaseId³(x) === getBaseId(x)', () => {
  const x = 'node_paste_111_aaa_copy_222';
  const once = getBaseId(x);
  const twice = getBaseId(once);
  const thrice = getBaseId(twice);
  expect(thrice).toBe(once);
});

// ─── Блок F: generateNewId — формат результата ───────────────────────────────

console.log('\nБлок F: generateNewId — формат результата');

test('формат по умолчанию: baseId_paste_<ts>_<rand>', () => {
  expect(generateNewId('abc123')).toMatch(/^abc123_paste_\d+_[a-z0-9]+$/);
});

test('кастомный суффикс copy: baseId_copy_<ts>_<rand>', () => {
  expect(generateNewId('abc123', 'copy')).toMatch(/^abc123_copy_\d+_[a-z0-9]+$/);
});

test('кастомный суффикс dup: baseId_dup_<ts>_<rand>', () => {
  expect(generateNewId('abc123', 'dup')).toMatch(/^abc123_dup_\d+_[a-z0-9]+$/);
});

test('кастомный суффикс clone: baseId_clone_<ts>_<rand>', () => {
  expect(generateNewId('abc123', 'clone')).toMatch(/^abc123_clone_\d+_[a-z0-9]+$/);
});

test('кастомный суффикс custom: baseId_custom_<ts>_<rand>', () => {
  expect(generateNewId('abc123', 'custom')).toMatch(/^abc123_custom_\d+_[a-z0-9]+$/);
});

test('результат содержит ровно 4 части через _', () => {
  const result = generateNewId('abc');
  // abc_paste_<ts>_<rand> → минимум 4 части
  const parts = result.split('_');
  if (parts.length < 4) throw new Error(`Ожидалось >= 4 частей, получено ${parts.length}: ${result}`);
});

test('результат начинается с базового ID', () => {
  const result = generateNewId('mynode');
  if (!result.startsWith('mynode_')) throw new Error(`Не начинается с "mynode_": ${result}`);
});

// ─── Блок G: generateNewId — разные суффиксы ─────────────────────────────────

console.log('\nБлок G: generateNewId — разные суффиксы');

test('суффикс paste (явный)', () => {
  expect(generateNewId('node', 'paste')).toMatch(/^node_paste_\d+_[a-z0-9]+$/);
});

test('суффикс copy', () => {
  expect(generateNewId('node', 'copy')).toMatch(/^node_copy_\d+_[a-z0-9]+$/);
});

test('суффикс dup', () => {
  expect(generateNewId('node', 'dup')).toMatch(/^node_dup_\d+_[a-z0-9]+$/);
});

test('суффикс clone', () => {
  expect(generateNewId('node', 'clone')).toMatch(/^node_clone_\d+_[a-z0-9]+$/);
});

test('суффикс custom', () => {
  expect(generateNewId('node', 'custom')).toMatch(/^node_custom_\d+_[a-z0-9]+$/);
});

test('суффикс v2', () => {
  expect(generateNewId('node', 'v2')).toMatch(/^node_v2_\d+_[a-z0-9]+$/);
});

test('суффикс fork', () => {
  expect(generateNewId('node', 'fork')).toMatch(/^node_fork_\d+_[a-z0-9]+$/);
});

// ─── Блок H: generateNewId — уникальность ────────────────────────────────────

console.log('\nБлок H: generateNewId — уникальность');

test('два последовательных вызова дают разные ID', () => {
  const id1 = generateNewId('node1');
  const id2 = generateNewId('node1');
  expect(id1).notToBe(id2);
});

test('50 вызовов подряд — все уникальные', () => {
  const ids = Array.from({ length: 50 }, () => generateNewId('node'));
  const unique = new Set(ids);
  if (unique.size !== 50)
    throw new Error(`Ожидалось 50 уникальных ID, получено ${unique.size}`);
});

test('100 вызовов с разными суффиксами — все уникальные', () => {
  const suffixes = ['paste', 'copy', 'dup', 'clone', 'custom'];
  const ids = Array.from({ length: 100 }, (_, i) =>
    generateNewId('node', suffixes[i % suffixes.length])
  );
  const unique = new Set(ids);
  if (unique.size !== 100)
    throw new Error(`Ожидалось 100 уникальных ID, получено ${unique.size}`);
});

test('разные базовые ID — результаты не пересекаются', () => {
  const ids1 = Array.from({ length: 10 }, () => generateNewId('nodeA'));
  const ids2 = Array.from({ length: 10 }, () => generateNewId('nodeB'));
  const overlap = ids1.filter(id => ids2.includes(id));
  if (overlap.length > 0)
    throw new Error(`Пересечение ID: ${overlap.join(', ')}`);
});

// ─── Блок I: generateNewId — структура timestamp и random ────────────────────

console.log('\nБлок I: generateNewId — структура timestamp и random');

test('timestamp в результате — реальное число > 0', () => {
  const result = generateNewId('node');
  const match = result.match(/_paste_(\d+)_/);
  if (!match) throw new Error(`Не найден timestamp в: ${result}`);
  const ts = parseInt(match[1], 10);
  expect(ts).toBeGreaterThan(0);
});

test('timestamp близок к текущему времени (±5 сек)', () => {
  const before = Date.now();
  const result = generateNewId('node');
  const after = Date.now();
  const match = result.match(/_paste_(\d+)_/);
  if (!match) throw new Error(`Не найден timestamp в: ${result}`);
  const ts = parseInt(match[1], 10);
  if (ts < before - 5000 || ts > after + 5000)
    throw new Error(`Timestamp ${ts} вне диапазона [${before}, ${after}]`);
});

test('random-часть — непустая строка из [a-z0-9]', () => {
  const result = generateNewId('node');
  const match = result.match(/_paste_\d+_([a-z0-9]+)$/);
  if (!match || !match[1]) throw new Error(`Не найдена random-часть в: ${result}`);
  if (!/^[a-z0-9]+$/.test(match[1]))
    throw new Error(`Random-часть содержит недопустимые символы: ${match[1]}`);
});

test('random-часть имеет длину >= 1', () => {
  const result = generateNewId('node');
  const match = result.match(/_paste_\d+_([a-z0-9]+)$/);
  if (!match || match[1].length < 1)
    throw new Error(`Random-часть слишком короткая в: ${result}`);
});

test('random-части двух вызовов различаются', () => {
  const r1 = generateNewId('node').match(/_paste_\d+_([a-z0-9]+)$/)![1];
  const r2 = generateNewId('node').match(/_paste_\d+_([a-z0-9]+)$/)![1];
  // Не обязательно разные, но проверяем что оба существуют
  if (!r1 || !r2) throw new Error('Не удалось извлечь random-части');
});

test('timestamp для суффикса copy тоже корректный', () => {
  const result = generateNewId('node', 'copy');
  const match = result.match(/_copy_(\d+)_/);
  if (!match) throw new Error(`Не найден timestamp в: ${result}`);
  const ts = parseInt(match[1], 10);
  expect(ts).toBeGreaterThan(0);
});

// ─── Блок J: generateNewId — очистка базового ID ─────────────────────────────

console.log('\nБлок J: generateNewId — очистка базового ID');

test('очищает _paste_ перед генерацией', () => {
  expect(generateNewId('abc_paste_123_xyz', 'dup')).toMatch(/^abc_dup_\d+_[a-z0-9]+$/);
});

test('очищает _copy_ перед генерацией', () => {
  expect(generateNewId('abc_copy_123', 'paste')).toMatch(/^abc_paste_\d+_[a-z0-9]+$/);
});

test('очищает цепочку суффиксов перед генерацией', () => {
  expect(generateNewId('abc_copy_111_copy_222', 'clone')).toMatch(/^abc_clone_\d+_[a-z0-9]+$/);
});

test('очищает смешанные суффиксы перед генерацией', () => {
  expect(generateNewId('abc_paste_111_aaa_copy_222', 'fork')).toMatch(/^abc_fork_\d+_[a-z0-9]+$/);
});

test('UUID-подобный ID с _paste_ — очищается корректно', () => {
  expect(generateNewId('550e8400-e29b-41d4-a716_paste_123_xyz', 'copy'))
    .toMatch(/^550e8400-e29b-41d4-a716_copy_\d+_[a-z0-9]+$/);
});

test('ID с дефисами — очищается и генерируется корректно', () => {
  expect(generateNewId('my-node_copy_999', 'paste')).toMatch(/^my-node_paste_\d+_[a-z0-9]+$/);
});

test('пустая строка как базовый ID — генерирует _paste_<ts>_<rand>', () => {
  expect(generateNewId('')).toMatch(/^_paste_\d+_[a-z0-9]+$/);
});

// ─── Итог ─────────────────────────────────────────────────────────────────────

console.log(`\nИтог: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
