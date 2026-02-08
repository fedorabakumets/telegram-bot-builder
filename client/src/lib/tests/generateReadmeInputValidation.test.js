import { strict as assert } from 'assert';
import { generateReadme } from '../scaffolding/generateReadme';

/**
 * Тестирование функции generateReadme с различными входными данными
 * 
 * Этот тест проверяет, как функция обрабатывает различные сценарии входных данных.
 */
console.log('Running tests for generateReadme with various inputs...');

// Тест 1: Пустые данные
const emptyData = { nodes: [], connections: [] };
const emptyReadme = generateReadme(emptyData, 'TestBot');
assert.ok(emptyReadme.includes('содержит 0 узлов и 0 соединений'), 'Should correctly handle empty data');

// Тест 2: null/undefined botData
const nullReadme = generateReadme(null, 'TestBot');
assert.ok(nullReadme.includes('содержит 0 узлов и 0 соединений'), 'Should handle null botData');

const undefinedReadme = generateReadme(undefined, 'TestBot');
assert.ok(undefinedReadme.includes('содержит 0 узлов и 0 соединений'), 'Should handle undefined botData');

// Тест 3: Только узлы, без соединений
const nodesOnlyData = {
  nodes: [
    { id: '1', type: 'start', data: { command: '/start' } },
    { id: '2', type: 'message', data: { messageText: 'Hello' } }
  ],
  connections: []
};
const nodesOnlyReadme = generateReadme(nodesOnlyData, 'TestBot');
assert.ok(nodesOnlyReadme.includes('содержит 2 узлов и 0 соединений'), 'Should correctly count nodes only');

// Тест 4: Только соединения, без узлов
const connectionsOnlyData = {
  nodes: [],
  connections: [
    { id: 'conn1', source: '1', target: '2' },
    { id: 'conn2', source: '2', target: '3' }
  ]
};
const connectionsOnlyReadme = generateReadme(connectionsOnlyData, 'TestBot');
assert.ok(connectionsOnlyReadme.includes('содержит 0 узлов и 2 соединений'), 'Should correctly count connections only');

// Тест 5: Узлы разных типов
const mixedNodesData = {
  nodes: [
    { id: '1', type: 'start', data: { command: '/start' } },
    { id: '2', type: 'command', data: { command: '/help', description: 'Help command' } },
    { id: '3', type: 'message', data: { messageText: 'Hello' } },
    { id: '4', type: 'action', data: { action: 'something' } }
  ],
  connections: [
    { id: 'conn1', source: '1', target: '2' }
  ]
};
const mixedReadme = generateReadme(mixedNodesData, 'TestBot');
assert.ok(mixedReadme.includes('содержит 4 узлов и 1 соединений'), 'Should correctly count mixed node types');
assert.ok(mixedReadme.includes('Команд**: 2'), 'Should correctly count command nodes');
assert.ok(mixedReadme.includes('Сообщений**: 1'), 'Should correctly count message nodes');

// Тест 6: Узлы с кнопками
const nodesWithButtonsData = {
  nodes: [
    { id: '1', type: 'message', data: { messageText: 'Choose option', buttons: [{ text: 'Option 1', action: 'goto' }, { text: 'Option 2', action: 'goto' }] } },
    { id: '2', type: 'command', data: { command: '/test', buttons: [{ text: 'Submit', action: 'submit' }] } }
  ],
  connections: []
};
const buttonsReadme = generateReadme(nodesWithButtonsData, 'TestBot');
assert.ok(buttonsReadme.includes('Кнопок**: 3'), 'Should correctly count buttons from all nodes');

// Тест 7: Узлы с различными свойствами
const nodesWithPropsData = {
  nodes: [
    { id: '1', type: 'start', data: { command: '/start', description: 'Start command', adminOnly: true } },
    { id: '2', type: 'command', data: { command: '/user', description: 'User command', isPrivateOnly: true } },
    { id: '3', type: 'command', data: { command: '/auth', description: 'Auth command', requiresAuth: true } }
  ],
  connections: []
};
const propsReadme = generateReadme(nodesWithPropsData, 'TestBot');
assert.ok(propsReadme.includes('`/start` - Start command'), 'Should include command with description');
assert.ok(propsReadme.includes('🔒 Только для администраторов'), 'Should include admin-only indicator');
assert.ok(propsReadme.includes('👤 Только в приватных чатах'), 'Should include private-chat-only indicator');
assert.ok(propsReadme.includes('🔐 Требует авторизации'), 'Should include auth-required indicator');

// Тест 8: Проверка с пустыми полями
const emptyFieldsData = {
  nodes: [
    { id: '1', type: 'start', data: { command: '' } }, // Пустая команда
    { id: '2', type: 'command', data: { command: '/test', description: '' } } // Пустое описание
  ],
  connections: []
};
const emptyFieldsReadme = generateReadme(emptyFieldsData, 'TestBot');
// Проверим, что функция не падает с пустыми полями
assert.strictEqual(typeof emptyFieldsReadme, 'string', 'Should handle empty fields without crashing');

console.log('All tests for generateReadme with various inputs passed!');