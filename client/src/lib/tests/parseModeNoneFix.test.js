import { strict as assert } from 'assert';
import { generateAttachedMediaSendCode } from '../MediaHandler/generateAttachedMediaSendCode';

/**
 * Тест для проверки исправления генерации ParseMode.NONE в generateAttachedMediaSendCode
 * 
 * Проблема: когда parseMode был пустым или не указан, функция генерировала 
 * код типа "parse_mode=ParseMode." или "parse_mode=ParseMode.NONE", что вызывало ошибку.
 * 
 * Решение: теперь parse_mode добавляется только если parseMode не пустой.
 */

console.log('Running tests for ParseMode.NONE fix in generateAttachedMediaSendCode...');

// Тест 1: Проверяем, что пустой parseMode не генерирует ParseMode.NONE
const mediaVariablesMap = new Map([
  ['image_url_test1', { type: 'photo', variable: 'image_url_test1' }]
]);

const codeWithEmptyParseMode = generateAttachedMediaSendCode(
  ['image_url_test1'],
  mediaVariablesMap,
  'Test message',
  '', // пустой parseMode
  'keyboard',
  'test_node',
  '    ',
  undefined,
  true,
  undefined,
  'message'
);

console.log('Generated code with empty parseMode:');
console.log(codeWithEmptyParseMode.substring(0, 500));

// Проверяем, что нет "ParseMode." без значения
assert.ok(!codeWithEmptyParseMode.includes('parse_mode=ParseMode.'), 
  'Should not generate "parse_mode=ParseMode." without value');

// Проверяем, что нет "ParseMode.NONE"
assert.ok(!codeWithEmptyParseMode.includes('ParseMode.NONE'), 
  'Should not generate "ParseMode.NONE"');

// Тест 2: Проверяем, что HTML формат генерируется правильно
const codeWithHtmlParseMode = generateAttachedMediaSendCode(
  ['image_url_test2'],
  new Map([['image_url_test2', { type: 'photo', variable: 'image_url_test2' }]]),
  'Test message',
  'HTML',
  'keyboard',
  'test_node',
  '    ',
  undefined,
  true,
  undefined,
  'message'
);

console.log('\nGenerated code with HTML parseMode:');
console.log(codeWithHtmlParseMode.substring(0, 500));

assert.ok(codeWithHtmlParseMode.includes('parse_mode=ParseMode.HTML'), 
  'Should generate "parse_mode=ParseMode.HTML" for HTML format');

assert.ok(!codeWithHtmlParseMode.includes('ParseMode.NONE'), 
  'Should not generate "ParseMode.NONE" for HTML format');

// Тест 3: Проверяем, что Markdown формат генерируется правильно
const codeWithMarkdownParseMode = generateAttachedMediaSendCode(
  ['image_url_test3'],
  new Map([['image_url_test3', { type: 'photo', variable: 'image_url_test3' }]]),
  'Test message',
  'markdown',
  'keyboard',
  'test_node',
  '    ',
  undefined,
  true,
  undefined,
  'message'
);

console.log('\nGenerated code with markdown parseMode:');
console.log(codeWithMarkdownParseMode.substring(0, 500));

assert.ok(codeWithMarkdownParseMode.includes('parse_mode=ParseMode.MARKDOWN'), 
  'Should generate "parse_mode=ParseMode.MARKDOWN" for markdown format');

assert.ok(!codeWithMarkdownParseMode.includes('ParseMode.NONE'), 
  'Should not generate "ParseMode.NONE" for markdown format');

// Тест 4: Проверяем, что статическое изображение с пустым parseMode не генерирует ParseMode.NONE
const codeStaticImageEmpty = generateAttachedMediaSendCode(
  [],
  new Map(),
  'Test message',
  '', // пустой parseMode
  'keyboard',
  'test_node',
  '    ',
  undefined,
  true,
  { imageUrl: 'https://example.com/image.jpg' },
  'message'
);

console.log('\nGenerated code for static image with empty parseMode:');
console.log(codeStaticImageEmpty.substring(0, 500));

assert.ok(!codeStaticImageEmpty.includes('ParseMode.NONE'), 
  'Should not generate "ParseMode.NONE" for static image with empty parseMode');

assert.ok(!codeStaticImageEmpty.includes('parse_mode=ParseMode.'), 
  'Should not generate "parse_mode=ParseMode." without value');

// Тест 5: Проверяем, что статическое изображение с HTML форматом генерируется правильно
const codeStaticImageHtml = generateAttachedMediaSendCode(
  [],
  new Map(),
  'Test message',
  'HTML',
  'keyboard',
  'test_node',
  '    ',
  undefined,
  true,
  { imageUrl: 'https://example.com/image.jpg' },
  'message'
);

console.log('\nGenerated code for static image with HTML parseMode:');
console.log(codeStaticImageHtml.substring(0, 500));

assert.ok(codeStaticImageHtml.includes('parse_mode=ParseMode.HTML'), 
  'Should generate "parse_mode=ParseMode.HTML" for static image with HTML format');

// Тест 6: Проверяем fallback (когда медиа не найдено) с пустым parseMode
const codeFallbackEmpty = generateAttachedMediaSendCode(
  ['nonexistent_media'],
  new Map(),
  'Test message',
  '', // пустой parseMode
  'keyboard',
  'test_node',
  '    ',
  undefined,
  true,
  undefined,
  'message'
);

console.log('\nGenerated code for fallback with empty parseMode:');
console.log(codeFallbackEmpty.substring(0, 500));

assert.ok(!codeFallbackEmpty.includes('ParseMode.NONE'), 
  'Should not generate "ParseMode.NONE" in fallback with empty parseMode');

assert.ok(!codeFallbackEmpty.includes('parse_mode=ParseMode.'), 
  'Should not generate "parse_mode=ParseMode." without value in fallback');

// Тест 7: Проверяем, что разные типы медиа не генерируют ParseMode.NONE
const mediaTypes = ['photo', 'video', 'audio', 'document'];

mediaTypes.forEach(mediaType => {
  const code = generateAttachedMediaSendCode(
    [`test_${mediaType}`],
    new Map([[`test_${mediaType}`, { type: mediaType, variable: `test_${mediaType}` }]]),
    'Test message',
    '', // пустой parseMode
    'keyboard',
    'test_node',
    '    ',
    undefined,
    true,
    undefined,
    'message'
  );

  assert.ok(!code.includes('ParseMode.NONE'), 
    `Should not generate "ParseMode.NONE" for ${mediaType} with empty parseMode`);
  
  assert.ok(!code.includes('parse_mode=ParseMode.'), 
    `Should not generate "parse_mode=ParseMode." without value for ${mediaType}`);
});

console.log('\nAll tests for ParseMode.NONE fix passed!');
