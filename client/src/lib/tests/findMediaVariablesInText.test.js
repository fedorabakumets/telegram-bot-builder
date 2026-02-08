import { strict as assert } from 'assert';
import { findMediaVariablesInText } from '../utils/findMediaVariablesInText';

/**
 * Тестирование функции findMediaVariablesInText
 * 
 * Эта функция находит переменные медиа в тексте.
 */
console.log('Running tests for findMediaVariablesInText...');

// Тест 1: Пустой текст
const emptyResult = findMediaVariablesInText('');
assert.ok(Array.isArray(emptyResult), 'Function should return an array');
assert.strictEqual(emptyResult.length, 0, 'Empty text should return empty array');

// Тест 2: Текст без переменных
const noVarsResult = findMediaVariablesInText('This is a plain text without variables');
assert.strictEqual(noVarsResult.length, 0, 'Text without variables should return empty array');

// Тест 3: Текст с одной переменной в формате {{variable}}
const singleCurlyResult = findMediaVariablesInText('This is a {{variable}} in text');
assert.strictEqual(singleCurlyResult.length, 1, 'Text with one {{variable}} should return array with one element');
assert.strictEqual(singleCurlyResult[0], 'variable', 'Should extract variable name correctly');

// Тест 4: Текст с одной переменной в формате {variable}
const singleBraceResult = findMediaVariablesInText('This is a {variable} in text');
assert.strictEqual(singleBraceResult.length, 1, 'Text with one {variable} should return array with one element');
assert.strictEqual(singleBraceResult[0], 'variable', 'Should extract variable name correctly');

// Тест 5: Текст с несколькими переменными
const multipleVarsResult = findMediaVariablesInText('Text with {{var1}} and {var2} and {{var3}}');
assert.strictEqual(multipleVarsResult.length, 3, 'Text with multiple variables should return array with multiple elements');
assert.ok(multipleVarsResult.includes('var1'), 'Should include var1');
assert.ok(multipleVarsResult.includes('var2'), 'Should include var2');
assert.ok(multipleVarsResult.includes('var3'), 'Should include var3');

// Тест 6: Текст с переменными, содержащими пробелы
const spacedVarsResult = findMediaVariablesInText('Text with {{ var with spaces }} and { another var }');
assert.strictEqual(spacedVarsResult.length, 2, 'Text with spaced variables should return array with elements');
assert.ok(spacedVarsResult.includes('var with spaces'), 'Should include spaced variable');
assert.ok(spacedVarsResult.includes('another var'), 'Should include another spaced variable');

// Тест 7: Текст с вложенными скобками (не должно обрабатываться как переменная)
const nestedResult = findMediaVariablesInText('Text with {{{nested}}} and {{not{nested}}}');
assert.strictEqual(nestedResult.length, 2, 'Text with nested braces should handle appropriately');
assert.ok(nestedResult.includes('{nested'), 'Should handle nested braces');
assert.ok(nestedResult.includes('not{nested'), 'Should handle partially nested braces');

// Тест 8: Текст с переменными, содержащими специальные символы
const specialCharsResult = findMediaVariablesInText('Text with {{var_with_special-chars}} and {var.with.dots}');
assert.strictEqual(specialCharsResult.length, 2, 'Text with special chars should return array with elements');
assert.ok(specialCharsResult.includes('var_with_special-chars'), 'Should include variable with special chars');
assert.ok(specialCharsResult.includes('var.with.dots'), 'Should include variable with dots');

// Тест 9: Проверка trim для переменных
const trimmedResult = findMediaVariablesInText('{{  spaced_var  }} and {  another_spaced  }');
assert.strictEqual(trimmedResult.length, 2, 'Text with spaced variables should return trimmed results');
assert.ok(trimmedResult.includes('spaced_var'), 'Should trim spaces from variable name');
assert.ok(trimmedResult.includes('another_spaced'), 'Should trim spaces from another variable name');

console.log('All tests for findMediaVariablesInText passed!');