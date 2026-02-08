import { strict as assert } from 'assert';
import { hasMediaNodes } from '../utils/hasMediaNodes';

/**
 * Тестирование функции hasMediaNodes с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for hasMediaNodes with various inputs...');

// Тест 1: Пустые данные
const emptyResult = hasMediaNodes([]);
assert.strictEqual(emptyResult, false, 'Should return false with empty array');
console.log('✓ Test 1 passed: Empty array handled correctly');

// Тест 2: null/undefined
const nullResult = hasMediaNodes(null);
assert.strictEqual(nullResult, false, 'Should return false with null input');
console.log('✓ Test 2 passed: Null input handled correctly');

const undefinedResult = hasMediaNodes(undefined);
assert.strictEqual(undefinedResult, false, 'Should return false with undefined input');
console.log('✓ Test 3 passed: Undefined input handled correctly');

// Тест 4: Массив с null/undefined элементами
const arrayWithNulls = [null, undefined, null];
const nullsResult = hasMediaNodes(arrayWithNulls);
assert.strictEqual(nullsResult, false, 'Should return false with array containing nulls');
console.log('✓ Test 4 passed: Array with null/undefined elements handled correctly');

// Тест 5: Массив с неполными узлами
const incompleteNodes = [
  { id: '1' }, // Узел без типа и данных
  { type: null }, // Узел с null типом
  { data: undefined }, // Узел с undefined данными
  { id: '2', type: 'message' } // Узел без данных
];
const incompleteResult = hasMediaNodes(incompleteNodes);
assert.strictEqual(incompleteResult, false, 'Should return false with incomplete nodes');
console.log('✓ Test 5 passed: Incomplete nodes handled correctly');

// Тест 6: Узлы с неправильными типами
const wrongTypeNodes = [
  { id: 123, type: 'photo', data: { messageText: 'Photo' } }, // Числовой ID
  { id: '2', type: 456, data: { messageText: 'Invalid type' } }, // Числовой тип
  { id: '3', type: '', data: { messageText: 'Empty type' } }, // Пустой тип
  { id: '4', type: true, data: { messageText: 'Boolean type' } } // Boolean тип
];
const wrongTypeResult = hasMediaNodes(wrongTypeNodes);
// Узел с типом 'photo' должен вернуть true
assert.strictEqual(wrongTypeResult, true, 'Should return true for nodes with media types');
console.log('✓ Test 6 passed: Wrong type nodes handled correctly');

// Тест 7: Узлы с медиа-атрибутами в data
const nodesWithMediaAttributes = [
  { id: '1', data: { imageUrl: 'https://example.com/image.jpg' } },
  { id: '2', data: { videoUrl: 'https://example.com/video.mp4' } },
  { id: '3', data: { audioUrl: 'https://example.com/audio.mp3' } },
  { id: '4', data: { documentUrl: 'https://example.com/doc.pdf' } }
];
const mediaAttrsResult = hasMediaNodes(nodesWithMediaAttributes);
assert.strictEqual(mediaAttrsResult, true, 'Should return true for nodes with media attributes');
console.log('✓ Test 7 passed: Media attributes handled correctly');

// Тест 8: Узлы с включенным вводом медиа
const nodesWithMediaInput = [
  { id: '1', data: { enablePhotoInput: true } },
  { id: '2', data: { enableVideoInput: true } },
  { id: '3', data: { enableAudioInput: true } },
  { id: '4', data: { enableDocumentInput: true } }
];
const mediaInputResult = hasMediaNodes(nodesWithMediaInput);
assert.strictEqual(mediaInputResult, true, 'Should return true for nodes with media input enabled');
console.log('✓ Test 8 passed: Media input flags handled correctly');

// Тест 9: Узлы с неправильными значениями атрибутов
const nodesWithInvalidAttrs = [
  { id: '1', data: { imageUrl: null } },
  { id: '2', data: { videoUrl: undefined } },
  { id: '3', data: { audioUrl: '' } }, // Пустая строка
  { id: '4', data: { documentUrl: 0 } }, // Число
  { id: '5', data: { enablePhotoInput: false } }, // False flag
  { id: '6', data: { enableVideoInput: 'true' } } // Строка вместо boolean
];
const invalidAttrsResult = hasMediaNodes(nodesWithInvalidAttrs);
// Проверим, что функция не падает с неправильными значениями
assert.strictEqual(typeof invalidAttrsResult, 'boolean', 'Should return boolean with invalid attributes');
console.log('✓ Test 9 passed: Invalid attributes handled correctly');

// Тест 10: Узлы с неправильной структурой данных
const malformedNodes = [
  { id: '1', data: 'not_an_object' }, // data как строка
  { id: '2', data: [] }, // data как массив
  { id: '3', data: 123 }, // data как число
  { id: '4', data: null }, // data как null
  { id: '5' } // Нет поля data
];
const malformedResult = hasMediaNodes(malformedNodes);
// Проверим, что функция не падает с неправильной структурой данных
assert.strictEqual(typeof malformedResult, 'boolean', 'Should return boolean with malformed data');
console.log('✓ Test 10 passed: Malformed data handled correctly');

// Тест 11: Смешанные узлы - с и без медиа
const mixedNodes = [
  { id: '1', type: 'message', data: { messageText: 'Regular message' } },
  { id: '2', type: 'photo', data: { messageText: 'Photo' } },
  { id: '3', type: 'command', data: { command: '/help' } },
  { id: '4', data: { imageUrl: 'https://example.com/image.jpg' } }
];
const mixedResult = hasMediaNodes(mixedNodes);
assert.strictEqual(mixedResult, true, 'Should return true when at least one node has media');
console.log('✓ Test 11 passed: Mixed nodes handled correctly');

// Тест 12: Узлы с анимацией
const animationNodes = [
  { id: '1', type: 'animation', data: { messageText: 'Animation' } }
];
const animationResult = hasMediaNodes(animationNodes);
assert.strictEqual(animationResult, true, 'Should return true for animation nodes');
console.log('✓ Test 12 passed: Animation nodes handled correctly');

// Тест 13: Проверка на устойчивость к прототипам и встроенным методам
const prototypePollutedNodes = [
  { id: '1', type: 'message', data: { messageText: 'Test' } },
  { id: '2', type: 'photo', data: { messageText: 'Photo', constructor: { prototype: { toString: 'malicious' } } } }
];
const prototypeResult = hasMediaNodes(prototypePollutedNodes);
// Проверим, что функция не падает при наличии потенциально опасных свойств
assert.strictEqual(typeof prototypeResult, 'boolean', 'Should handle prototype pollution safely');
console.log('✓ Test 13 passed: Prototype pollution handled safely');

console.log('All tests for hasMediaNodes with various inputs passed!');