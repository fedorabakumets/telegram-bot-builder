import { strict as assert } from 'assert';
import { hasLocationFeatures } from '../utils/hasLocationFeatures';

/**
 * Тестирование функции hasLocationFeatures
 * 
 * Эта функция проверяет наличие геолокационных элементов в боте.
 */
console.log('Running tests for hasLocationFeatures...');

// Тест 1: Пустой массив узлов
assert.strictEqual(hasLocationFeatures([]), false, 'Empty nodes array should return false');

// Тест 2: Узлы без геолокационных функций
const nodesWithoutLocation = [
  { id: '1', type: 'command', data: { messageText: 'Test' } },
  { id: '2', type: 'start', data: { command: '/start' } }
];
assert.strictEqual(hasLocationFeatures(nodesWithoutLocation), false, 'Nodes without location features should return false');

// Тест 3: Узлы с location типом
const nodesWithLocationType = [
  { id: '1', type: 'location', data: { messageText: 'Location' } }
];
assert.strictEqual(hasLocationFeatures(nodesWithLocationType), true, 'Nodes with location type should return true');

// Тест 4: Узлы с кнопками, запрашивающими местоположение
const nodesWithLocationButton = [
  { 
    id: '1', 
    type: 'command', 
    data: { 
      messageText: 'Share location?', 
      buttons: [
        { text: 'Share Location', action: 'location', requestLocation: true }
      ] 
    } 
  }
];
assert.strictEqual(hasLocationFeatures(nodesWithLocationButton), true, 'Nodes with location button should return true');

// Тест 5: Узлы с кнопками, но без запроса местоположения
const nodesWithNonLocationButton = [
  { 
    id: '1', 
    type: 'command', 
    data: { 
      messageText: 'Choose option', 
      buttons: [
        { text: 'Option 1', action: 'goto', target: '2' },
        { text: 'Option 2', action: 'goto', target: '3' }
      ] 
    } 
  }
];
assert.strictEqual(hasLocationFeatures(nodesWithNonLocationButton), false, 'Nodes with non-location buttons should return false');

// Тест 6: Узлы с кнопками, включая контактную кнопку (но не местоположение)
const nodesWithContactButton = [
  { 
    id: '1', 
    type: 'command', 
    data: { 
      messageText: 'Share contact?', 
      buttons: [
        { text: 'Share Contact', action: 'contact', requestContact: true }
      ] 
    } 
  }
];
assert.strictEqual(hasLocationFeatures(nodesWithContactButton), false, 'Nodes with contact button should return false');

// Тест 7: Смешанные узлы (с и без геолокационных функций)
const mixedNodes = [
  { id: '1', type: 'command', data: { messageText: 'Test' } },
  { id: '2', type: 'location', data: { messageText: 'Location' } }
];
assert.strictEqual(hasLocationFeatures(mixedNodes), true, 'Mixed nodes with at least one location feature should return true');

// Тест 8: Узлы с несколькими кнопками, одна из которых запрашивает местоположение
const nodesWithMultipleButtons = [
  { 
    id: '1', 
    type: 'command', 
    data: { 
      messageText: 'Choose action', 
      buttons: [
        { text: 'Option 1', action: 'goto', target: '2' },
        { text: 'Share Location', action: 'location', requestLocation: true },
        { text: 'Option 3', action: 'goto', target: '4' }
      ] 
    } 
  }
];
assert.strictEqual(hasLocationFeatures(nodesWithMultipleButtons), true, 'Nodes with multiple buttons including location should return true');

// Тест 9: Узлы с кнопками, но пустым массивом кнопок
const nodesWithEmptyButtons = [
  { 
    id: '1', 
    type: 'command', 
    data: { 
      messageText: 'Test', 
      buttons: [] 
    } 
  }
];
assert.strictEqual(hasLocationFeatures(nodesWithEmptyButtons), false, 'Nodes with empty buttons array should return false');

// Тест 10: Узлы с кнопками, но без свойства buttons
const nodesWithoutButtonsProperty = [
  { 
    id: '1', 
    type: 'command', 
    data: { 
      messageText: 'Test' 
    } 
  }
];
assert.strictEqual(hasLocationFeatures(nodesWithoutButtonsProperty), false, 'Nodes without buttons property should return false');

console.log('All tests for hasLocationFeatures passed!');