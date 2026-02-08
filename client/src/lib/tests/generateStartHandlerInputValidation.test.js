import { strict as assert } from 'assert';
import { generateStartHandler } from '../CommandHandler/generateStartHandler';

/**
 * Тестирование функции generateStartHandler с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for generateStartHandler with various inputs...');

// Тест 1: Правильные входные данные
const validNode = { id: 'start1', data: { command: '/start', messageText: 'Welcome!' } };
const validResult = generateStartHandler(validNode, false);
assert.strictEqual(typeof validResult, 'string', 'Should return a string with valid input');
assert.ok(validResult.includes('start1'), 'Should include node ID in handler');
console.log('✓ Test 1 passed: Valid input handled correctly');

// Тест 2: null/undefined node
const nullNodeResult = generateStartHandler(null, false);
assert.strictEqual(typeof nullNodeResult, 'string', 'Should return a string with null node');
console.log('✓ Test 2 passed: Null node handled correctly');

const undefinedNodeResult = generateStartHandler(undefined, false);
assert.strictEqual(typeof undefinedNodeResult, 'string', 'Should return a string with undefined node');
console.log('✓ Test 3 passed: Undefined node handled correctly');

// Тест 4: null/undefined userDatabaseEnabled
const validWithNullDbResult = generateStartHandler(validNode, null);
assert.strictEqual(typeof validWithNullDbResult, 'string', 'Should handle null database flag');
console.log('✓ Test 4 passed: Null database flag handled correctly');

const validWithUndefinedDbResult = generateStartHandler(validNode, undefined);
assert.strictEqual(typeof validWithUndefinedDbResult, 'string', 'Should handle undefined database flag');
console.log('✓ Test 5 passed: Undefined database flag handled correctly');

// Тест 6: Проверка с неполными данными узла
const incompleteNode = { id: 'start2' }; // Только ID, без data
const incompleteResult = generateStartHandler(incompleteNode, false);
assert.strictEqual(typeof incompleteResult, 'string', 'Should handle incomplete node data');
console.log('✓ Test 6 passed: Incomplete node data handled correctly');

// Тест 7: Проверка с неправильными типами данных узла
const wrongTypesNode = {
  id: 123, // Числовой ID
  data: 'not_an_object' // Строка вместо объекта
};
const wrongTypesResult = generateStartHandler(wrongTypesNode, false);
assert.strictEqual(typeof wrongTypesResult, 'string', 'Should handle wrong data types');
console.log('✓ Test 7 passed: Wrong data types handled correctly');

// Тест 8: Проверка с неправильным значением userDatabaseEnabled
const validWithWrongDbType = generateStartHandler(validNode, 'true'); // Строка вместо boolean
assert.strictEqual(typeof validWithWrongDbType, 'string', 'Should handle non-boolean database flag');
console.log('✓ Test 8 passed: Non-boolean database flag handled correctly');

// Тест 9: Проверка с узлом, у которого data - null
const nodeWithNullData = { id: 'start3', data: null };
const nullDataResult = generateStartHandler(nodeWithNullData, false);
assert.strictEqual(typeof nullDataResult, 'string', 'Should handle node with null data');
console.log('✓ Test 9 passed: Null data handled correctly');

// Тест 10: Проверка с узлом, у которого data - undefined
const nodeWithUndefinedData = { id: 'start4', data: undefined };
const undefinedDataResult = generateStartHandler(nodeWithUndefinedData, false);
assert.strictEqual(typeof undefinedDataResult, 'string', 'Should handle node with undefined data');
console.log('✓ Test 10 passed: Undefined data handled correctly');

// Тест 11: Проверка с узлом, у которого data - пустой объект
const nodeWithEmptyData = { id: 'start5', data: {} };
const emptyDataResult = generateStartHandler(nodeWithEmptyData, false);
assert.strictEqual(typeof emptyDataResult, 'string', 'Should handle node with empty data');
console.log('✓ Test 11 passed: Empty data handled correctly');

// Тест 12: Проверка с узлом, у которого id - пустая строка
const nodeWithEmptyId = { id: '', data: { command: '/start', messageText: 'Welcome!' } };
const emptyIdResult = generateStartHandler(nodeWithEmptyId, false);
assert.strictEqual(typeof emptyIdResult, 'string', 'Should handle node with empty ID');
console.log('✓ Test 12 passed: Empty ID handled correctly');

// Тест 13: Проверка с узлом, у которого id - null
const nodeWithNullId = { id: null, data: { command: '/start', messageText: 'Welcome!' } };
const nullIdResult = generateStartHandler(nodeWithNullId, false);
assert.strictEqual(typeof nullIdResult, 'string', 'Should handle node with null ID');
console.log('✓ Test 13 passed: Null ID handled correctly');

// Тест 14: Проверка с узлом, у которого id - undefined
const nodeWithUndefinedId = { id: undefined, data: { command: '/start', messageText: 'Welcome!' } };
const undefinedIdResult = generateStartHandler(nodeWithUndefinedId, false);
assert.strictEqual(typeof undefinedIdResult, 'string', 'Should handle node with undefined ID');
console.log('✓ Test 14 passed: Undefined ID handled correctly');

// Тест 15: Проверка с узлом, у которого нет поля id
const nodeWithoutId = { data: { command: '/start', messageText: 'Welcome!' } };
const withoutIdResult = generateStartHandler(nodeWithoutId, false);
assert.strictEqual(typeof withoutIdResult, 'string', 'Should handle node without ID');
console.log('✓ Test 15 passed: Missing ID handled correctly');

// Тест 16: Проверка с узлом, у которого нет поля data
const nodeWithoutData = { id: 'start6' };
const withoutDataResult = generateStartHandler(nodeWithoutData, false);
assert.strictEqual(typeof withoutDataResult, 'string', 'Should handle node without data');
console.log('✓ Test 16 passed: Missing data handled correctly');

// Тест 17: Проверка с узлом, у которого поля - числа
const nodeWithNumberFields = { id: 456, data: 789 };
const numberFieldsResult = generateStartHandler(nodeWithNumberFields, false);
assert.strictEqual(typeof numberFieldsResult, 'string', 'Should handle node with number fields');
console.log('✓ Test 17 passed: Number fields handled correctly');

// Тест 18: Проверка с узлом, у которого поля - массивы
const nodeWithArrayFields = { id: ['id1', 'id2'], data: ['data1', 'data2'] };
const arrayFieldsResult = generateStartHandler(nodeWithArrayFields, false);
assert.strictEqual(typeof arrayFieldsResult, 'string', 'Should handle node with array fields');
console.log('✓ Test 18 passed: Array fields handled correctly');

// Тест 19: Проверка с узлом, у которого поля - boolean
const nodeWithBooleanFields = { id: true, data: false };
const booleanFieldsResult = generateStartHandler(nodeWithBooleanFields, false);
assert.strictEqual(typeof booleanFieldsResult, 'string', 'Should handle node with boolean fields');
console.log('✓ Test 19 passed: Boolean fields handled correctly');

// Тест 20: Проверка с разными значениями userDatabaseEnabled
const trueDbResult = generateStartHandler(validNode, true);
const falseDbResult = generateStartHandler(validNode, false);
const zeroDbResult = generateStartHandler(validNode, 0);
const oneDbResult = generateStartHandler(validNode, 1);
const emptyStringDbResult = generateStartHandler(validNode, '');
const nonEmptyStringDbResult = generateStartHandler(validNode, 'true');

assert.strictEqual(typeof trueDbResult, 'string', 'Should handle true database flag');
assert.strictEqual(typeof falseDbResult, 'string', 'Should handle false database flag');
assert.strictEqual(typeof zeroDbResult, 'string', 'Should handle 0 database flag');
assert.strictEqual(typeof oneDbResult, 'string', 'Should handle 1 database flag');
assert.strictEqual(typeof emptyStringDbResult, 'string', 'Should handle empty string database flag');
assert.strictEqual(typeof nonEmptyStringDbResult, 'string', 'Should handle non-empty string database flag');

console.log('✓ Test 20 passed: Various database flag values handled correctly');

// Тест 21: Проверка на наличие основных компонентов обработчика
const basicComponentsResult = generateStartHandler(validNode, false);
assert.ok(basicComponentsResult.includes('async def'), 'Should include async function definition');
assert.ok(basicComponentsResult.includes('start1'), 'Should include node ID in function name or body');
console.log('✓ Test 21 passed: Basic handler components present');

// Тест 22: Проверка с очень длинными значениями
const longValuesNode = { 
  id: 'start' + 'A'.repeat(1000), 
  data: { 
    command: '/start' + 'B'.repeat(100), 
    messageText: 'Welcome!' + 'C'.repeat(1000) 
  } 
};
const longValuesResult = generateStartHandler(longValuesNode, false);
assert.strictEqual(typeof longValuesResult, 'string', 'Should handle very long values');
assert.ok(longValuesResult.includes('startA'), 'Should include part of long ID');
console.log('✓ Test 22 passed: Very long values handled correctly');

// Тест 23: Проверка с особыми символами
const specialCharsNode = { 
  id: 'start@#$%^&*()', 
  data: { 
    command: '/start_special', 
    messageText: 'Welcome with special chars: @#$%^&*()' 
  } 
};
const specialCharsResult = generateStartHandler(specialCharsNode, false);
assert.strictEqual(typeof specialCharsResult, 'string', 'Should handle special characters');
console.log('✓ Test 23 passed: Special characters handled correctly');

// Тест 24: Проверка с null/undefined mediaVariablesMap
const validWithNullMediaMap = generateStartHandler(validNode, false, null);
const validWithUndefinedMediaMap = generateStartHandler(validNode, false, undefined);
assert.strictEqual(typeof validWithNullMediaMap, 'string', 'Should handle null media map');
assert.strictEqual(typeof validWithUndefinedMediaMap, 'string', 'Should handle undefined media map');
console.log('✓ Test 24 passed: Null/undefined media map handled correctly');

console.log('All tests for generateStartHandler with various inputs passed!');