import { strict as assert } from 'assert';
import { stripHtmlTags } from '../format/stripHtmlTags';

/**
 * Тестирование функции stripHtmlTags
 *
 * Эта серия тестов проверяет различные сценарии использования функции stripHtmlTags,
 * которая предназначена для удаления HTML-тегов из текста.
 */
console.log('Running tests for stripHtmlTags...');

// Тест 1: Удаление базовых HTML тегов
// Проверяем, что функция корректно удаляет простые HTML-теги
assert.strictEqual(stripHtmlTags('<b>Жирный текст</b>'), 'Жирный текст', 'Basic HTML tags removal failed');
assert.strictEqual(stripHtmlTags('<p>Абзац <i>с курсивом</i></p>'), 'Абзац с курсивом', 'Nested HTML tags removal failed');

// Тест 2: Обработка вложенных HTML тегов
// Проверяем, что функция корректно обрабатывает вложенные теги
assert.strictEqual(stripHtmlTags('<div><p>Текст <strong>внутри</strong> тега</p></div>'), 'Текст внутри тега', 'Deep nested tags removal failed');

// Тест 3: Без изменений при отсутствии HTML тегов
// Проверяем, что текст без HTML-тегов остается без изменений
assert.strictEqual(stripHtmlTags('Обычный текст'), 'Обычный текст', 'Plain text should remain unchanged');
assert.strictEqual(stripHtmlTags('Text with < symbols but no tags'), 'Text with < symbols but no tags', 'Text with < symbol should remain unchanged');
assert.strictEqual(stripHtmlTags('Text with > symbols but no tags'), 'Text with > symbols but no tags', 'Text with > symbol should remain unchanged');

// Тест 4: Обработка пустой строки
// Проверяем, что пустая строка остается пустой
assert.strictEqual(stripHtmlTags(''), '', 'Empty string should remain empty');

// Тест 5: Обработка текста с атрибутами в тегах
// Проверяем, что функция корректно удаляет теги с атрибутами
assert.strictEqual(stripHtmlTags('<span class="highlight">Выделенный текст</span>'), 'Выделенный текст', 'HTML tags with attributes removal failed');
assert.strictEqual(stripHtmlTags('<div id="main" data-value="test">Контент</div>'), 'Контент', 'HTML tags with multiple attributes removal failed');

// Тест 6: Граничные случаи
// Проверяем, как функция обрабатывает нестандартные случаи
assert.strictEqual(stripHtmlTags('<>'), '', 'Angle brackets without tag name should be removed');
assert.strictEqual(stripHtmlTags('<tag without closing'), '<tag without closing', 'Malformed tag without closing bracket should remain');
assert.strictEqual(stripHtmlTags('text < tag > text'), 'text  text', 'Text with angle brackets that form a tag-like pattern should have the pattern removed');

// Тест 7: Специальные символы и пробелы
// Проверяем, что функция корректно обрабатывает пробелы и специальные символы
assert.strictEqual(stripHtmlTags('  <p>  Text with spaces  </p>  '), '    Text with spaces    ', 'Whitespace inside tags should be removed but outer whitespace preserved');
assert.strictEqual(stripHtmlTags('<br/><hr/>'), '', 'Self-closing tags should be removed');

// Тест 8: Комплексные сценарии
// Проверяем сложные сценарии с множественными тегами и различным содержимым
assert.strictEqual(stripHtmlTags('<div class="container"><h1>Заголовок</h1><p>Параграф с <a href="#">ссылкой</a>.</p></div>'), 'ЗаголовокПараграф с ссылкой.', 'Complex HTML structure should be processed correctly');

console.log('All tests passed!');