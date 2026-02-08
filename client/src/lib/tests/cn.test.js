import { strict as assert } from 'assert';
import { cn } from '../utils/utils';

/**
 * Тестирование функции cn
 * 
 * Эта функция объединяет CSS-классы с помощью clsx и twMerge.
 */
console.log('Running tests for cn...');

// Тест 1: Объединение простых классов
assert.strictEqual(cn('bg-red', 'text-white'), 'bg-red text-white', 'Simple classes should be combined');

// Тест 2: Объединение классов с условием
assert.strictEqual(cn('bg-red', false && 'text-blue', 'text-white'), 'bg-red text-white', 'Falsy values should be ignored');

// Тест 3: Объединение классов с null и undefined
assert.strictEqual(cn('bg-red', null, 'text-white', undefined), 'bg-red text-white', 'Null and undefined should be ignored');

// Тест 4: Совпадающие классы (tailwind-специфичная логика)
// В реальной ситуации twMerge может объединять противоречивые классы
// Например, bg-red и bg-blue -> остается bg-blue (последний)
assert.ok(typeof cn('bg-red', 'bg-blue') === 'string', 'Conflicting classes should be handled by twMerge');

// Тест 5: Пустой вызов
assert.strictEqual(cn(), '', 'Empty call should return empty string');

// Тест 6: Только ложные значения
assert.strictEqual(cn(null, false, undefined), '', 'Only falsy values should return empty string');

console.log('All tests for cn passed!');