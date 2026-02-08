import { strict as assert } from 'assert';
import { checkAutoTransition } from '../utils/checkAutoTransition';

/**
 * Тестирование функции checkAutoTransition
 * 
 * Эта функция проверяет, нужно ли выполнить автопереход из указанного узла.
 */
console.log('Running tests for checkAutoTransition...');

// Тест 1: Узел без автоперехода
const nodeWithoutAutoTransition = { id: '1', data: { messageText: 'Test' } };
const nodes1 = [nodeWithoutAutoTransition];
const result1 = checkAutoTransition(nodeWithoutAutoTransition, nodes1);
assert.strictEqual(result1.shouldTransition, false, 'Node without auto transition should return shouldTransition=false');

// Тест 2: Узел с автопереходом, но без целевого узла
const nodeWithAutoTransitionNoTarget = { id: '1', data: { enableAutoTransition: true, autoTransitionTo: '2' } };
const nodes2 = [nodeWithAutoTransitionNoTarget]; // Целевой узел '2' отсутствует
const result2 = checkAutoTransition(nodeWithAutoTransitionNoTarget, nodes2);
assert.strictEqual(result2.shouldTransition, false, 'Node with auto transition but no target should return shouldTransition=false');
assert.ok(result2.error, 'Node with auto transition but no target should return error message');
assert.ok(result2.error.includes('2'), 'Error message should include the missing target node ID');

// Тест 3: Узел с автопереходом и существующим целевым узлом
const nodeWithAutoTransition = { id: '1', data: { enableAutoTransition: true, autoTransitionTo: '2' } };
const targetNode = { id: '2', data: { messageText: 'Target' } };
const nodes3 = [nodeWithAutoTransition, targetNode];
const result3 = checkAutoTransition(nodeWithAutoTransition, nodes3);
assert.strictEqual(result3.shouldTransition, true, 'Node with auto transition and target should return shouldTransition=true');
assert.strictEqual(result3.targetNodeId, '2', 'Target node ID should be correct');
assert.deepStrictEqual(result3.targetNode, targetNode, 'Target node should be correct');

// Тест 4: Узел с автопереходом, но автопереход отключен
const nodeWithDisabledAutoTransition = { id: '1', data: { enableAutoTransition: false, autoTransitionTo: '2' } };
const nodes4 = [nodeWithDisabledAutoTransition, targetNode];
const result4 = checkAutoTransition(nodeWithDisabledAutoTransition, nodes4);
assert.strictEqual(result4.shouldTransition, false, 'Node with disabled auto transition should return shouldTransition=false');

// Тест 5: Узел с автопереходом, но без указанного целевого узла
const nodeWithAutoTransitionNoDestination = { id: '1', data: { enableAutoTransition: true } }; // Нет autoTransitionTo
const nodes5 = [nodeWithAutoTransitionNoDestination, targetNode];
const result5 = checkAutoTransition(nodeWithAutoTransitionNoDestination, nodes5);
assert.strictEqual(result5.shouldTransition, false, 'Node with auto transition but no destination should return shouldTransition=false');

console.log('All tests for checkAutoTransition passed!');