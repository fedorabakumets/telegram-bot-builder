import { strict as assert } from 'assert';
import { generateRequirementsTxt } from '../scaffolding/generateRequirementsTxt';

/**
 * Тестирование функции generateRequirementsTxt
 * 
 * Эта функция генерирует содержимое файла requirements.txt для бота.
 */
console.log('Running tests for generateRequirementsTxt...');

// Тест 1: Проверка, что функция возвращает строку
const requirements = generateRequirementsTxt();
assert.strictEqual(typeof requirements, 'string', 'Function should return a string');

// Тест 2: Проверка, что строка не пустая
assert.notStrictEqual(requirements.length, 0, 'Requirements should not be empty');

// Тест 3: Проверка наличия основных зависимостей
assert.ok(requirements.includes('aiogram'), 'Requirements should include aiogram');
assert.ok(requirements.includes('aiohttp'), 'Requirements should include aiohttp');
assert.ok(requirements.includes('requests'), 'Requirements should include requests');

// Тест 4: Проверка наличия комментариев
assert.ok(requirements.includes('# Telegram Bot Requirements'), 'Requirements should include header comment');
assert.ok(requirements.includes('# Install with: pip install -r requirements.txt'), 'Requirements should include installation instructions');

// Тест 5: Проверка наличия конкретных версий
assert.ok(requirements.includes('aiogram>=3.21.0'), 'Requirements should include aiogram with version');
assert.ok(requirements.includes('aiohttp>=3.12.13'), 'Requirements should include aiohttp with version');

// Тест 6: Проверка, что каждая строка содержит информацию
const lines = requirements.split('\n');
const nonEmptyLines = lines.filter(line => line.trim() !== '');
assert.ok(nonEmptyLines.length > 10, 'Requirements should have multiple non-empty lines');

// Тест 7: Проверка наличия опциональных зависимостей в комментариях
assert.ok(requirements.includes('# redis>=5.0.1'), 'Requirements should include commented optional dependencies');
assert.ok(requirements.includes('# motor>=3.3.2'), 'Requirements should include commented optional dependencies');

console.log('All tests for generateRequirementsTxt passed!');