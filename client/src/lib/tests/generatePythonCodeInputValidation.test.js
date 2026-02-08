import { strict as assert } from 'assert';
import { generatePythonCode } from '../bot-generator';

/**
 * Тестирование функции generatePythonCode с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for generatePythonCode with various inputs...');

// Тест 1: Пустые данные
const emptyData = { nodes: [], connections: [] };
const emptyResult = generatePythonCode(emptyData, 'TestBot');
assert.strictEqual(typeof emptyResult, 'string', 'Should return a string with empty data');
assert.ok(emptyResult.includes('TestBot - Telegram Bot'), 'Should include bot name in docstring');
console.log('✓ Test 1 passed: Empty data handled correctly');

// Тест 2: null/undefined botData
const nullResult = generatePythonCode(null, 'NullBot');
assert.strictEqual(typeof nullResult, 'string', 'Should return a string with null data');
assert.ok(nullResult.includes('NullBot - Telegram Bot'), 'Should include bot name with null data');
console.log('✓ Test 2 passed: Null data handled correctly');

const undefinedResult = generatePythonCode(undefined, 'UndefinedBot');
assert.strictEqual(typeof undefinedResult, 'string', 'Should return a string with undefined data');
assert.ok(undefinedResult.includes('UndefinedBot - Telegram Bot'), 'Should include bot name with undefined data');
console.log('✓ Test 3 passed: Undefined data handled correctly');

// Тест 4: Параметры по умолчанию
const defaultParamsResult = generatePythonCode(emptyData);
assert.strictEqual(typeof defaultParamsResult, 'string', 'Should work with default parameters');
assert.ok(defaultParamsResult.includes('MyBot - Telegram Bot'), 'Should use default bot name');
console.log('✓ Test 4 passed: Default parameters handled correctly');

// Тест 5: Различные значения параметров
const fullParamsResult = generatePythonCode(emptyData, 'FullParamsBot', [], true, 123, true, true);
assert.strictEqual(typeof fullParamsResult, 'string', 'Should work with all parameters set');
assert.ok(fullParamsResult.includes('FullParamsBot - Telegram Bot'), 'Should include custom bot name');
console.log('✓ Test 5 passed: Full parameters handled correctly');

// Тест 6: Пустые массивы для groups
const emptyGroupsResult = generatePythonCode(emptyData, 'EmptyGroupsBot', []);
assert.strictEqual(typeof emptyGroupsResult, 'string', 'Should work with empty groups array');
console.log('✓ Test 6 passed: Empty groups handled correctly');

// Тест 7: null/undefined для groups
const nullGroupsResult = generatePythonCode(emptyData, 'NullGroupsBot', null);
assert.strictEqual(typeof nullGroupsResult, 'string', 'Should work with null groups');
console.log('✓ Test 7 passed: Null groups handled correctly');

const undefinedGroupsResult = generatePythonCode(emptyData, 'UndefinedGroupsBot', undefined);
assert.strictEqual(typeof undefinedGroupsResult, 'string', 'Should work with undefined groups');
console.log('✓ Test 8 passed: Undefined groups handled correctly');

// Тест 9: Проверка с неполными данными бота
const incompleteBotData = {
  nodes: [
    { id: '1', type: 'start', data: { command: '/start' } },
    { id: '2', type: 'command', data: { command: '/help', messageText: 'Help message' } }
  ],
  connections: [
    { id: 'conn1', source: '1', target: '2' }
  ]
};
const incompleteResult = generatePythonCode(incompleteBotData, 'IncompleteBot');
assert.strictEqual(typeof incompleteResult, 'string', 'Should work with incomplete bot data');
assert.ok(incompleteResult.includes('IncompleteBot - Telegram Bot'), 'Should include bot name with incomplete data');
console.log('✓ Test 9 passed: Incomplete bot data handled correctly');

// Тест 10: Проверка с неправильными типами данных
const wrongTypesResult = generatePythonCode({ nodes: 'not_an_array', connections: 'not_an_array' }, 'WrongTypesBot');
assert.strictEqual(typeof wrongTypesResult, 'string', 'Should handle wrong types gracefully');
console.log('✓ Test 10 passed: Wrong types handled correctly');

// Тест 11: Проверка с массивами, содержащими null/undefined элементы
const arrayWithNulls = {
  nodes: [null, undefined, { id: '1', type: 'start', data: { command: '/start' } }],
  connections: [null, { id: 'conn1', source: '1', target: '2' }]
};
const nullElementsResult = generatePythonCode(arrayWithNulls, 'NullElementsBot');
assert.strictEqual(typeof nullElementsResult, 'string', 'Should handle arrays with null elements');
console.log('✓ Test 11 passed: Arrays with null elements handled correctly');

// Тест 12: Проверка с неправильными типами узлов
const wrongNodeTypes = {
  nodes: [
    { id: 123, type: 456, data: 'not_an_object' }, // Числовые ID и тип, строковые данные
    { id: '2', type: '', data: null }, // Пустой тип, null данные
    { id: '3', type: true, data: [] } // Boolean тип, массив данных
  ],
  connections: []
};
const wrongNodeTypesResult = generatePythonCode(wrongNodeTypes, 'WrongNodeTypesBot');
assert.strictEqual(typeof wrongNodeTypesResult, 'string', 'Should handle wrong node types');
console.log('✓ Test 12 passed: Wrong node types handled correctly');

// Тест 13: Проверка с неправильными типами соединений
const wrongConnTypes = {
  nodes: [],
  connections: [
    { id: 123, source: 456, target: 789 }, // Числовые значения
    { id: '', source: '', target: '' }, // Пустые строки
    { id: true, source: null, target: undefined } // Boolean и null/undefined
  ]
};
const wrongConnTypesResult = generatePythonCode(wrongConnTypes, 'WrongConnTypesBot');
assert.strictEqual(typeof wrongConnTypesResult, 'string', 'Should handle wrong connection types');
console.log('✓ Test 13 passed: Wrong connection types handled correctly');

// Тест 14: Проверка с очень большими значениями параметров
const largeValuesResult = generatePythonCode(emptyData, 'A'.repeat(1000), [], false, 999999999, false, false);
assert.strictEqual(typeof largeValuesResult, 'string', 'Should handle large parameter values');
assert.ok(largeValuesResult.includes('A'.repeat(100)), 'Should include long bot name (at least part of it)');
console.log('✓ Test 14 passed: Large values handled correctly');

// Тест 15: Проверка с особыми символами в имени бота
const specialCharsResult = generatePythonCode(emptyData, 'Bot@With#Special$Chars%');
assert.strictEqual(typeof specialCharsResult, 'string', 'Should handle special characters in bot name');
assert.ok(specialCharsResult.includes('Bot@With#Special$Chars%'), 'Should include special characters in docstring');
console.log('✓ Test 15 passed: Special characters handled correctly');

// Тест 16: Проверка на наличие основных компонентов Python кода
const componentsResult = generatePythonCode(emptyData, 'ComponentsBot');
assert.ok(componentsResult.includes('"""'), 'Should include docstring markers');
assert.ok(componentsResult.includes('import'), 'Should include import statements');
assert.ok(componentsResult.includes('async def'), 'Should include async function definitions');
console.log('✓ Test 16 passed: Basic Python components present');

// Тест 17: Проверка с разными значениями флагов
const flagsResult1 = generatePythonCode(emptyData, 'FlagsBot1', [], true, null, true, false);
const flagsResult2 = generatePythonCode(emptyData, 'FlagsBot2', [], false, 456, false, true);
assert.strictEqual(typeof flagsResult1, 'string', 'Should work with different flag combinations 1');
assert.strictEqual(typeof flagsResult2, 'string', 'Should work with different flag combinations 2');
console.log('✓ Test 17 passed: Different flag combinations handled correctly');

// Тест 18: Проверка с неправильными значениями флагов (не boolean)
const nonBoolFlagsResult = generatePythonCode(emptyData, 'NonBoolFlagsBot', [], 'true', 'projectId', 'enable', 'group');
assert.strictEqual(typeof nonBoolFlagsResult, 'string', 'Should handle non-boolean flags');
console.log('✓ Test 18 passed: Non-boolean flags handled correctly');

// Тест 19: Проверка с null/undefined для числовых параметров
const nullNumericResult = generatePythonCode(emptyData, 'NullNumericBot', [], false, null, false, false);
const undefinedNumericResult = generatePythonCode(emptyData, 'UndefinedNumericBot', [], false, undefined, false, false);
assert.strictEqual(typeof nullNumericResult, 'string', 'Should handle null numeric parameter');
assert.strictEqual(typeof undefinedNumericResult, 'string', 'Should handle undefined numeric parameter');
console.log('✓ Test 19 passed: Null/undefined numeric parameters handled correctly');

// Тест 20: Проверка с экстремальными числовыми значениями
const extremeNumericResult = generatePythonCode(emptyData, 'ExtremeNumericBot', [], false, -999999999, false, false);
assert.strictEqual(typeof extremeNumericResult, 'string', 'Should handle extreme numeric values');
console.log('✓ Test 20 passed: Extreme numeric values handled correctly');

console.log('All tests for generatePythonCode with various inputs passed!');