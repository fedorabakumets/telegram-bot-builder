import { strict as assert } from 'assert';
import { validateBotStructure } from '../utils/validateBotStructure';

/**
 * Тестирование функции validateBotStructure
 * 
 * Эта функция проверяет корректность структуры бота.
 */
console.log('Running tests for validateBotStructure...');

// Тест 1: Бот без стартового узла
const botWithoutStart = {
  nodes: [{ id: '1', type: 'command', data: { command: '/help', messageText: 'Help message' } }],
  connections: []
};
const resultWithoutStart = validateBotStructure(botWithoutStart);
assert.strictEqual(resultWithoutStart.isValid, false, 'Bot without start node should be invalid');
assert.ok(resultWithoutStart.errors.some(e => e.includes('стартовую команду')), 'Should have error about missing start node');

// Тест 2: Бот с несколькими стартовыми узлами
const botWithMultipleStarts = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { id: 'start2', type: 'start', data: {} },
    { id: '2', type: 'command', data: { command: '/help', messageText: 'Help message' } }
  ],
  connections: []
};
const resultWithMultipleStarts = validateBotStructure(botWithMultipleStarts);
assert.strictEqual(resultWithMultipleStarts.isValid, false, 'Bot with multiple start nodes should be invalid');
assert.ok(resultWithMultipleStarts.errors.some(e => e.includes('только одну стартовую команду')), 'Should have error about multiple start nodes');

// Тест 3: Бот с одним стартовым узлом
const botWithStart = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { id: '2', type: 'command', data: { command: '/help', messageText: 'Help message' } }
  ],
  connections: []
};
const resultWithStart = validateBotStructure(botWithStart);
assert.strictEqual(resultWithStart.isValid, true, 'Bot with one start node should be valid');

// Тест 4: Команда без текста сообщения
const botWithCommandWithoutText = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { id: '2', type: 'command', data: { command: '/help' } } // Нет messageText
  ],
  connections: []
};
const resultWithCommandWithoutText = validateBotStructure(botWithCommandWithoutText);
assert.strictEqual(resultWithCommandWithoutText.isValid, false, 'Command without message text should be invalid');
assert.ok(resultWithCommandWithoutText.errors.some(e => e.includes('должен содержать текст сообщения')), 'Should have error about missing message text');

// Тест 5: Невалидная команда
const botWithInvalidCommand = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { id: '2', type: 'command', data: { command: 'invalid_command', messageText: 'Help message' } }
  ],
  connections: []
};
const resultWithInvalidCommand = validateBotStructure(botWithInvalidCommand);
assert.strictEqual(resultWithInvalidCommand.isValid, false, 'Bot with invalid command should be invalid');
assert.ok(resultWithInvalidCommand.errors.some(e => e.includes('Команда "invalid_command"')), 'Should have error about invalid command');

// Тест 6: Кнопка без текста
const botWithButtonWithoutText = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { 
      id: '2', 
      type: 'command', 
      data: { 
        command: '/help', 
        messageText: 'Help message',
        buttons: [{ text: '', action: 'goto', target: '3' }]
      } 
    }
  ],
  connections: []
};
const resultWithButtonWithoutText = validateBotStructure(botWithButtonWithoutText);
assert.strictEqual(resultWithButtonWithoutText.isValid, false, 'Button without text should be invalid');
assert.ok(resultWithButtonWithoutText.errors.some(e => e.includes('должна содержать текст')), 'Should have error about button without text');

// Тест 7: Кнопка URL без URL
const botWithURLButtonWithoutURL = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { 
      id: '2', 
      type: 'command', 
      data: { 
        command: '/help', 
        messageText: 'Help message',
        buttons: [{ text: 'Link', action: 'url', url: '' }]
      } 
    }
  ],
  connections: []
};
const resultWithURLButtonWithoutURL = validateBotStructure(botWithURLButtonWithoutURL);
assert.strictEqual(resultWithURLButtonWithoutURL.isValid, false, 'URL button without URL should be invalid');
assert.ok(resultWithURLButtonWithoutURL.errors.some(e => e.includes('должна содержать URL')), 'Should have error about URL button without URL');

// Тест 8: Валидная структура бота
const validBot = {
  nodes: [
    { id: 'start1', type: 'start', data: {} },
    { 
      id: '2', 
      type: 'command', 
      data: { 
        command: '/help', 
        messageText: 'Help message',
        buttons: [{ text: 'Button', action: 'goto', target: '3' }]
      } 
    }
  ],
  connections: []
};
const validResult = validateBotStructure(validBot);
assert.strictEqual(validResult.isValid, true, 'Valid bot structure should be valid');
assert.strictEqual(validResult.errors.length, 0, 'Valid bot should have no errors');

console.log('All tests for validateBotStructure passed!');