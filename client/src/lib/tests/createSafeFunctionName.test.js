import { strict as assert } from 'assert';
import { createSafeFunctionName } from '../format/createSafeFunctionName';

/**
 * Тестирование функции createSafeFunctionName
 * 
 * Эта функция создает безопасные имена функций Python из идентификаторов узлов.
 */
console.log('Running tests for createSafeFunctionName...');

// Тест 1: Обычное имя узла
assert.strictEqual(createSafeFunctionName('user_input_node'), 'user_input_node', 'Normal node ID should remain unchanged');

// Тест 2: Имя с дефисами и специальными символами
assert.strictEqual(createSafeFunctionName('my-node@123'), 'my_node_123', 'Special characters should be replaced with underscores');

// Тест 3: Имя, начинающееся с цифры
assert.strictEqual(createSafeFunctionName('123_input'), 'node_123_input', 'Names starting with digit should get "node_" prefix');

// Тест 4: Имя с точками и восклицательными знаками
assert.strictEqual(createSafeFunctionName('test-function.name!'), 'test_function_name_', 'Various special characters should be replaced with underscores');

// Тест 5: Имя только с буквами и цифрами
assert.strictEqual(createSafeFunctionName('nodeName123'), 'nodeName123', 'Alphanumeric names should remain unchanged');

// Тест 6: Имя с подчеркиваниями
assert.strictEqual(createSafeFunctionName('node_name_test'), 'node_name_test', 'Underscores should be preserved');

// Тест 7: Пустое имя
assert.strictEqual(createSafeFunctionName(''), '', 'Empty node ID should remain empty');

// Тест 8: Имя только с недопустимыми символами
assert.strictEqual(createSafeFunctionName('@@@'), '___', 'Only special characters should become underscores');

// Тест 9: Имя начинающееся с подчеркивания (допустимо в Python)
assert.strictEqual(createSafeFunctionName('_private_node'), '_private_node', 'Names starting with underscore should remain unchanged');

// Тест 10: Имя с символами, отличными от букв, цифр и подчеркивания
assert.strictEqual(createSafeFunctionName('node@123'), 'node_123', 'Special characters should be replaced with underscores');

console.log('All tests for createSafeFunctionName passed!');