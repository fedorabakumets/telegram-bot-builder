import { strict as assert } from 'assert';
import { hasInlineButtons } from '../utils/hasInlineButtons';

/**
 * Тестирование функции hasInlineButtons
 * 
 * Эта функция проверяет наличие inline кнопок в узлах бота.
 */
console.log('Running tests for hasInlineButtons...');

// Тест 1: Пустой массив узлов
assert.strictEqual(hasInlineButtons([]), false, 'Empty nodes array should return false');

// Тест 2: Узлы без кнопок
const nodesWithoutButtons = [
  { id: '1', data: { keyboardType: 'inline' } },
  { id: '2', data: { keyboardType: 'reply' } }
];
assert.strictEqual(hasInlineButtons(nodesWithoutButtons), false, 'Nodes without buttons should return false');

// Тест 3: Узлы с reply кнопками
const nodesWithReplyButtons = [
  { id: '1', data: { keyboardType: 'reply', buttons: [{ text: 'Button', action: 'goto' }] } }
];
assert.strictEqual(hasInlineButtons(nodesWithReplyButtons), false, 'Nodes with reply buttons should return false');

// Тест 4: Узлы с inline кнопками
const nodesWithInlineButtons = [
  { id: '1', data: { keyboardType: 'inline', buttons: [{ text: 'Button', action: 'goto' }] } }
];
assert.strictEqual(hasInlineButtons(nodesWithInlineButtons), true, 'Nodes with inline buttons should return true');

// Тест 5: Узлы с inline клавиатурой но без кнопок
const nodesWithInlineKeyboardNoButtons = [
  { id: '1', data: { keyboardType: 'inline', buttons: [] } }
];
assert.strictEqual(hasInlineButtons(nodesWithInlineKeyboardNoButtons), false, 'Inline keyboard without buttons should return false');

// Тест 6: Смешанные узлы (один с inline кнопками, другие без)
const mixedNodes = [
  { id: '1', data: { keyboardType: 'reply', buttons: [{ text: 'Button', action: 'goto' }] } },
  { id: '2', data: { keyboardType: 'inline', buttons: [{ text: 'Inline Button', action: 'goto' }] } }
];
assert.strictEqual(hasInlineButtons(mixedNodes), true, 'Mixed nodes with at least one inline button should return true');

// Тест 7: Узлы с conditionalMessages содержащими кнопки
const nodesWithConditionalButtons = [
  { 
    id: '1', 
    data: { 
      keyboardType: 'reply',
      conditionalMessages: [
        { buttons: [{ text: 'Conditional Button', action: 'goto' }] }
      ]
    } 
  }
];
assert.strictEqual(hasInlineButtons(nodesWithConditionalButtons), true, 'Nodes with conditional buttons should return true');

// Тест 8: Узлы с conditionalMessages без кнопок
const nodesWithConditionalNoButtons = [
  { 
    id: '1', 
    data: { 
      keyboardType: 'reply',
      conditionalMessages: [
        { buttons: [] }
      ]
    } 
  }
];
assert.strictEqual(hasInlineButtons(nodesWithConditionalNoButtons), false, 'Nodes with conditional messages but no buttons should return false');

// Тест 9: Узел с inline клавиатурой и conditionalMessages с кнопками
const nodesWithBothTypes = [
  { 
    id: '1', 
    data: { 
      keyboardType: 'inline',
      buttons: [{ text: 'Inline Button', action: 'goto' }],
      conditionalMessages: [
        { buttons: [{ text: 'Conditional Button', action: 'goto' }] }
      ]
    } 
  }
];
assert.strictEqual(hasInlineButtons(nodesWithBothTypes), true, 'Nodes with both inline and conditional buttons should return true');

console.log('All tests for hasInlineButtons passed!');