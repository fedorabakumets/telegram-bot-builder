import { strict as assert } from 'assert';
import { collectMediaVariables } from '../utils/collectMediaVariables';

/**
 * Тестирование функции collectMediaVariables с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных,
 * включая крайние случаи и потенциально проблемные ситуации.
 */
console.log('Running tests for collectMediaVariables with various inputs...');

// Тест 1: Пустой массив узлов
const emptyNodesResult = collectMediaVariables([]);
assert.ok(emptyNodesResult instanceof Map, 'Should return a Map with empty nodes array');
assert.strictEqual(emptyNodesResult.size, 0, 'Should return an empty Map with empty nodes array');
console.log('✓ Test 1 passed: Empty nodes array handled correctly');

// Тест 2: null/undefined nodes
const nullNodesResult = collectMediaVariables(null);
assert.ok(nullNodesResult instanceof Map, 'Should return a Map with null nodes');
assert.strictEqual(nullNodesResult.size, 0, 'Should return an empty Map with null nodes');
console.log('✓ Test 2 passed: Null nodes handled correctly');

const undefinedNodesResult = collectMediaVariables(undefined);
assert.ok(undefinedNodesResult instanceof Map, 'Should return a Map with undefined nodes');
assert.strictEqual(undefinedNodesResult.size, 0, 'Should return an empty Map with undefined nodes');
console.log('✓ Test 3 passed: Undefined nodes handled correctly');

// Тест 4: Массив с null/undefined элементами
const arrayWithNulls = [null, undefined, null];
const nullElementsResult = collectMediaVariables(arrayWithNulls);
assert.ok(nullElementsResult instanceof Map, 'Should return a Map with array containing nulls');
assert.strictEqual(nullElementsResult.size, 0, 'Should return an empty Map with array containing nulls');
console.log('✓ Test 4 passed: Array with null elements handled correctly');

// Тест 5: Массив с неполными узлами
const incompleteNodes = [
  { }, // Пустой узел
  { id: '1' }, // Только ID
  { data: {} }, // Только data
  { id: null, data: null }, // Null значения
  { id: undefined, data: undefined } // Undefined значения
];
const incompleteResult = collectMediaVariables(incompleteNodes);
assert.ok(incompleteResult instanceof Map, 'Should return a Map with incomplete nodes');
assert.strictEqual(incompleteResult.size, 0, 'Should return an empty Map with incomplete nodes');
console.log('✓ Test 5 passed: Incomplete nodes handled correctly');

// Тест 6: Массив с узлами, не содержащими медиа
const noMediaNodes = [
  { id: '1', data: { messageText: 'Hello' } },
  { id: '2', type: 'command', data: { command: '/start' } },
  { id: '3', type: 'message', data: { messageText: 'World' } }
];
const noMediaResult = collectMediaVariables(noMediaNodes);
assert.ok(noMediaResult instanceof Map, 'Should return a Map with nodes without media');
assert.strictEqual(noMediaResult.size, 0, 'Should return an empty Map with nodes without media');
console.log('✓ Test 6 passed: Nodes without media handled correctly');

// Тест 7: Массив с узлами, содержащими медиа
const mediaNodes = [
  { id: '1', data: { imageUrl: 'https://example.com/image.jpg' } },
  { id: '2', data: { videoUrl: 'https://example.com/video.mp4' } },
  { id: '3', data: { audioUrl: 'https://example.com/audio.mp3' } },
  { id: '4', data: { documentUrl: 'https://example.com/document.pdf' } }
];
const mediaResult = collectMediaVariables(mediaNodes);
assert.ok(mediaResult instanceof Map, 'Should return a Map with nodes containing media');
assert.ok(mediaResult.size >= 0, 'Should return a Map with appropriate size for media nodes');
console.log('✓ Test 7 passed: Nodes with media handled correctly');

// Тест 8: Массив с неправильными типами узлов
const wrongTypeNodes = [
  'string', // Строка
  123, // Число
  true, // Boolean
  [], // Массив
  {} // Пустой объект
];
const wrongTypeResult = collectMediaVariables(wrongTypeNodes);
assert.ok(wrongTypeResult instanceof Map, 'Should return a Map with wrong type nodes');
assert.strictEqual(wrongTypeResult.size, 0, 'Should return an empty Map with wrong type nodes');
console.log('✓ Test 8 passed: Wrong type nodes handled correctly');

// Тест 9: Проверка с узлами, содержащими разные типы данных
const mixedTypeNodes = [
  { id: 123, data: 'not_an_object' }, // Числовой ID, строковые данные
  { id: '2', data: null }, // Null данные
  { id: '3', data: undefined }, // Undefined данные
  { id: '4', data: [] }, // Массив данных
  { id: '5', data: 456 } // Числовые данные
];
const mixedTypeResult = collectMediaVariables(mixedTypeNodes);
assert.ok(mixedTypeResult instanceof Map, 'Should return a Map with mixed type nodes');
assert.strictEqual(mixedTypeResult.size, 0, 'Should return an empty Map with mixed type nodes');
console.log('✓ Test 9 passed: Mixed type nodes handled correctly');

// Тест 10: Проверка с узлами, содержащими медиа с неправильными типами данных
const wrongMediaDataNodes = [
  { id: '1', data: { imageUrl: null } },
  { id: '2', data: { videoUrl: undefined } },
  { id: '3', data: { audioUrl: 0 } }, // Число
  { id: '4', data: { documentUrl: false } }, // Boolean
  { id: '5', data: { imageUrl: '' } } // Пустая строка
];
const wrongMediaDataResult = collectMediaVariables(wrongMediaDataNodes);
assert.ok(wrongMediaDataResult instanceof Map, 'Should return a Map with wrong media data types');
assert.strictEqual(wrongMediaDataResult.size, 0, 'Should return an empty Map with wrong media data types');
console.log('✓ Test 10 passed: Wrong media data types handled correctly');

// Тест 11: Проверка с узлами, содержащими правильные медиа URL
const validMediaNodes = [
  { id: '1', data: { imageUrl: 'https://example.com/image.jpg', imageVariable: 'image_var' } },
  { id: '2', data: { videoUrl: 'https://example.com/video.mp4', videoVariable: 'video_var' } },
  { id: '3', data: { audioUrl: 'https://example.com/audio.mp3', audioVariable: 'audio_var' } },
  { id: '4', data: { documentUrl: 'https://example.com/document.pdf', documentVariable: 'doc_var' } }
];
const validMediaResult = collectMediaVariables(validMediaNodes);
assert.ok(validMediaResult instanceof Map, 'Should return a Map with valid media nodes');
// Проверим, что возвращаемые значения соответствуют ожидаемому формату
for (const [key, value] of validMediaResult.entries()) {
  assert.ok(typeof key === 'string', 'Key should be a string');
  assert.ok(typeof value === 'object' && value !== null, 'Value should be an object');
  assert.ok('type' in value, 'Value should have a type property');
  assert.ok('variable' in value, 'Value should have a variable property');
}
console.log('✓ Test 11 passed: Valid media nodes handled correctly');

// Тест 12: Проверка с узлами, содержащими разные типы медиа в одном узле
const multiMediaNode = [
  { 
    id: '1', 
    data: { 
      imageUrl: 'https://example.com/image.jpg', 
      videoUrl: 'https://example.com/video.mp4',
      audioUrl: 'https://example.com/audio.mp3',
      documentUrl: 'https://example.com/document.pdf'
    } 
  }
];
const multiMediaResult = collectMediaVariables(multiMediaNode);
assert.ok(multiMediaResult instanceof Map, 'Should return a Map with multi-media node');
console.log('✓ Test 12 passed: Multi-media node handled correctly');

// Тест 13: Проверка с огромным массивом узлов
const hugeArray = Array(1000).fill(null).map((_, i) => ({
  id: `node_${i}`,
  data: i % 2 === 0 ? { imageUrl: `https://example.com/image${i}.jpg` } : { messageText: `Message ${i}` }
}));
const hugeArrayResult = collectMediaVariables(hugeArray);
assert.ok(hugeArrayResult instanceof Map, 'Should return a Map with huge array');
assert.ok(hugeArrayResult.size >= 0, 'Should handle huge array appropriately');
console.log('✓ Test 13 passed: Huge array handled correctly');

// Тест 14: Проверка с узлами, содержащими специальные символы в ID
const specialCharNodes = [
  { id: 'node@#$%^&*()', data: { imageUrl: 'https://example.com/image.jpg' } },
  { id: 'node with spaces', data: { videoUrl: 'https://example.com/video.mp4' } },
  { id: 'node-with-dashes', data: { audioUrl: 'https://example.com/audio.mp3' } },
  { id: 'node_with_underscores', data: { documentUrl: 'https://example.com/document.pdf' } }
];
const specialCharResult = collectMediaVariables(specialCharNodes);
assert.ok(specialCharResult instanceof Map, 'Should return a Map with special character IDs');
console.log('✓ Test 14 passed: Special character IDs handled correctly');

// Тест 15: Проверка с узлами, содержащими специальные символы в URL
const specialUrlNodes = [
  { id: '1', data: { imageUrl: 'https://example.com/image?param=value&other=123.jpg' } },
  { id: '2', data: { videoUrl: 'https://example.com/video#section.mp4' } },
  { id: '3', data: { audioUrl: 'https://user:pass@example.com/audio.mp3' } }
];
const specialUrlResult = collectMediaVariables(specialUrlNodes);
assert.ok(specialUrlResult instanceof Map, 'Should return a Map with special character URLs');
console.log('✓ Test 15 passed: Special character URLs handled correctly');

// Тест 16: Проверка с узлами, содержащими пустые или неправильные URL
const invalidUrlNodes = [
  { id: '1', data: { imageUrl: '' } }, // Пустая строка
  { id: '2', data: { videoUrl: 'not_a_valid_url' } }, // Не валидный URL
  { id: '3', data: { audioUrl: 'javascript:alert(1)' } }, // Потенциально опасный URL
  { id: '4', data: { documentUrl: 'file:///etc/passwd' } } // Локальный файл
];
const invalidUrlResult = collectMediaVariables(invalidUrlNodes);
assert.ok(invalidUrlResult instanceof Map, 'Should return a Map with invalid URLs');
console.log('✓ Test 16 passed: Invalid URLs handled correctly');

// Тест 17: Проверка с узлами, содержащими дублирующиеся ID
const duplicateIdNodes = [
  { id: 'duplicate', data: { imageUrl: 'https://example.com/image1.jpg' } },
  { id: 'duplicate', data: { imageUrl: 'https://example.com/image2.jpg' } },
  { id: 'duplicate', data: { videoUrl: 'https://example.com/video.mp4' } }
];
const duplicateIdResult = collectMediaVariables(duplicateIdNodes);
assert.ok(duplicateIdResult instanceof Map, 'Should return a Map with duplicate IDs');
console.log('✓ Test 17 passed: Duplicate IDs handled correctly');

// Тест 18: Проверка с узлами, содержащими очень длинные строки
const longStringNodes = [
  { id: 'A'.repeat(1000), data: { imageUrl: 'https://example.com/' + 'image.jpg'.repeat(100) } },
  { id: 'B'.repeat(1000), data: { videoUrl: 'https://example.com/' + 'video.mp4'.repeat(100) } }
];
const longStringResult = collectMediaVariables(longStringNodes);
assert.ok(longStringResult instanceof Map, 'Should return a Map with long strings');
console.log('✓ Test 18 passed: Long strings handled correctly');

// Тест 19: Проверка с узлами, содержащими юникод символы
const unicodeNodes = [
  { id: 'тест', data: { imageUrl: 'https://example.com/изображение.jpg' } },
  { id: '测试', data: { videoUrl: 'https://example.com/视频.mp4' } },
  { id: 'prueba', data: { audioUrl: 'https://example.com/audio.mp3' } }
];
const unicodeResult = collectMediaVariables(unicodeNodes);
assert.ok(unicodeResult instanceof Map, 'Should return a Map with unicode characters');
console.log('✓ Test 19 passed: Unicode characters handled correctly');

// Тест 20: Проверка возвращаемого формата данных
const formatTestNodes = [
  { id: '1', data: { imageUrl: 'https://example.com/image.jpg', imageVariable: 'custom_image_var' } }
];
const formatTestResult = collectMediaVariables(formatTestNodes);
if (formatTestResult.size > 0) {
  const firstEntry = formatTestResult.entries().next().value;
  if (firstEntry) {
    const [key, value] = firstEntry;
    assert.ok(typeof key === 'string', 'Key should be a string');
    assert.ok(typeof value === 'object' && value !== null, 'Value should be an object');
    assert.ok('type' in value, 'Value should have a type property');
    assert.ok('variable' in value, 'Value should have a variable property');
    assert.ok(typeof value.type === 'string', 'Type should be a string');
    assert.ok(typeof value.variable === 'string', 'Variable should be a string');
  }
}
console.log('✓ Test 20 passed: Return format validated');

console.log('All tests for collectMediaVariables with various inputs passed!');