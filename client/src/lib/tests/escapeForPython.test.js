import { strict as assert } from 'assert';
import { escapeForPython } from '../format/escapeForPython';

/**
 * Тестирование функции escapeForPython
 * 
 * Эта функция экранирует специальные символы для безопасного использования в Python коде.
 */
console.log('Running tests for escapeForPython...');

// Тест 1: Строка с двойными кавычками
assert.strictEqual(escapeForPython('He said "Hello"'), 'He said \\"Hello\\"', 'Double quotes should be escaped');

// Тест 2: Строка с новой строкой
assert.strictEqual(escapeForPython('Line 1\nLine 2'), 'Line 1\\nLine 2', 'Newline characters should be escaped');

// Тест 3: Строка с возвратом каретки
assert.strictEqual(escapeForPython('Line 1\rLine 2'), 'Line 1\\rLine 2', 'Carriage return characters should be escaped');

// Тест 4: Строка с табуляцией
assert.strictEqual(escapeForPython('Column 1\tColumn 2'), 'Column 1\\tColumn 2', 'Tab characters should be escaped');

// Тест 5: Комбинация специальных символов
assert.strictEqual(escapeForPython('He said "Hello"\n\tWorld'), 'He said \\"Hello\\"\\n\\tWorld', 'Multiple special characters should be escaped');

// Тест 6: Пустая строка
assert.strictEqual(escapeForPython(''), '', 'Empty string should remain empty');

// Тест 7: Строка без специальных символов
assert.strictEqual(escapeForPython('Simple text'), 'Simple text', 'String without special characters should remain unchanged');

// Тест 8: Строка с одинарными кавычками (не должны экранироваться)
assert.strictEqual(escapeForPython("Don't worry"), "Don't worry", 'Single quotes should not be escaped');

console.log('All tests for escapeForPython passed!');