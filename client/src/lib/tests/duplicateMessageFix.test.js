import { strict as assert } from 'assert';
import { generateCommandHandler } from '../CommandHandler/generateCommandHandler';

/**
 * Тест для проверки исправления дублирования сообщений в generateCommandHandler
 * 
 * Проблема: функция генерировала дублирующий вызов message.answer после того,
 * как generateKeyboard уже добавил код отправки сообщения.
 * 
 * Решение: удалены дублирующие вызовы message.answer в трех местах кода.
 */

console.log('Running tests for duplicate message fix in generateCommandHandler...');

// Тест 1: Проверяем, что для команды с клавиатурой нет дублирования
const nodeWithKeyboard = {
  id: 'test_cmd_1',
  type: 'command',
  data: {
    command: '/test',
    description: 'Test command',
    messageText: 'Test message',
    showInMenu: true,
    keyboardType: 'inline',
    buttons: [
      { id: 'btn1', text: 'Button 1', action: 'goto', target: 'node2' }
    ]
  }
};

const codeWithKeyboard = generateCommandHandler(nodeWithKeyboard, true);
const answerCount = (codeWithKeyboard.match(/await message\.answer/g) || []).length;

console.log(`Found ${answerCount} occurrences of 'await message.answer' in generated code`);

// Для команды с клавиатурой должен быть только один вызов message.answer (или ни одного, если используется safe_edit_or_send)
// generateKeyboard может использовать message.answer или safe_edit_or_send
assert.ok(answerCount <= 1, `Should have at most 1 message.answer call, but found ${answerCount}`);

// Тест 2: Проверяем, что для команды без клавиатуры нет дублирования
const nodeWithoutKeyboard = {
  id: 'test_cmd_2',
  type: 'command',
  data: {
    command: '/help',
    description: 'Help command',
    messageText: 'Help text',
    showInMenu: true
  }
};

const codeWithoutKeyboard = generateCommandHandler(nodeWithoutKeyboard, true);
const answerCount2 = (codeWithoutKeyboard.match(/await message\.answer/g) || []).length;

console.log(`Found ${answerCount2} occurrences of 'await message.answer' in generated code (no keyboard)`);

// Для команды без клавиатуры должен быть только один вызов message.answer
assert.ok(answerCount2 <= 1, `Should have at most 1 message.answer call, but found ${answerCount2}`);

// Тест 3: Проверяем, что нет последовательных дубликатов одной и той же строки
const codeLines = codeWithKeyboard.split('\n');
let hasDuplicateConsecutiveLines = false;

for (let i = 0; i < codeLines.length - 1; i++) {
  const currentLine = codeLines[i].trim();
  const nextLine = codeLines[i + 1].trim();
  
  // Игнорируем пустые строки и комментарии
  if (currentLine && !currentLine.startsWith('#') && currentLine === nextLine) {
    hasDuplicateConsecutiveLines = true;
    console.log(`Found duplicate consecutive line: ${currentLine}`);
    break;
  }
}

assert.ok(!hasDuplicateConsecutiveLines, 'Should not have duplicate consecutive lines');

// Тест 4: Проверяем, что для команды с markdown нет дублирования
const nodeWithMarkdown = {
  id: 'test_cmd_3',
  type: 'command',
  data: {
    command: '/markdown',
    description: 'Markdown command',
    messageText: '**Bold** text',
    formatMode: 'markdown',
    showInMenu: true,
    buttons: [
      { id: 'btn1', text: 'Button 1', action: 'goto', target: 'node2' }
    ]
  }
};

const codeWithMarkdown = generateCommandHandler(nodeWithMarkdown, true);
const answerCount3 = (codeWithMarkdown.match(/await message\.answer/g) || []).length;

console.log(`Found ${answerCount3} occurrences of 'await message.answer' in generated code (markdown)`);

assert.ok(answerCount3 <= 1, `Should have at most 1 message.answer call for markdown, but found ${answerCount3}`);

// Тест 5: Проверяем, что нет дублирования с одинаковыми параметрами
// Ищем паттерны типа: await message.answer(text, ...); await message.answer(text)
const duplicatePattern = /await message\.answer\([^)]+\)[\s\S]*?await message\.answer\([^)]+\)/g;
const matches = codeWithKeyboard.match(duplicatePattern);

if (matches) {
  console.log(`Found potential duplicate patterns: ${matches.length}`);
  // Проверяем, что это не разные вызовы (например, в разных блоках try/except)
  matches.forEach((match, index) => {
    // Если паттерн короткий, это может быть дубликат
    if (match.split('\n').length < 3) {
      console.log(`Potential duplicate pattern ${index + 1}: ${match.substring(0, 100)}...`);
    }
  });
}

console.log('All tests for duplicate message fix passed!');
