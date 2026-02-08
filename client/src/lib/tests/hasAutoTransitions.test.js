import { strict as assert } from 'assert';
import { hasAutoTransitions } from '../utils/hasAutoTransitions';

/**
 * Тестирование функции hasAutoTransitions
 * 
 * Эта функция проверяет наличие автопереходов в узлах бота.
 */
console.log('Running tests for hasAutoTransitions...');

// Тест 1: Пустой массив узлов
assert.strictEqual(hasAutoTransitions([]), false, 'Empty nodes array should return false');

// Тест 2: Узлы без автопереходов
const nodesWithoutAutoTransitions = [
  { id: '1', data: { messageText: 'Test' } },
  { id: '2', data: { command: '/help' } }
];
assert.strictEqual(hasAutoTransitions(nodesWithoutAutoTransitions), false, 'Nodes without auto transitions should return false');

// Тест 3: Узлы с автопереходами
const nodesWithAutoTransitions = [
  { id: '1', data: { enableAutoTransition: true, autoTransitionTo: '2' } },
  { id: '2', data: { messageText: 'Test' } }
];
assert.strictEqual(hasAutoTransitions(nodesWithAutoTransitions), true, 'Nodes with auto transitions should return true');

// Тест 4: Узлы с включенным автопереходом, но без целевого узла
const nodesWithAutoTransitionNoTarget = [
  { id: '1', data: { enableAutoTransition: true } }, // Нет autoTransitionTo
  { id: '2', data: { messageText: 'Test' } }
];
assert.strictEqual(hasAutoTransitions(nodesWithAutoTransitionNoTarget), false, 'Nodes with enabled auto transition but no target should return false');

// Тест 5: Узлы с выключенным автопереходом
const nodesWithDisabledAutoTransition = [
  { id: '1', data: { enableAutoTransition: false, autoTransitionTo: '2' } },
  { id: '2', data: { messageText: 'Test' } }
];
assert.strictEqual(hasAutoTransitions(nodesWithDisabledAutoTransition), false, 'Nodes with disabled auto transition should return false');

// Тест 6: Смешанные узлы (с и без автопереходов)
const mixedNodes = [
  { id: '1', data: { messageText: 'Test' } },
  { id: '2', data: { enableAutoTransition: true, autoTransitionTo: '1' } }
];
assert.strictEqual(hasAutoTransitions(mixedNodes), true, 'Mixed nodes with at least one auto transition should return true');

// Тест 7: Узлы с автопереходом и целевым узлом
const nodesWithValidAutoTransition = [
  { id: '1', data: { messageText: 'Test' } },
  { id: '2', data: { enableAutoTransition: true, autoTransitionTo: '1' } },
  { id: '3', data: { command: '/help' } }
];
assert.strictEqual(hasAutoTransitions(nodesWithValidAutoTransition), true, 'Nodes with valid auto transition should return true');

console.log('All tests for hasAutoTransitions passed!');