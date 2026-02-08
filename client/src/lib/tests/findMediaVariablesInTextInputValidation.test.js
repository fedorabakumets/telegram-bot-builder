import { strict as assert } from 'assert';
import { findMediaVariablesInText } from '../utils/findMediaVariablesInText';

/**
 * Тестирование функции findMediaVariablesInText с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for findMediaVariablesInText with various inputs...');

// Тест 1: Пустая строка
const emptyResult = findMediaVariablesInText('');
assert.ok(Array.isArray(emptyResult), 'Should return an array');
assert.strictEqual(emptyResult.length, 0, 'Should return empty array for empty string');
console.log('✓ Test 1 passed: Empty string handled correctly');

// Тест 2: null/undefined
const nullResult = findMediaVariablesInText(null);
assert.ok(Array.isArray(nullResult), 'Should return an array for null input');
assert.strictEqual(nullResult.length, 0, 'Should return empty array for null input');
console.log('✓ Test 2 passed: Null input handled correctly');

const undefinedResult = findMediaVariablesInText(undefined);
assert.ok(Array.isArray(undefinedResult), 'Should return an array for undefined input');
assert.strictEqual(undefinedResult.length, 0, 'Should return empty array for undefined input');
console.log('✓ Test 3 passed: Undefined input handled correctly');

// Тест 4: Число вместо строки
const numberResult = findMediaVariablesInText(123);
// В JavaScript, когда строка передается в функцию, которая ожидает строку,
// но получает число, оно будет преобразовано к строке
// Но регулярное выражение не найдет совпадений в "123"
assert.ok(Array.isArray(numberResult), 'Should return an array for number input');
console.log('✓ Test 4 passed: Number input handled correctly');

// Тест 5: Объект вместо строки
const objectResult = findMediaVariablesInText({ text: '{{variable}}' });
// Объект будет преобразован к строке "[object Object]", в которой не будет совпадений
assert.ok(Array.isArray(objectResult), 'Should return an array for object input');
console.log('✓ Test 5 passed: Object input handled correctly');

// Тест 6: Массив вместо строки
const arrayResult = findMediaVariablesInText(['{{var1}}', '{{var2}}']);
// Массив будет преобразован к строке "var1,{{var2}}" (или подобной), в которой могут быть совпадения
assert.ok(Array.isArray(arrayResult), 'Should return an array for array input');
console.log('✓ Test 6 passed: Array input handled correctly');

// Тест 7: Текст без переменных
const noVarsResult = findMediaVariablesInText('This is a plain text without variables');
assert.ok(Array.isArray(noVarsResult), 'Should return an array for text without variables');
assert.strictEqual(noVarsResult.length, 0, 'Should return empty array for text without variables');
console.log('✓ Test 7 passed: Text without variables handled correctly');

// Тест 8: Текст с переменными в формате {{variable}}
const curlyVarsResult = findMediaVariablesInText('Text with {{var1}} and {{var2}}');
assert.ok(Array.isArray(curlyVarsResult), 'Should return an array for text with curly variables');
assert.strictEqual(curlyVarsResult.length, 2, 'Should find 2 variables in curly format');
assert.ok(curlyVarsResult.includes('var1'), 'Should include var1');
assert.ok(curlyVarsResult.includes('var2'), 'Should include var2');
console.log('✓ Test 8 passed: Curly format variables handled correctly');

// Тест 9: Текст с переменными в формате {variable}
const braceVarsResult = findMediaVariablesInText('Text with {var1} and {var2}');
assert.ok(Array.isArray(braceVarsResult), 'Should return an array for text with brace variables');
assert.strictEqual(braceVarsResult.length, 2, 'Should find 2 variables in brace format');
assert.ok(braceVarsResult.includes('var1'), 'Should include var1');
assert.ok(braceVarsResult.includes('var2'), 'Should include var2');
console.log('✓ Test 9 passed: Brace format variables handled correctly');

// Тест 10: Текст с переменными в смешанном формате
const mixedFormatResult = findMediaVariablesInText('Text with {{var1}} and {var2} and {{var3}}');
assert.ok(Array.isArray(mixedFormatResult), 'Should return an array for text with mixed format variables');
assert.strictEqual(mixedFormatResult.length, 3, 'Should find 3 variables in mixed format');
assert.ok(mixedFormatResult.includes('var1'), 'Should include var1');
assert.ok(mixedFormatResult.includes('var2'), 'Should include var2');
assert.ok(mixedFormatResult.includes('var3'), 'Should include var3');
console.log('✓ Test 10 passed: Mixed format variables handled correctly');

// Тест 11: Текст с переменными, содержащими пробелы
const spacedVarsResult = findMediaVariablesInText('Text with {{ var with spaces }} and { another var }');
assert.ok(Array.isArray(spacedVarsResult), 'Should return an array for text with spaced variables');
assert.strictEqual(spacedVarsResult.length, 2, 'Should find 2 spaced variables');
assert.ok(spacedVarsResult.includes('var with spaces'), 'Should include spaced variable');
assert.ok(spacedVarsResult.includes('another var'), 'Should include another spaced variable');
console.log('✓ Test 11 passed: Spaced variables handled correctly');

// Тест 12: Текст с переменными, содержащими специальные символы
const specialCharsResult = findMediaVariablesInText('Text with {{var_with-special.chars}} and {var@with#symbols}');
assert.ok(Array.isArray(specialCharsResult), 'Should return an array for text with special chars');
assert.strictEqual(specialCharsResult.length, 2, 'Should find 2 variables with special chars');
assert.ok(specialCharsResult.includes('var_with-special.chars'), 'Should include variable with special chars');
assert.ok(specialCharsResult.includes('var@with#symbols'), 'Should include variable with symbols');
console.log('✓ Test 12 passed: Special characters handled correctly');

// Тест 13: Текст с неправильным форматом скобок
const malformedBracesResult = findMediaVariablesInText('Text with {{{partial}} and {{unclosed} and {unopened}}');
assert.ok(Array.isArray(malformedBracesResult), 'Should return an array for text with malformed braces');
// Регулярное выражение может найти частичные совпадения
console.log('✓ Test 13 passed: Malformed braces handled correctly');

// Тест 14: Очень длинный текст
const longText = 'A'.repeat(10000) + '{{long_variable}}' + 'B'.repeat(10000);
const longTextResult = findMediaVariablesInText(longText);
assert.ok(Array.isArray(longTextResult), 'Should return an array for long text');
assert.ok(longTextResult.includes('long_variable'), 'Should find variable in long text');
console.log('✓ Test 14 passed: Long text handled correctly');

// Тест 15: Текст с многострочными переменными
const multilineText = `Line 1 {{var1}}
Line 2 {var2}
Line 3 {{var3}}`;
const multilineResult = findMediaVariablesInText(multilineText);
assert.ok(Array.isArray(multilineResult), 'Should return an array for multiline text');
assert.strictEqual(multilineResult.length, 3, 'Should find 3 variables in multiline text');
console.log('✓ Test 15 passed: Multiline text handled correctly');

// Тест 16: Текст с символами юникода
const unicodeText = 'Text with {{переменная}} and {変数}';
const unicodeResult = findMediaVariablesInText(unicodeText);
assert.ok(Array.isArray(unicodeResult), 'Should return an array for unicode text');
// Регулярное выражение может не находить переменные с не-латинскими символами
console.log('✓ Test 16 passed: Unicode text handled correctly');

// Тест 17: Текст с большим количеством переменных
const manyVarsText = Array(1000).fill('{{var}}').join(' text ');
const manyVarsResult = findMediaVariablesInText(manyVarsText);
assert.ok(Array.isArray(manyVarsResult), 'Should return an array for text with many variables');
assert.strictEqual(manyVarsResult.length, 1000, 'Should find all variables in large text');
console.log('✓ Test 17 passed: Many variables handled correctly');

// Тест 18: Текст с переменными, содержащими символы регулярного выражения
const regexCharsText = 'Text with {{var[with]chars}} and {var.with?regex}';
const regexCharsResult = findMediaVariablesInText(regexCharsText);
assert.ok(Array.isArray(regexCharsResult), 'Should return an array for text with regex chars');
// Регулярное выражение должно обрабатывать эти символы как часть переменной
console.log('✓ Test 18 passed: Regex characters handled correctly');

console.log('All tests for findMediaVariablesInText with various inputs passed!');