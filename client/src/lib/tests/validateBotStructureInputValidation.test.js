import { strict as assert } from 'assert';
import { validateBotStructure } from '../utils/validateBotStructure';

/**
 * Тестирование функции validateBotStructure с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for validateBotStructure with various inputs...');

// Тест 1: Пустые данные
const emptyData = {};
const emptyResult = validateBotStructure(emptyData);
assert.strictEqual(emptyResult.isValid, false, 'Should be invalid with empty data');
assert.ok(emptyResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 1 passed: Empty data handled correctly');

// Тест 2: null/undefined botData
const nullResult = validateBotStructure(null);
assert.strictEqual(nullResult.isValid, false, 'Should be invalid with null data');
assert.ok(nullResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');

const undefinedResult = validateBotStructure(undefined);
assert.strictEqual(undefinedResult.isValid, false, 'Should be invalid with undefined data');
assert.ok(undefinedResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 2 passed: Null/undefined data handled correctly');

// Тест 3: botData без nodes
const noNodesData = { connections: [] };
const noNodesResult = validateBotStructure(noNodesData);
assert.strictEqual(noNodesResult.isValid, false, 'Should be invalid with no nodes');
assert.ok(noNodesResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 3 passed: Missing nodes handled correctly');

// Тест 4: nodes как null
const nullNodesData = { nodes: null, connections: [] };
const nullNodesResult = validateBotStructure(nullNodesData);
assert.strictEqual(nullNodesResult.isValid, false, 'Should be invalid with null nodes');
assert.ok(nullNodesResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 4 passed: Null nodes handled correctly');

// Тест 5: nodes как undefined
const undefinedNodesData = { nodes: undefined, connections: [] };
const undefinedNodesResult = validateBotStructure(undefinedNodesData);
assert.strictEqual(undefinedNodesResult.isValid, false, 'Should be invalid with undefined nodes');
assert.ok(undefinedNodesResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 5 passed: Undefined nodes handled correctly');

// Тест 6: Пустой массив узлов
const emptyNodesData = { nodes: [], connections: [] };
const emptyNodesResult = validateBotStructure(emptyNodesData);
assert.strictEqual(emptyNodesResult.isValid, false, 'Should be invalid with empty nodes array');
assert.ok(emptyNodesResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 6 passed: Empty nodes array handled correctly');

// Тест 7: Массив с null/undefined элементами
const arrayWithNulls = {
  nodes: [null, undefined, null],
  connections: []
};
const arrayWithNullsResult = validateBotStructure(arrayWithNulls);
// Функция extractNodesAndConnections должна обработать null/undefined значения
// и результат будет как будто у нас пустой массив узлов
assert.strictEqual(arrayWithNullsResult.isValid, false, 'Should be invalid with array containing nulls');
assert.ok(arrayWithNullsResult.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');
console.log('✓ Test 7 passed: Array with null/undefined elements handled correctly');

// Тест 8: Узлы с неполными данными
const incompleteNodesData = {
  nodes: [
    { id: '1', type: 'start' }, // Только ID и тип, без data
    { id: '2', type: 'command' }, // Только ID и тип, без data
    { id: '3' }, // Только ID
    { type: 'message' } // Только тип
  ],
  connections: []
};
const incompleteResult = validateBotStructure(incompleteNodesData);
// У нас есть стартовый узел, но без команды, так что валидация должна пройти дальше
// и проверить другие узлы
assert.ok(Array.isArray(incompleteResult.errors), 'Should return errors array');
console.log('✓ Test 8 passed: Incomplete nodes handled correctly');

// Тест 9: Узлы с неправильными типами данных
const wrongTypesData = {
  nodes: [
    { id: 123, type: 'start', data: { command: '/start' } }, // Числовой ID
    { id: '2', type: 456, data: { command: '/help', messageText: 'Help' } }, // Числовой тип
    { id: '3', type: 'command', data: 'not_an_object' }, // data как строка, а не объект
    { id: '4', type: 'start', data: [] } // data как массив
  ],
  connections: []
};
const wrongTypesResult = validateBotStructure(wrongTypesData);
// Проверим, что функция не падает с ошибками при неправильных типах данных
assert.ok(typeof wrongTypesResult.isValid === 'boolean', 'Should return boolean isValid');
assert.ok(Array.isArray(wrongTypesResult.errors), 'Should return errors array');
console.log('✓ Test 9 passed: Wrong data types handled correctly');

// Тест 10: Узлы с неправильными командами
const invalidCommandsData = {
  nodes: [
    { id: '1', type: 'start', data: { command: null } },
    { id: '2', type: 'command', data: { command: undefined } },
    { id: '3', type: 'command', data: { command: '' } },
    { id: '4', type: 'start', data: { command: 'invalid_command_format' } }
  ],
  connections: []
};
const invalidCommandsResult = validateBotStructure(invalidCommandsData);
// Проверим, что функция не падает при неправильных командах
assert.ok(typeof invalidCommandsResult.isValid === 'boolean', 'Should handle invalid commands gracefully');
console.log('✓ Test 10 passed: Invalid commands handled correctly');

// Тест 11: Корректные данные для проверки, что функция работает нормально
const validData = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { id: '2', type: 'command', data: { command: '/help', messageText: 'Help message' } }
  ],
  connections: []
};
const validResult = validateBotStructure(validData);
assert.strictEqual(validResult.isValid, true, 'Should be valid with proper data');
assert.strictEqual(validResult.errors.length, 0, 'Should have no errors with proper data');
console.log('✓ Test 11 passed: Valid data handled correctly');

// Тест 12: Проверка с узлами, содержащими кнопки с неполными данными
const nodesWithIncompleteButtons = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { 
      id: '2', 
      type: 'command', 
      data: { 
        command: '/help', 
        messageText: 'Help message',
        buttons: [
          { text: 'Button 1', action: 'goto' }, // Нет target
          { text: '', action: 'url', url: 'https://example.com' }, // Пустой текст
          { text: 'Button 3', action: 'url', url: null }, // null URL
          null, // null кнопка
          undefined // undefined кнопка
        ]
      } 
    }
  ],
  connections: []
};
const incompleteButtonsResult = validateBotStructure(nodesWithIncompleteButtons);
// Проверим, что функция не падает при неполных данных кнопок
assert.ok(typeof incompleteButtonsResult.isValid === 'boolean', 'Should handle incomplete buttons gracefully');
assert.ok(Array.isArray(incompleteButtonsResult.errors), 'Should return errors array for incomplete buttons');
console.log('✓ Test 12 passed: Incomplete buttons handled correctly');

console.log('All tests for validateBotStructure with various inputs passed!');