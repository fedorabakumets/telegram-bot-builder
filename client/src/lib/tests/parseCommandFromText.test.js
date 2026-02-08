import { strict as assert } from 'assert';
import { parseCommandFromText } from '../commands';

/**
 * Тестирование функции parseCommandFromText
 * 
 * Эта функция извлекает команду из текста.
 */
console.log('Running tests for parseCommandFromText...');

// Тест 1: Текст без команды
assert.strictEqual(parseCommandFromText('Just text'), null, 'Text without command should return null');

// Тест 2: Текст с командой /start
assert.strictEqual(parseCommandFromText('/start'), '/start', 'Text with /start should return /start');

// Тест 3: Текст с командой и дополнительным текстом
assert.strictEqual(parseCommandFromText('/start param'), '/start', 'Text with command and params should return command only');

// Тест 4: Текст, начинающийся с /, но не команда
assert.strictEqual(parseCommandFromText('/'), null, 'Just / should return null');

// Тест 5: Текст с командой, содержащей цифры
assert.strictEqual(parseCommandFromText('/menu123'), '/menu123', 'Command with numbers should be parsed correctly');

// Тест 6: Текст с командой, содержащей подчеркивание
assert.strictEqual(parseCommandFromText('/my_command'), '/my_command', 'Command with underscore should be parsed correctly');

// Тест 7: Пустой текст
assert.strictEqual(parseCommandFromText(''), null, 'Empty text should return null');

// Тест 8: Undefined
assert.strictEqual(parseCommandFromText(undefined), null, 'Undefined should return null');

// Тест 9: Null
assert.strictEqual(parseCommandFromText(null), null, 'Null should return null');

// Тест 10: Команда с недопустимыми символами
assert.strictEqual(parseCommandFromText('/my-command'), '/my', 'Command with invalid character should be parsed up to that point');

// Тест 11: Команда с заглавными буквами
assert.strictEqual(parseCommandFromText('/START'), '/START', 'Uppercase command should be parsed correctly');

// Тест 12: Команда с пробелом перед ней
assert.strictEqual(parseCommandFromText(' /start'), null, 'Command with leading space should return null');

console.log('All tests for parseCommandFromText passed!');