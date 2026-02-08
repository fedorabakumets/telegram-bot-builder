import { strict as assert } from 'assert';
import { generateBotFatherCommands } from '../commands';

/**
 * Тестирование функции generateBotFatherCommands
 * 
 * Эта функция генерирует команды для BotFather из узлов бота.
 */
console.log('Running tests for generateBotFatherCommands...');

// Тест 1: Пустой массив узлов
assert.strictEqual(generateBotFatherCommands([]), '', 'Empty nodes array should return empty string');

// Тест 2: Узлы без команд
const nodesWithoutCommands = [
  { id: '1', type: 'message', data: { messageText: 'Test' } },
  { id: '2', type: 'action', data: { action: 'something' } }
];
assert.strictEqual(generateBotFatherCommands(nodesWithoutCommands), '', 'Nodes without commands should return empty string');

// Тест 3: Узлы с командами
const nodesWithCommands = [
  { id: '1', type: 'start', data: { command: '/start', description: 'Start the bot' } },
  { id: '2', type: 'command', data: { command: '/help', description: 'Get help' } }
];
const result3 = generateBotFatherCommands(nodesWithCommands);
assert.ok(result3.includes('start - Start the bot'), 'Should include start command');
assert.ok(result3.includes('help - Get help'), 'Should include help command');

// Тест 4: Узлы с командами, но showInMenu = false
const nodesWithHiddenCommands = [
  { id: '1', type: 'start', data: { command: '/start', description: 'Start the bot', showInMenu: false } },
  { id: '2', type: 'command', data: { command: '/hidden', description: 'Hidden command', showInMenu: false } }
];
assert.strictEqual(generateBotFatherCommands(nodesWithHiddenCommands), '', 'Hidden commands should not be included');

// Тест 5: Узлы с командами, но без описания
const nodesWithoutDescriptions = [
  { id: '1', type: 'start', data: { command: '/start' } },
  { id: '2', type: 'command', data: { command: '/test' } }
];
const result5 = generateBotFatherCommands(nodesWithoutDescriptions);
assert.ok(result5.includes('start - Команда бота'), 'Should use default description for command without description');
assert.ok(result5.includes('test - Команда бота'), 'Should use default description for another command without description');

// Тест 6: Узлы с разными типами
const mixedNodes = [
  { id: '1', type: 'start', data: { command: '/start', description: 'Start the bot' } },
  { id: '2', type: 'message', data: { messageText: 'Just a message' } },
  { id: '3', type: 'command', data: { command: '/help', description: 'Get help' } }
];
const result6 = generateBotFatherCommands(mixedNodes);
assert.ok(result6.includes('start - Start the bot'), 'Should include start command');
assert.ok(result6.includes('help - Get help'), 'Should include help command');
assert.ok(!result6.includes('Just a message'), 'Should not include non-command nodes');

// Тест 7: Узлы с командами, где showInMenu = true
const nodesWithVisibleCommands = [
  { id: '1', type: 'start', data: { command: '/start', description: 'Start the bot', showInMenu: true } },
  { id: '2', type: 'command', data: { command: '/visible', description: 'Visible command', showInMenu: true } }
];
const result7 = generateBotFatherCommands(nodesWithVisibleCommands);
assert.ok(result7.includes('start - Start the bot'), 'Should include visible start command');
assert.ok(result7.includes('visible - Visible command'), 'Should include visible command');

// Тест 8: Узлы с командами, где showInMenu не определен (по умолчанию включено)
const nodesWithUndefinedShowInMenu = [
  { id: '1', type: 'start', data: { command: '/start', description: 'Start the bot' } },
  { id: '2', type: 'command', data: { command: '/test', description: 'Test command' } }
];
const result8 = generateBotFatherCommands(nodesWithUndefinedShowInMenu);
assert.ok(result8.includes('start - Start the bot'), 'Should include command with undefined showInMenu');
assert.ok(result8.includes('test - Test command'), 'Should include another command with undefined showInMenu');

console.log('All tests for generateBotFatherCommands passed!');