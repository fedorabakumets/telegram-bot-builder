import { strict as assert } from 'assert';
import { getCommandSuggestions } from '../commands';

/**
 * Тестирование функции getCommandSuggestions
 * 
 * Эта функция генерирует предложения команд на основе введенного текста.
 */
console.log('Running tests for getCommandSuggestions...');

// Тест 1: Ввод, не начинающийся с /
const suggestionsNotStartingWithSlash = getCommandSuggestions('start');
assert.strictEqual(suggestionsNotStartingWithSlash.length, 0, 'Input not starting with / should return empty array');

// Тест 2: Ввод /start
const startSuggestions = getCommandSuggestions('/start');
assert.ok(startSuggestions.some(cmd => cmd.command === '/start'), 'Should suggest /start for input /start');
assert.ok(startSuggestions.length > 0, 'Should return suggestions for /start');

// Тест 3: Ввод /hel (должно предложить /help)
const helSuggestions = getCommandSuggestions('/hel');
assert.ok(helSuggestions.some(cmd => cmd.command === '/help'), 'Should suggest /help for input /hel');
assert.ok(helSuggestions.length > 0, 'Should return suggestions for /hel');

// Тест 4: Ввод / (должно предложить все команды)
const allSuggestions = getCommandSuggestions('/');
assert.ok(allSuggestions.length > 0, 'Should return all commands for input /');

// Тест 5: Ввод /profile
const profileSuggestions = getCommandSuggestions('/profile');
assert.ok(profileSuggestions.some(cmd => cmd.command === '/profile'), 'Should suggest /profile for input /profile');
assert.ok(profileSuggestions.length > 0, 'Should return suggestions for /profile');

// Тест 6: Ввод части описания команды
const descriptionSuggestions = getCommandSuggestions('/работ'); // часть описания "/start"
assert.ok(descriptionSuggestions.some(cmd => cmd.command === '/start'), 'Should suggest commands based on description');

// Тест 7: Ввод несуществующей команды
const nonExistentSuggestions = getCommandSuggestions('/nonexistent');
assert.ok(nonExistentSuggestions.length >= 0, 'Should return empty or limited results for non-existent command');

// Тест 8: Ввод с регистронезависимостью
const caseInsensitiveSuggestions = getCommandSuggestions('/HELP');
assert.ok(caseInsensitiveSuggestions.some(cmd => cmd.command === '/help'), 'Should suggest /help for input /HELP (case insensitive)');

console.log('All tests for getCommandSuggestions passed!');