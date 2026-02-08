import { strict as assert } from 'assert';
import { toPythonBoolean } from '../format/toPythonBoolean';

/**
 * Тестирование функции toPythonBoolean
 * 
 * Эта функция конвертирует значения в строковое представление Python boolean.
 */
console.log('Running tests for toPythonBoolean...');

// Тест 1: true в JavaScript должно стать 'True' в Python
assert.strictEqual(toPythonBoolean(true), 'True', 'JavaScript true should become Python True');

// Тест 2: false в JavaScript должно стать 'False' в Python
assert.strictEqual(toPythonBoolean(false), 'False', 'JavaScript false should become Python False');

// Тест 3: 1 (истина в JS) должно стать 'True' в Python
assert.strictEqual(toPythonBoolean(1), 'True', 'JavaScript truthy value 1 should become Python True');

// Тест 4: 0 (ложь в JS) должно стать 'False' в Python
assert.strictEqual(toPythonBoolean(0), 'False', 'JavaScript falsy value 0 should become Python False');

// Тест 5: Пустая строка (ложь в JS) должно стать 'False' в Python
assert.strictEqual(toPythonBoolean(''), 'False', 'JavaScript falsy empty string should become Python False');

// Тест 6: Непустая строка (истина в JS) должно стать 'True' в Python
assert.strictEqual(toPythonBoolean('hello'), 'True', 'JavaScript truthy non-empty string should become Python True');

// Тест 7: null (ложь в JS) должно стать 'False' в Python
assert.strictEqual(toPythonBoolean(null), 'False', 'JavaScript falsy null should become Python False');

// Тест 8: undefined (ложь в JS) должно стать 'False' в Python
assert.strictEqual(toPythonBoolean(undefined), 'False', 'JavaScript falsy undefined should become Python False');

// Тест 9: NaN (ложь в JS) должно стать 'False' в Python
assert.strictEqual(toPythonBoolean(NaN), 'False', 'JavaScript falsy NaN should become Python False');

// Тест 10: Объект (истина в JS) должно стать 'True' в Python
assert.strictEqual(toPythonBoolean({}), 'True', 'JavaScript truthy object should become Python True');

// Тест 11: Массив (истина в JS) должно стать 'True' в Python
assert.strictEqual(toPythonBoolean([]), 'True', 'JavaScript truthy array should become Python True');

console.log('All tests for toPythonBoolean passed!');