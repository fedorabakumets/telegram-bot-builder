import { strict as assert } from 'assert';
import { getParseMode } from '../format/getParseMode';

/**
 * Тестирование функции getParseMode
 * 
 * Эта функция возвращает строку с параметром parse_mode для Telegram бота.
 */
console.log('Running tests for getParseMode...');

// Тест 1: HTML формат
const htmlResult = getParseMode('html');
assert.ok(htmlResult.includes('parse_mode=ParseMode.HTML'), 'HTML format should return correct parse_mode');

// Тест 2: Markdown формат
const markdownResult = getParseMode('markdown');
assert.ok(markdownResult.includes('parse_mode=ParseMode.MARKDOWN'), 'Markdown format should return correct parse_mode');

// Тест 3: Текстовый формат (без парсинга)
const textResult = getParseMode('text');
assert.strictEqual(textResult.trim(), '', 'Text format should return empty string');

// Тест 4: Неизвестный формат
const unknownResult = getParseMode('unknown');
assert.strictEqual(unknownResult.trim(), '', 'Unknown format should return empty string');

// Тест 5: Пустой формат
const emptyResult = getParseMode('');
assert.strictEqual(emptyResult.trim(), '', 'Empty format should return empty string');

// Тест 6: Проверка, что результат содержит правильный parse_mode для HTML
assert.ok(getParseMode('html').includes('parse_mode=ParseMode.HTML'), 'HTML format should contain correct parse_mode');

// Тест 7: Проверка, что результат содержит правильный parse_mode для Markdown
assert.ok(getParseMode('markdown').includes('parse_mode=ParseMode.MARKDOWN'), 'Markdown format should contain correct parse_mode');

// Тест 8: Регистрозависимость
assert.strictEqual(getParseMode('HTML'), '', 'Uppercase HTML should return empty string');
assert.strictEqual(getParseMode('MARKDOWN'), '', 'Uppercase MARKDOWN should return empty string');

console.log('All tests for getParseMode passed!');