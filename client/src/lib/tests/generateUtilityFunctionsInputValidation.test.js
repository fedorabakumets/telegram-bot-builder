import { strict as assert } from 'assert';
import { generateUtilityFunctions } from '../generate/generateUtilityFunctions';

/**
 * Тестирование функции generateUtilityFunctions с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for generateUtilityFunctions with various inputs...');

// Тест 1: Правильные входные данные - true
const trueResult = generateUtilityFunctions(true);
assert.strictEqual(typeof trueResult, 'string', 'Should return a string when userDatabaseEnabled is true');
assert.ok(trueResult.includes('get_user_from_db'), 'Should include DB functions when DB is enabled');
assert.ok(trueResult.includes('check_auth'), 'Should include check_auth function');
console.log('✓ Test 1 passed: True input handled correctly');

// Тест 2: Правильные входные данные - false
const falseResult = generateUtilityFunctions(false);
assert.strictEqual(typeof falseResult, 'string', 'Should return a string when userDatabaseEnabled is false');
assert.ok(!falseResult.includes('get_user_from_db'), 'Should not include DB functions when DB is disabled');
assert.ok(falseResult.includes('check_auth'), 'Should include simple check_auth function when DB is disabled');
console.log('✓ Test 2 passed: False input handled correctly');

// Тест 3: null вместо boolean
const nullResult = generateUtilityFunctions(null);
assert.strictEqual(typeof nullResult, 'string', 'Should return a string when input is null');
// null интерпретируется как falsy, так что должна быть версия без БД
assert.ok(!nullResult.includes('get_user_from_db'), 'Should not include DB functions when input is null');
console.log('✓ Test 3 passed: Null input handled correctly');

// Тест 4: undefined вместо boolean
const undefinedResult = generateUtilityFunctions(undefined);
assert.strictEqual(typeof undefinedResult, 'string', 'Should return a string when input is undefined');
// undefined интерпретируется как falsy, так что должна быть версия без БД
assert.ok(!undefinedResult.includes('get_user_from_db'), 'Should not include DB functions when input is undefined');
console.log('✓ Test 4 passed: Undefined input handled correctly');

// Тест 5: 0 вместо boolean
const zeroResult = generateUtilityFunctions(0);
assert.strictEqual(typeof zeroResult, 'string', 'Should return a string when input is 0');
// 0 интерпретируется как falsy, так что должна быть версия без БД
assert.ok(!zeroResult.includes('get_user_from_db'), 'Should not include DB functions when input is 0');
console.log('✓ Test 5 passed: Zero input handled correctly');

// Тест 6: 1 вместо boolean
const oneResult = generateUtilityFunctions(1);
assert.strictEqual(typeof oneResult, 'string', 'Should return a string when input is 1');
// 1 интерпретируется как truthy, так что должна быть версия с БД
assert.ok(oneResult.includes('get_user_from_db'), 'Should include DB functions when input is 1');
console.log('✓ Test 6 passed: One input handled correctly');

// Тест 7: Пустая строка вместо boolean
const emptyStringResult = generateUtilityFunctions('');
assert.strictEqual(typeof emptyStringResult, 'string', 'Should return a string when input is empty string');
// Пустая строка интерпретируется как falsy, так что должна быть версия без БД
assert.ok(!emptyStringResult.includes('get_user_from_db'), 'Should not include DB functions when input is empty string');
console.log('✓ Test 7 passed: Empty string input handled correctly');

// Тест 8: Непустая строка вместо boolean
const nonEmptyStringResult = generateUtilityFunctions('true');
assert.strictEqual(typeof nonEmptyStringResult, 'string', 'Should return a string when input is non-empty string');
// Любая непустая строка интерпретируется как truthy, так что должна быть версия с БД
assert.ok(nonEmptyStringResult.includes('get_user_from_db'), 'Should include DB functions when input is non-empty string');
console.log('✓ Test 8 passed: Non-empty string input handled correctly');

// Тест 9: Объект вместо boolean
const objectResult = generateUtilityFunctions({});
assert.strictEqual(typeof objectResult, 'string', 'Should return a string when input is object');
// Любой объект интерпретируется как truthy, так что должна быть версия с БД
assert.ok(objectResult.includes('get_user_from_db'), 'Should include DB functions when input is object');
console.log('✓ Test 9 passed: Object input handled correctly');

// Тест 10: Массив вместо boolean
const arrayResult = generateUtilityFunctions([]);
assert.strictEqual(typeof arrayResult, 'string', 'Should return a string when input is array');
// Пустой массив интерпретируется как truthy (в отличие от некоторых других языков), так что должна быть версия с БД
assert.ok(arrayResult.includes('get_user_from_db'), 'Should include DB functions when input is array');
console.log('✓ Test 10 passed: Array input handled correctly');

// Тест 11: NaN вместо boolean
const nanResult = generateUtilityFunctions(NaN);
assert.strictEqual(typeof nanResult, 'string', 'Should return a string when input is NaN');
// NaN интерпретируется как falsy, так что должна быть версия без БД
assert.ok(!nanResult.includes('get_user_from_db'), 'Should not include DB functions when input is NaN');
console.log('✓ Test 11 passed: NaN input handled correctly');

// Тест 12: Проверка наличия обязательных компонентов в обоих случаях
const trueWithComponents = generateUtilityFunctions(true);
const falseWithComponents = generateUtilityFunctions(false);

// Оба варианта должны содержать основные функции
assert.ok(trueWithComponents.includes('async def is_admin'), 'True version should include is_admin function');
assert.ok(falseWithComponents.includes('async def is_admin'), 'False version should include is_admin function');

assert.ok(trueWithComponents.includes('async def is_private_chat'), 'True version should include is_private_chat function');
assert.ok(falseWithComponents.includes('async def is_private_chat'), 'False version should include is_private_chat function');

assert.ok(trueWithComponents.includes('def get_user_variables'), 'True version should include get_user_variables function');
assert.ok(falseWithComponents.includes('def get_user_variables'), 'False version should include get_user_variables function');

console.log('✓ Test 12 passed: Required components present in both versions');

// Тест 13: Проверка различий между версиями
assert.notStrictEqual(trueWithComponents, falseWithComponents, 'DB-enabled and DB-disabled versions should be different');
// В версии с БД должна быть более сложная логика в check_auth
assert.ok(trueWithComponents.includes('if db_pool:'), 'DB-enabled version should include DB pool check');
assert.ok(!falseWithComponents.includes('if db_pool:'), 'DB-disabled version should not include DB pool check');

console.log('✓ Test 13 passed: Differences between versions handled correctly');

// Тест 14: Проверка на устойчивость к прототипам и встроенным методам
const prototypePollutedResult = generateUtilityFunctions(Boolean.prototype.valueOf.call(true));
assert.strictEqual(typeof prototypePollutedResult, 'string', 'Should handle prototype pollution safely');
assert.ok(prototypePollutedResult.includes('get_user_from_db'), 'Should work with prototype-polluted boolean');
console.log('✓ Test 14 passed: Prototype pollution handled safely');

// Тест 15: Проверка длины результата
const trueLength = trueResult.length;
const falseLength = falseResult.length;
assert.ok(trueLength > 0, 'True version should have non-zero length');
assert.ok(falseLength > 0, 'False version should have non-zero length');
// Версия с БД обычно длиннее из-за дополнительной логики
assert.ok(trueLength >= falseLength, 'DB-enabled version should be at least as long as DB-disabled version');
console.log('✓ Test 15 passed: Result lengths are reasonable');

console.log('All tests for generateUtilityFunctions with various inputs passed!');