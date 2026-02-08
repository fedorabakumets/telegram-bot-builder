import { strict as assert } from 'assert';
import { validateCommand } from '../utils/validateCommand';

/**
 * Тестирование функции validateCommand
 * 
 * Эта функция проверяет корректность команд Telegram-бота.
 */
console.log('Running tests for validateCommand...');

// Тест 1: Корректная команда
const validResult = validateCommand('/start');
assert.strictEqual(validResult.isValid, true, 'Valid command should return isValid=true');
assert.strictEqual(validResult.errors.length, 0, 'Valid command should have no errors');

// Тест 2: Пустая команда
const emptyResult = validateCommand('');
assert.strictEqual(emptyResult.isValid, false, 'Empty command should return isValid=false');
assert.strictEqual(emptyResult.errors.includes('Команда не может быть пустой'), true, 'Empty command should have appropriate error');

// Тест 3: Команда без слеша
const noSlashResult = validateCommand('start');
assert.strictEqual(noSlashResult.isValid, false, 'Command without slash should return isValid=false');
assert.strictEqual(noSlashResult.errors.includes('Команда должна начинаться с символа "/"'), true, 'Command without slash should have appropriate error');

// Тест 4: Команда короче 2 символов
const shortResult = validateCommand('/');
assert.strictEqual(shortResult.isValid, false, 'Command with only slash should return isValid=false');
assert.strictEqual(shortResult.errors.includes('Команда должна содержать хотя бы один символ после "/"'), true, 'Short command should have appropriate error');

// Тест 5: Команда длиннее 32 символов
const longCommand = '/'.concat('a'.repeat(32)); // 33 символа: / + 32 буквы
const longResult = validateCommand(longCommand);
assert.strictEqual(longResult.isValid, false, 'Long command should return isValid=false');
assert.strictEqual(longResult.errors.includes('Команда не может быть длиннее 32 символов'), true, 'Long command should have appropriate error');

// Тест 6: Команда с недопустимыми символами
const invalidResult = validateCommand('/start@bot');
assert.strictEqual(invalidResult.isValid, false, 'Command with invalid characters should return isValid=false');
assert.strictEqual(invalidResult.errors.includes('Команда может содержать только латинские буквы, цифры и подчёркивания'), true, 'Invalid command should have appropriate error');

// Тест 7: Команда с подчеркиванием
const underscoreResult = validateCommand('/start_bot');
assert.strictEqual(underscoreResult.isValid, true, 'Command with underscore should be valid');
assert.strictEqual(underscoreResult.errors.length, 0, 'Valid command with underscore should have no errors');

// Тест 8: Команда с цифрами
const numericResult = validateCommand('/menu123');
assert.strictEqual(numericResult.isValid, true, 'Command with numbers should be valid');
assert.strictEqual(numericResult.errors.length, 0, 'Valid command with numbers should have no errors');

console.log('All tests for validateCommand passed!');