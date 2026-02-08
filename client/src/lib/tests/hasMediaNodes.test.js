import { strict as assert } from 'assert';
import { hasMediaNodes } from '../utils/hasMediaNodes';

/**
 * Тестирование функции hasMediaNodes
 * 
 * Эта функция проверяет наличие медиа-файлов в узлах бота.
 */
console.log('Running tests for hasMediaNodes...');

// Тест 1: Пустой массив узлов
assert.strictEqual(hasMediaNodes([]), false, 'Empty nodes array should return false');

// Тест 2: Узлы без медиа
const nodesWithoutMedia = [
  { id: '1', data: { messageText: 'Test' } },
  { id: '2', data: { command: '/help' } }
];
assert.strictEqual(hasMediaNodes(nodesWithoutMedia), false, 'Nodes without media should return false');

// Тест 3: Узлы с фото
const nodesWithPhoto = [
  { id: '1', type: 'photo', data: { messageText: 'Photo' } },
  { id: '2', data: { command: '/help' } }
];
assert.strictEqual(hasMediaNodes(nodesWithPhoto), true, 'Nodes with photo type should return true');

// Тест 4: Узлы с видео
const nodesWithVideo = [
  { id: '1', type: 'video', data: { messageText: 'Video' } }
];
assert.strictEqual(hasMediaNodes(nodesWithVideo), true, 'Nodes with video type should return true');

// Тест 5: Узлы с аудио
const nodesWithAudio = [
  { id: '1', type: 'audio', data: { messageText: 'Audio' } }
];
assert.strictEqual(hasMediaNodes(nodesWithAudio), true, 'Nodes with audio type should return true');

// Тест 6: Узлы с документом
const nodesWithDocument = [
  { id: '1', type: 'document', data: { messageText: 'Document' } }
];
assert.strictEqual(hasMediaNodes(nodesWithDocument), true, 'Nodes with document type should return true');

// Тест 7: Узлы с анимацией
const nodesWithAnimation = [
  { id: '1', type: 'animation', data: { messageText: 'Animation' } }
];
assert.strictEqual(hasMediaNodes(nodesWithAnimation), true, 'Nodes with animation type should return true');

// Тест 8: Узлы с URL изображения
const nodesWithImageUrl = [
  { id: '1', data: { imageUrl: 'https://example.com/image.jpg' } }
];
assert.strictEqual(hasMediaNodes(nodesWithImageUrl), true, 'Nodes with image URL should return true');

// Тест 9: Узлы с URL видео
const nodesWithVideoUrl = [
  { id: '1', data: { videoUrl: 'https://example.com/video.mp4' } }
];
assert.strictEqual(hasMediaNodes(nodesWithVideoUrl), true, 'Nodes with video URL should return true');

// Тест 10: Узлы с URL аудио
const nodesWithAudioUrl = [
  { id: '1', data: { audioUrl: 'https://example.com/audio.mp3' } }
];
assert.strictEqual(hasMediaNodes(nodesWithAudioUrl), true, 'Nodes with audio URL should return true');

// Тест 11: Узлы с URL документа
const nodesWithDocumentUrl = [
  { id: '1', data: { documentUrl: 'https://example.com/document.pdf' } }
];
assert.strictEqual(hasMediaNodes(nodesWithDocumentUrl), true, 'Nodes with document URL should return true');

// Тест 12: Узлы с включенным вводом фото
const nodesWithPhotoInput = [
  { id: '1', data: { enablePhotoInput: true } }
];
assert.strictEqual(hasMediaNodes(nodesWithPhotoInput), true, 'Nodes with photo input enabled should return true');

// Тест 13: Узлы с включенным вводом видео
const nodesWithVideoInput = [
  { id: '1', data: { enableVideoInput: true } }
];
assert.strictEqual(hasMediaNodes(nodesWithVideoInput), true, 'Nodes with video input enabled should return true');

// Тест 14: Узлы с включенным вводом аудио
const nodesWithAudioInput = [
  { id: '1', data: { enableAudioInput: true } }
];
assert.strictEqual(hasMediaNodes(nodesWithAudioInput), true, 'Nodes with audio input enabled should return true');

// Тест 15: Узлы с включенным вводом документа
const nodesWithDocumentInput = [
  { id: '1', data: { enableDocumentInput: true } }
];
assert.strictEqual(hasMediaNodes(nodesWithDocumentInput), true, 'Nodes with document input enabled should return true');

// Тест 16: Смешанные узлы (с и без медиа)
const mixedNodes = [
  { id: '1', data: { messageText: 'Test' } },
  { id: '2', type: 'photo', data: { messageText: 'Photo' } }
];
assert.strictEqual(hasMediaNodes(mixedNodes), true, 'Mixed nodes with at least one media should return true');

console.log('All tests for hasMediaNodes passed!');